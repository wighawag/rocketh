import {describe, it, expect, vi} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Tests for `env.addressSignability`, the four-state classification of whether
 * rocketh can actually sign for an address. Follows the pattern established by
 * `addressSigners-casing.test.ts`: build a REAL environment (`resolveConfig` →
 * `getChainIdForEnvironment` → `resolveExecutionParams` → `createEnvironment`)
 * against a small local mock provider. Deliberately does NOT depend on
 * `@rocketh/test-utils`: `rocketh` must not depend on it or the nx project
 * graph closes a cycle.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** Address the shipped `privateKey` protocol resolves PRIVATE_KEY to (checksummed). */
const PRIVATE_KEY_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const NAMED_BARE_ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER_ADDRESS = '0x2222222222222222222222222222222222222222';

const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

type Call = {method: string; params?: unknown};

/**
 * A minimal EIP-1193 node stub. `impersonate` controls whether
 * `hardhat_impersonateAccount` succeeds or throws (so we can exercise both the
 * `impersonated` and `unsignable` classifications).
 */
function createMockProvider(options?: {accounts?: string[]; impersonate?: 'accept' | 'reject' | 'unsupported'}): {
	provider: EIP1193ProviderWithoutEvents;
	calls: Call[];
} {
	const calls: Call[] = [];
	const impersonate = options?.impersonate ?? 'accept';
	const provider = {
		request: (async (args: {method: string; params?: unknown}) => {
			calls.push({method: args.method, params: args.params});
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'hardhat_impersonateAccount':
					if (impersonate === 'accept') return null;
					if (impersonate === 'reject') throw new Error('impersonation rejected by policy');
					throw new Error('Method not found');
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
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

async function buildEnvironment(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	autoImpersonate?: boolean;
	impersonate?: 'accept' | 'reject' | 'unsupported';
}) {
	const {provider, calls} = createMockProvider({
		accounts: options.nodeAccounts,
		impersonate: options.impersonate,
	});
	const userConfig: UserConfig = {
		accounts: options.accounts,
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
	};
	const config = resolveConfig(userConfig);
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: false,
		autoImpersonate: options.autoImpersonate,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolvedExecutionParams, createInMemoryStore());
	return {env, calls};
}

describe('createEnvironment - addressSignability', () => {
	/**
	 * `local` — a `signerOnly` account (what the `privateKey` protocol returns) classifies as
	 * `local`. This is the case that an earlier draft's `wallet` naming would have gotten wrong
	 * — every privateKey deployer would have been `unsignable`.
	 */
	it('classifies a privateKey (signerOnly) account as local', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const address = env.resolveAccount('deployer');
		expect(env.addressSigners[address].type).toBe('signerOnly');
		expect(env.addressSignability[address]).toBe('local');
	});

	/**
	 * `node` — a named account whose address is present in `eth_accounts` classifies as `node`.
	 */
	it('classifies a named account listed by the node as node', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});
		const address = env.resolveAccount('deployer');
		expect(env.addressSigners[address].type).toBe('remote');
		expect(env.addressSignability[address]).toBe('node');
	});

	/**
	 * `node` — the node's OWN unnamed accounts (present in `eth_accounts`, no config entry)
	 * classify as `node`, NOT `unsignable`. Classifying them as `unsignable` would make the
	 * later unknown-signer seam throw on perfectly ordinary sends from a node-known account.
	 */
	it("classifies the node's unnamed accounts as node", async () => {
		const {env} = await buildEnvironment({accounts: {}, nodeAccounts: [NODE_ACCOUNT]});
		expect(env.unnamedAccounts).toContain(NODE_ACCOUNT);
		expect(env.addressSignability[NODE_ACCOUNT.toLowerCase() as `0x${string}`]).toBe('node');
	});

	/**
	 * `impersonated` — a named plain-address account absent from `eth_accounts` for which
	 * `hardhat_impersonateAccount` succeeded classifies as `impersonated`.
	 */
	it('classifies a successfully-impersonated named account as impersonated', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: NAMED_BARE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
		});
		expect(calls.some((c) => c.method === 'hardhat_impersonateAccount')).toBe(true);
		expect(env.addressSignability[NAMED_BARE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('impersonated');
	});

	/**
	 * `unsignable` — a named plain-address account whose impersonation FAILED classifies as
	 * `unsignable`. This is the defect this task closes: before, such an account was
	 * indistinguishable from a real node account and produced an opaque failure at
	 * `eth_sendTransaction` time. Both "node rejected" and "node does not support" are covered.
	 */
	it('classifies a named account whose impersonation was rejected as unsignable', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: NAMED_BARE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'reject',
		});
		expect(env.addressSignability[NAMED_BARE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('unsignable');
	});

	it('classifies a named account whose node does not support impersonation as unsignable', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: NAMED_BARE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'unsupported',
		});
		expect(env.addressSignability[NAMED_BARE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('unsignable');
	});

	/**
	 * `unsignable` — with `autoImpersonate` off, a named plain-address account absent from
	 * `eth_accounts` classifies as `unsignable` (impersonation never attempted).
	 */
	it('classifies a named plain-address account as unsignable when autoImpersonate is off', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: NAMED_BARE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});
		expect(calls.some((c) => c.method === 'hardhat_impersonateAccount')).toBe(false);
		expect(env.addressSignability[NAMED_BARE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('unsignable');
	});

	/**
	 * An address never seen during setup returns `'unsignable'` rather than `undefined`, so
	 * callers never have to handle a third case.
	 */
	it('returns unsignable for an address never seen during setup', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		expect(env.addressSignability[OTHER_ADDRESS.toLowerCase() as `0x${string}`]).toBe('unsignable');
	});

	/**
	 * The map is keyed by LOWERCASE address, matching `addressSigners`.
	 */
	it('keys addressSignability in lowercase', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [NODE_ACCOUNT],
		});
		expect(env.addressSignability[PRIVATE_KEY_ADDRESS.toLowerCase() as `0x${string}`]).toBe('local');
		// user-visible address values remain un-normalised
		expect(env.namedAccounts.deployer).toBe(PRIVATE_KEY_ADDRESS);
	});
});

