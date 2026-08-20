import {describe, it, expect, vi} from 'vitest';
import {LOCAL_SIGNING_RPC_RESPONSES} from './support/local-signing-responses.js';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import {UnknownSignerError} from '@rocketh/core';
import type {DeploymentStore, PartialDeployment, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Tests for the AUTO-IMPERSONATION NOTE on the unknown-signer error.
 *
 * Auto-impersonation is best-effort and silently swallows an unsupported or refused
 * `hardhat_impersonateAccount` (that silence is deliberate: it is what lets the feature
 * degrade gracefully on a provider that is not a dev node). The cost is that a user who
 * turned it on against the WRONG KIND OF NODE was told nothing: the run simply produced an
 * unknown-signer error later with no hint that impersonation had ever been involved. The
 * error now carries that fact.
 *
 * It is a MESSAGE detail and nothing more (ADR 0006): `autoImpersonate` stays a NODE
 * CAPABILITY resolved BEFORE the seam and `onUnknownSigner` stays the POLICY afterwards, so
 * these tests also re-pin that the note changed no control flow: impersonation still fails
 * silently, the policy is still read only inside the `unsignable` branch, and no account's
 * signability classification moved.
 *
 * Like the sibling seam tests, they build a REAL environment (`resolveConfig` →
 * `getChainIdForEnvironment` → `resolveExecutionParams` → `createEnvironment`) against a
 * small local mock provider whose impersonation RPC can be made to succeed or fail, and
 * deliberately do NOT use `@rocketh/test-utils`: `rocketh` must not depend on it or the nx
 * project graph closes a cycle.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** Address the shipped `privateKey` protocol resolves PRIVATE_KEY to (checksummed). */
const PRIVATE_KEY_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

/** An address the node lists in `eth_accounts`. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
/** Stands in for the Safe/multisig owner: a NAMED account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
/** An address that appears NOWHERE in the config: a bare `from`, never a candidate. */
const UNNAMED_ADDRESS = '0x3333333333333333333333333333333333333333';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';

const TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000011' as `0x${string}`;
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';
const DEPLOYED_ADDRESS = '0x0000000000000000000000000000000000000abc' as `0x${string}`;

type Call = {method: string; params?: unknown};

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
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'hardhat_impersonateAccount':
					if (impersonate === 'accept') return null;
					if (impersonate === 'reject') throw new Error('impersonation rejected by policy');
					throw new Error('Method not found');
				case 'eth_signTransaction':
					return '0xf86b';
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
						transactionIndex: '0x0',
						contractAddress: DEPLOYED_ADDRESS,
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

/** A minimal artifact-shaped partial deployment; the seam throws before it is ever read. */
const partialDeployment: PartialDeployment = {
	abi: [],
	bytecode: '0x60016000',
	metadata: '{}',
	argsData: '0x',
};

/** Drive the seam through the execute funnel and hand back whatever it threw. */
async function executeAndCatch(env: Awaited<ReturnType<typeof buildEnvironment>>['env'], from: `0x${string}`) {
	return env
		.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from, to: TARGET_CONTRACT, chainId: '0x7a69'},
		})
		.then(
			() => undefined,
			(e) => e as UnknownSignerError,
		);
}

