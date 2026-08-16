import {describe, it, expect, vi} from 'vitest';
import {LOCAL_SIGNING_RPC_RESPONSES} from './support/local-signing-responses.js';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Regression test for the `addressSigners` key-casing defect.
 *
 * These tests deliberately build a REAL environment (`resolveConfig` →
 * `getChainIdForEnvironment` → `resolveExecutionParams` → `createEnvironment`) rather than
 * a fabricated environment object, because the defect lives in `createEnvironment` itself:
 * setup keyed `addressSigners` by the address AS RESOLVED (checksummed, for a `privateKey`
 * or protocol account) while every reader looks it up with a lowercased key.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

/**
 * The address the shipped `@rocketh/signer` `privateKey` protocol resolves PRIVATE_KEY to. It is
 * CHECKSUMMED, not lowercased, which is the root of the defect these tests cover. Asserted below
 * rather than merely assumed, so a casing change in the signer dependency fails loudly here.
 */
const SIGNER_ADDRESS_CHECKSUMMED = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

/** An address the node lists in `eth_accounts` (lowercase, as anvil/hardhat return it). */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const TX_HASH = '0x00000000000000000000000000000000000000000000000000000000000000t1'.replace(
	't1',
	'11',
) as `0x${string}`;
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

type Call = {method: string; params?: unknown};

/**
 * A minimal EIP-1193 node stub: just enough for `createEnvironment` setup plus one broadcast
 * round-trip. Every call is recorded so a test can assert WHICH broadcast route was taken.
 */
function createMockProvider(options?: {accounts?: string[]}): {
	provider: EIP1193ProviderWithoutEvents;
	calls: Call[];
} {
	const calls: Call[] = [];
	const provider = {
		request: (async (args: {method: string; params?: unknown}) => {
			calls.push({method: args.method, params: args.params});
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'eth_sendRawTransaction':
				case 'eth_sendTransaction':
					return TX_HASH;
				case 'eth_getTransactionByHash':
					return null;
				case 'eth_getTransactionReceipt':
					return {
						transactionHash: TX_HASH,
						blockHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
						blockNumber: '0x1',
						status: '0x1',
						logs: [],
					};
				case 'eth_blockNumber':
					return '0x1';
				default: {
					// A `signerOnly` account signs locally, so rocketh fills nonce/fees/gas itself
					// before signing (nobody else can). Those answers are shared rather than
					// re-pasted into every stub: see LOCAL_SIGNING_RPC_RESPONSES.
					const prepared = LOCAL_SIGNING_RPC_RESPONSES[args.method];
					if (prepared) return prepared();
					throw new Error(`mock provider: unsupported method ${args.method}`);
				}
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	};
	return {provider: provider as EIP1193ProviderWithoutEvents, calls};
}

function createInMemoryStore(): DeploymentStore {
	const files: Record<string, string> = {};
	return {
		listFiles: vi.fn(async () => []),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_folder, _env, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_folder, _env, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _folder, _env, name, content) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_folder, _env, name) => files[name]),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
		}),
	};
}

async function buildEnvironment(options: {accounts: UserConfig['accounts']; nodeAccounts?: string[]}) {
	const {provider, calls} = createMockProvider({accounts: options.nodeAccounts});
	const userConfig: UserConfig = {
		accounts: options.accounts,
		// the REAL shipped protocol, so this test breaks if its address casing ever changes
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
	};
	const config = resolveConfig(userConfig);
	const executionParams = {provider, environment: 'memory', saveDeployments: false};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolvedExecutionParams, createInMemoryStore());
	return {env, calls};
}