describe('createEnvironment - impersonation candidate filter', () => {
	/**
	 * The filter's OWN doc says it exists for "named accounts that don't have private keys
	 * available", but before the fix the candidate set was every named account absent from
	 * `eth_accounts` — so a `signerOnly` (privateKey/hardware/protocol) account got a
	 * `hardhat_impersonateAccount` call it did not need. Behaviourally harmless (broadcast
	 * routes on signer variant, so a `signerOnly` account signs locally regardless of what
	 * the node thinks) but wasted RPC per run. Fixed by narrowing candidates to accounts
	 * whose resolved signer is `remote` (the "no usable signer for this run" rule, in one
	 * named place inside `createEnvironment`).
	 */
	it('does not impersonate a signerOnly (privateKey) account', async () => {
		const {calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
		});
		expect(calls.some((c) => c.method === 'hardhat_impersonateAccount')).toBe(false);
	});

	/**
	 * Precedence `local` > `node` > `impersonated` > `unsignable` is asserted as a defensive
	 * invariant: even if a signerOnly account WERE swept into the impersonation candidate set
	 * (and the node accepted it), the classification stays `local`, because a locally-signable
	 * account is never "just" impersonated. This is what keeps the seam correct even if the
	 * candidate filter above later regresses.
	 */
	it('classifies a signerOnly account as local even if it appears in eth_accounts (node precedence)', async () => {
		// A privateKey account that ALSO happens to be in eth_accounts stays `local`, never `node`.
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [PRIVATE_KEY_ADDRESS.toLowerCase()],
			autoImpersonate: true,
		});
		expect(env.addressSignability[PRIVATE_KEY_ADDRESS.toLowerCase() as `0x${string}`]).toBe('local');
	});
});