describe('unknown-signer error - auto-impersonation note', () => {
	/**
	 * Shape 1: impersonation was ATTEMPTED and the node does not implement the RPC. This is
	 * the silence the note pays back. The helper swallowed a `Method not found` at setup, so
	 * without this the user's only signal was an unknown-signer error that said nothing about
	 * the feature they had switched on.
	 */
	it('says impersonation was attempted when the node does not support the RPC', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'unsupported',
		});
		expect(calls.some((c) => c.method === 'hardhat_impersonateAccount')).toBe(true);

		const error = await executeAndCatch(env, env.resolveAccount('admin'));

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect(error!.data.autoImpersonation).toBe('attempted');
		expect(error!.message).toContain('auto-impersonation');
		expect(error!.message).toContain('hardhat_impersonateAccount');
	});

	/** Same shape when the node KNOWS the RPC but refuses the account: it was still attempted. */
	it('says impersonation was attempted when the node refused it', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'reject',
		});

		const error = await executeAndCatch(env, env.resolveAccount('admin'));

		expect(error!.data.autoImpersonation).toBe('attempted');
	});

	/**
	 * Shape 2: enabled, but never attempted FOR THIS ACCOUNT. Only NAMED accounts are
	 * impersonation candidates, so a bare `from` that appears nowhere in the config is never
	 * impersonated however capable the node is. The diagnosis differs and so does the fix
	 * (name the account), which is why the two shapes do not collapse into one message.
	 */
	it('says impersonation was never attempted for an account that was not a candidate', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
		});

		const error = await executeAndCatch(env, UNNAMED_ADDRESS as `0x${string}`);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect(error!.data.autoImpersonation).toBe('not-a-candidate');
		expect(error!.message).toContain('NAMED');
		// nothing was ever sent for it
		expect(
			calls.some((c) => c.method === 'hardhat_impersonateAccount' && JSON.stringify(c.params).includes('0x3333')),
		).toBe(false);
	});

	/**
	 * The COMMON PATH is untouched: with auto-impersonation off (the default everywhere but a
	 * fork or dev node) the message OPENS with byte-for-byte what it always was, so the mainnet
	 * Safe user gets no new noise about a feature they never enabled.
	 *
	 * `startsWith` rather than equality, because a run that CANNOT ask a human for text now
	 * appends a note saying it would otherwise have paused and taken a pasted transaction hash
	 * (pinned in `prompt-capability.test.ts`). That note is about prompt CAPABILITY, not
	 * impersonation, and it lands after the transaction to execute. What is pinned here is that
	 * nothing is injected INTO the deliverable, and that impersonation is still never mentioned.
	 */
	it('leaves the message unchanged when auto-impersonation is off', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});
		expect(calls.some((c) => c.method === 'hardhat_impersonateAccount')).toBe(false);

		const from = env.resolveAccount('admin');
		const error = await executeAndCatch(env, from);

		expect(error!.data.autoImpersonation).toBeUndefined();
		expect(error!.message.toLowerCase()).not.toContain('impersonat');
		expect(error!.message.startsWith(new UnknownSignerError({from, to: TARGET_CONTRACT}).message)).toBe(true);
	});

	/**
	 * The note is attached where the error is BUILT, at the single choke point, so it reaches
	 * the deployment funnel too rather than the execute path only.
	 */
	it('carries the note through the deployment funnel as well', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'unsupported',
		});

		const error = await env
			.broadcastDeployment(
				'MyContract',
				{
					type: 'object',
					data: {type: '0x2', from: env.resolveAccount('admin'), data: '0x60016000', chainId: '0x7a69'},
				},
				partialDeployment,
			)
			.then(
				() => undefined,
				(e) => e as UnknownSignerError,
			);

		expect(error!.data.autoImpersonation).toBe('attempted');
	});
});

describe('auto-impersonation note - control flow is unchanged', () => {
	/**
	 * ANTI-REGRESSION (ADR 0006). Reading impersonation state at a NEW place is exactly the
	 * kind of change that could blur the capability/policy boundary, so the classification is
	 * re-pinned here: a failed impersonation still leaves the account `unsignable` (and setup
	 * still does not throw, since the swallow is deliberate), a successful one still leaves it
	 * `impersonated` so it never reaches the policy at all, and neither `local` nor `node`
	 * moved while the feature was on.
	 */
	it('keeps every signability classification exactly where it was', async () => {
		const failed = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY, admin: SAFE_ADDRESS, other: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			autoImpersonate: true,
			impersonate: 'unsupported',
		});
		expect(failed.env.addressSignability[SAFE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('unsignable');
		expect(failed.env.addressSignability[PRIVATE_KEY_ADDRESS.toLowerCase() as `0x${string}`]).toBe('local');
		expect(failed.env.addressSignability[NODE_ACCOUNT.toLowerCase() as `0x${string}`]).toBe('node');

		const accepted = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
		});
		expect(accepted.env.addressSignability[SAFE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('impersonated');
	});

	/**
	 * A successfully impersonated account still BROADCASTS: the note never turns
	 * node-capability state into a reason to consult the policy, so the account resolved
	 * before the seam never reaches it.
	 */
	it('still broadcasts an impersonated account with no error at all', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
		});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});

		expect(receipt.transactionHash).toBe(TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
	});

	/**
	 * And a signable account is unaffected by the feature being on: no note, no throw, same
	 * broadcast it always did.
	 */
	it('still broadcasts a local account while auto-impersonation is on and unsupported', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'unsupported',
		});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});

		expect(receipt.transactionHash).toBe(TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
	});
});