describe('createEnvironment - addressSigners key casing', () => {
	/**
	 * The premise of every test below: the shipped `privateKey` protocol resolves to a CHECKSUMMED
	 * address, so setup cannot rely on its input already being normalised.
	 */
	it('the shipped privateKey protocol resolves to a checksummed address', async () => {
		const signer = await privateKey(`privateKey:${PRIVATE_KEY}`);
		const [address] = await signer.signer.request({method: 'eth_accounts'});

		expect(signer.type).toBe('signerOnly');
		expect(address).toBe(SIGNER_ADDRESS_CHECKSUMMED);
		expect(address).not.toBe(address.toLowerCase());
	});

	/**
	 * A named account configured with a private key must be findable in `addressSigners` through
	 * `resolveAccount`, which is EXACTLY the two-step lookup `@rocketh/deploy` performs before
	 * building a transaction (`env.resolveAccount(account)` then `env.addressSigners[address]`).
	 * Before the fix the key was checksummed and the lowercased lookup missed, producing
	 * "cannot get signer for 0x...".
	 */
	it('resolves a privateKey named account to its signer through the deploy lookup path', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});

		const address = env.resolveAccount('deployer');
		const signer = env.addressSigners[address];

		expect(signer).toBeDefined();
		expect(signer.type).toBe('signerOnly');
	});

	/**
	 * Every `addressSigners` key must be lowercase, since every reader looks up with a lowercased
	 * key (`resolveAccount` lowercases both branches; `broadcastTransaction` lowercases `from`).
	 */
	it('keys addressSigners in lowercase while leaving namedAccounts values untouched', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [NODE_ACCOUNT],
		});

		for (const key of Object.keys(env.addressSigners)) {
			expect(key).toBe(key.toLowerCase());
		}
		// the user-visible address value is NOT normalised: it stays as resolved
		expect(env.namedAccounts.deployer).toBe(SIGNER_ADDRESS_CHECKSUMMED);
	});

	/**
	 * The real broadcast choke point (`broadcastTransaction`, reached via `broadcastExecution`)
	 * must find the signer and route a `signerOnly` account to local signing
	 * (`eth_signTransaction` then `eth_sendRawTransaction`), not to the node's `eth_sendTransaction`.
	 */
	it('broadcasts from a privateKey account without "cannot get signer" and signs locally', async () => {
		const {env, calls} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {
				type: '0x2',
				from: env.resolveAccount('deployer'),
				to: '0x0000000000000000000000000000000000000001',
				chainId: '0x7a69',
			},
		});

		expect(receipt.transactionHash).toBe(TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
		expect(calls.map((c) => c.method)).not.toContain('eth_sendTransaction');
	});

	/**
	 * A named account declared as a CHECKSUMMED bare address hits the same defect: it resolves to a
	 * `remote` signer keyed by the checksummed address, which the lowercased lookup missed.
	 */
	it('resolves a named account declared as a checksummed bare address', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SIGNER_ADDRESS_CHECKSUMMED},
		});

		const signer = env.addressSigners[env.resolveAccount('admin')];

		expect(signer).toBeDefined();
		expect(signer.type).toBe('remote');
	});

	/**
	 * `resolveAccountOrUndefined` is the sibling resolver used by the read path. It must normalise
	 * like `resolveAccount`, so that an address obtained from either resolver can be used against an
	 * address-keyed map without a silent miss.
	 */
	it('normalises addresses in resolveAccountOrUndefined, like resolveAccount', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});

		expect(env.resolveAccountOrUndefined('deployer')).toBe(SIGNER_ADDRESS_CHECKSUMMED.toLowerCase());
		expect(env.resolveAccountOrUndefined(SIGNER_ADDRESS_CHECKSUMMED)).toBe(SIGNER_ADDRESS_CHECKSUMMED.toLowerCase());
		expect(env.resolveAccountOrUndefined('nope')).toBeUndefined();
		// and it agrees with resolveAccount, which is the point
		expect(env.resolveAccountOrUndefined('deployer')).toBe(env.resolveAccount('deployer'));
	});

	/**
	 * The leftover-accounts filter must not re-list a named account as "unnamed" just because the
	 * node reports it in a different case. Before the fix, a node listing the privateKey account in
	 * lowercase saw it treated as unnamed and its `signerOnly` entry silently OVERWRITTEN by a
	 * `remote` one, quietly rerouting local signing to the node.
	 */
	it('does not treat a differently-cased named account as an unnamed account', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [SIGNER_ADDRESS_CHECKSUMMED.toLowerCase()],
		});

		expect(env.unnamedAccounts).toEqual([]);
		expect(env.addressSigners[env.resolveAccount('deployer')].type).toBe('signerOnly');
	});
});
