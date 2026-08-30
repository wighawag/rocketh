import {describe, it, expect, vi} from 'vitest';
import {LOCAL_SIGNING_RPC_RESPONSES} from './support/local-signing-responses.js';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import {UnknownSignerError} from '@rocketh/core';
import type {DeploymentStore, PartialDeployment, UnknownSignerPolicy, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Tests for the unknown-signer SEAM at the single broadcast choke point.
 *
 * `broadcastTransaction` is the one function every transaction funnels through
 * (`deploy`, `execute`, `tx` and the proxy upgrade path all reach it), and it is
 * deliberately NOT exported: it is a closure inside the environment module and
 * absent from the `Environment` interface. So the seam is driven here through the
 * TWO public funnels that call it, `broadcastExecution` (the path `execute`,
 * `executeByName` and `tx` take) and `broadcastDeployment` (the path `deploy`
 * takes). Exercising both is what proves, from inside this package, that the
 * choke point is single.
 *
 * Like `addressSigners-casing.test.ts` and `addressSignability.test.ts`, these
 * build a REAL environment (`resolveConfig` → `getChainIdForEnvironment` →
 * `resolveExecutionParams` → `createEnvironment`) against a small local mock
 * provider, and deliberately do NOT use `@rocketh/test-utils`: `rocketh` must not
 * depend on it or the nx project graph closes a cycle.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** Address the shipped `privateKey` protocol resolves PRIVATE_KEY to (checksummed). */
const PRIVATE_KEY_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

/** An address the node lists in `eth_accounts`. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
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
	onUnknownSigner?: UnknownSignerPolicy;
	chainOnUnknownSigner?: UnknownSignerPolicy;
}) {
	const {provider, calls} = createMockProvider({
		accounts: options.nodeAccounts,
		impersonate: options.impersonate,
	});
	const userConfig: UserConfig = {
		accounts: options.accounts,
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
		chains: options.chainOnUnknownSigner ? {31337: {onUnknownSigner: options.chainOnUnknownSigner}} : undefined,
	};
	const config = resolveConfig(userConfig);
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: false,
		autoImpersonate: options.autoImpersonate,
		onUnknownSigner: options.onUnknownSigner,
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

describe('broadcastTransaction seam - unsignable from', () => {
	/**
	 * Story 4: an UNWRAPPED privileged call whose `from` is unsignable halts with a
	 * first-class `UnknownSignerError` carrying the tx to execute out-of-band, not
	 * with an opaque RPC failure. The node is never asked to send it.
	 */
	it('throws a populated UnknownSignerError through broadcastExecution', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY, admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});

		const from = env.resolveAccount('admin');
		const error = await env
			.broadcastExecution({
				type: 'object',
				data: {
					type: '0x2',
					from,
					to: TARGET_CONTRACT,
					data: '0xdeadbeef',
					value: '0x1f4',
					chainId: '0x7a69',
				},
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect((error as UnknownSignerError).name).toBe('UnknownSignerError');
		expect((error as UnknownSignerError).data).toMatchObject({
			from,
			to: TARGET_CONTRACT,
			data: '0xdeadbeef',
			value: '0x1f4',
		});
		// it never reached the node
		expect(calls.map((c) => c.method)).not.toContain('eth_sendTransaction');
		expect(calls.map((c) => c.method)).not.toContain('eth_sendRawTransaction');
	});

	/**
	 * Story 5 (funnel half): the SAME error fires through the other public funnel,
	 * `broadcastDeployment` — proof the check lives at the single choke point rather
	 * than on the execute path only. A deploy has no `to`, and its `data` is the
	 * init code.
	 */
	it('throws the same UnknownSignerError through broadcastDeployment, with no `to`', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});

		const from = env.resolveAccount('admin');
		const error = await env
			.broadcastDeployment(
				'MyContract',
				{type: 'object', data: {type: '0x2', from, data: '0x60016000', chainId: '0x7a69'}},
				partialDeployment,
			)
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect((error as UnknownSignerError).data.to).toBeUndefined();
		expect((error as UnknownSignerError).data).toMatchObject({from, data: '0x60016000'});
	});

	/**
	 * Story 5 (value transfer): a plain value-carrying transaction — no calldata —
	 * surfaces the value, so the human executing it out-of-band sends the right amount.
	 */
	it('carries `value` for a plain value transfer', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});

		const from = env.resolveAccount('admin');
		const error = await env
			.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from, to: TARGET_CONTRACT, value: '0xde0b6b3a7640000', chainId: '0x7a69'},
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect((error as UnknownSignerError).data.value).toBe('0xde0b6b3a7640000');
		expect((error as UnknownSignerError).message).toContain('0xde0b6b3a7640000');
	});

	/**
	 * The `contract` enrichment (naming the contract/method/args behind an `execute`)
	 * is deliberately NOT populated at this seam: carrying it here spans three other
	 * packages and is owned by `unknown-signer-contract-enrichment`.
	 */
	it('leaves `contract` unpopulated', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});

		const error = await env
			.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect((error as UnknownSignerError).data.contract).toBeUndefined();
	});

	/**
	 * Story 11: the DEFAULT policy is `'auto'`, and while no interactive resolver
	 * ships it degrades to `'throw'` — a CI run never prompts and never hangs. The
	 * first case passes no policy at all (so the default is what is exercised).
	 */
	it('throws under the default policy and under an explicit `auto`', async () => {
		for (const onUnknownSigner of [undefined, 'auto' as const, 'throw' as const]) {
			const {env} = await buildEnvironment({
				accounts: {admin: SAFE_ADDRESS},
				nodeAccounts: [],
				autoImpersonate: false,
				onUnknownSigner,
			});
			await expect(
				env.broadcastExecution({
					type: 'object',
					data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
				}),
			).rejects.toBeInstanceOf(UnknownSignerError);
		}
	});
});

describe('broadcastTransaction seam - signable from is unaffected', () => {
	/**
	 * `local` (a `signerOnly` privateKey account) broadcasts exactly as before: sign
	 * locally, then `eth_sendRawTransaction`.
	 */
	it('broadcasts a local (signerOnly) account unchanged', async () => {
		const {env, calls} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}, nodeAccounts: []});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});

		expect(receipt.transactionHash).toBe(TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
	});

	/** `node` (an account the node holds) broadcasts through `eth_sendTransaction`. */
	it('broadcasts a node account unchanged', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});

		expect(receipt.transactionHash).toBe(TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
	});

	/** A deployment from a signable account still goes through the funnel and saves. */
	it('broadcasts a deployment from a signable account unchanged', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}, nodeAccounts: []});

		const deployment = await env.broadcastDeployment(
			'MyContract',
			{
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('deployer'), data: '0x60016000', chainId: '0x7a69'},
			},
			partialDeployment,
		);

		expect(deployment.address).toBe(DEPLOYED_ADDRESS);
	});

	/**
	 * An ALREADY-SIGNED (`type: 'raw'`) transaction returns before any signer lookup,
	 * so it can never reach the seam — pinned here because "raw tx" reads like the
	 * plain-transaction path but is not it (that path is `tx()`, which builds
	 * `type: 'object'`).
	 */
	it('never reaches the seam for an already-signed raw transaction', async () => {
		const {env, calls} = await buildEnvironment({accounts: {admin: SAFE_ADDRESS}, nodeAccounts: []});

		const receipt = await env.broadcastExecution({
			type: 'raw',
			from: env.resolveAccount('admin'),
			raw: '0xf86b',
		});

		expect(receipt.transactionHash).toBe(TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
	});

	/**
	 * Story 6, the MIXED run: in ONE environment, the signable deployer broadcasts
	 * normally and only the unsignable Safe throws. This is what makes "defer the
	 * governance call, keep deploying" possible.
	 */
	it('broadcasts the signable tx and throws only for the unsignable one', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY, admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});
		expect(receipt.transactionHash).toBe(TX_HASH);

		await expect(
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			}),
		).rejects.toBeInstanceOf(UnknownSignerError);

		// and the signable account still works AFTER the throw
		const after = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});
		expect(after.transactionHash).toBe(TX_HASH);
	});
});

describe('broadcastTransaction seam - policy frames', () => {
	/**
	 * A pushed frame reaches the seam: with a frame in effect, an unsignable `from`
	 * still throws. (With only `'throw'`/`'auto'` shipping, precedence itself is not
	 * observable here — that is unit-tested on the stack in
	 * `unknownSignerPolicy.test.ts`.)
	 */
	it('honours a pushed frame for an unsignable account', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
		});

		await env.runUnderUnknownSignerPolicy({policy: 'throw'}, async () => {
			await expect(
				env.broadcastExecution({
					type: 'object',
					data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
				}),
			).rejects.toBeInstanceOf(UnknownSignerError);
		});
	});

	/**
	 * ANTI-REGRESSION (ADR 0006, the confusion that bounced an earlier task set): the
	 * frame forces `throw` over `ask`, NEVER over impersonation. An IMPERSONATED
	 * account is signable, full stop, so it still broadcasts while a `'throw'` frame
	 * is pushed. If the frame were consulted before the signability check, this test
	 * would fail and every fork test wrapped in `catchUnknownSigner` would silently
	 * change behaviour.
	 */
	it('still broadcasts an impersonated account while a `throw` frame is pushed', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
		});
		expect(env.addressSignability[SAFE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('impersonated');

		await env.runUnderUnknownSignerPolicy({policy: 'throw'}, async () => {
			const receipt = await env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			});
			expect(receipt.transactionHash).toBe(TX_HASH);
		});

		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
	});

	/** Same invariant for a `local` account: a pushed frame never turns it into a throw. */
	it('still broadcasts a local account while a `throw` frame is pushed', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}, nodeAccounts: []});

		await env.runUnderUnknownSignerPolicy({policy: 'throw'}, async () => {
			const receipt = await env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			});
			expect(receipt.transactionHash).toBe(TX_HASH);
		});
	});
});

describe('broadcastTransaction seam - defensive signer lookup', () => {
	/**
	 * The signability view and the signer map are built from the same keys, so they
	 * cannot disagree today (the casing defect that once made them disagree was fixed
	 * in `09ea46d`). This guard exists for FUTURE divergence: if an address ever
	 * classifies signable while carrying no signer entry, the result must be a clear
	 * error naming the address, never a `TypeError` on `undefined`. Simulated by
	 * removing the entry after setup, which is the only way the two can disagree.
	 */
	it('raises a clear error naming the address, not a TypeError', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}, nodeAccounts: []});
		const from = env.resolveAccount('deployer');
		expect(env.addressSignability[from]).toBe('local');
		delete (env.addressSigners as Record<string, unknown>)[from];

		const error = await env
			.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from, to: TARGET_CONTRACT, chainId: '0x7a69'},
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(TypeError);
		expect(error).not.toBeInstanceOf(UnknownSignerError);
		expect((error as Error).message).toContain(from);
	});
});

describe('onUnknownSigner - precedence', () => {
	/**
	 * Resolved with the same precedence as the other execution params, mirroring how
	 * `autoImpersonate` is threaded: execution param > chain config > default `'auto'`.
	 */
	function resolve(params: {onUnknownSigner?: UnknownSignerPolicy; chain?: UnknownSignerPolicy}) {
		const config = resolveConfig({
			chains: {31337: {rpcUrl: 'http://localhost:8545', onUnknownSigner: params.chain}},
		});
		return resolveExecutionParams(config, {environment: 'memory', onUnknownSigner: params.onUnknownSigner}, 31337)
			.environment.onUnknownSigner;
	}

	it('defaults to auto', () => {
		expect(resolve({})).toBe('auto');
	});

	it('takes the chain config when no execution param is given', () => {
		expect(resolve({chain: 'throw'})).toBe('throw');
	});

	it('lets the execution param win over the chain config', () => {
		expect(resolve({onUnknownSigner: 'auto', chain: 'throw'})).toBe('auto');
	});

	/**
	 * A chain-level `onUnknownSigner` reaches the seam of a real environment, not just
	 * the resolved params.
	 */
	it('applies a chain-level policy at the seam', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
			chainOnUnknownSigner: 'throw',
		});

		await expect(
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			}),
		).rejects.toBeInstanceOf(UnknownSignerError);
	});
});

/**
 * The message a HALTED run leaves behind has to say that the same transaction is coming
 * back. rocketh did not send it and never saw one land, so it records nothing; and the
 * deferral unwinds the run before the script could return `true`, so not even a run-once
 * `id` is written. The next run therefore reaches the same call and prints the same
 * transaction, and following it a second time executes the call twice.
 *
 * Content is asserted, not merely the error type: the DIAGNOSIS is the deliverable here,
 * and a note that blamed a missing guard would be both wrong and useless to the author
 * who wrote `id` plus `return true` and did everything right.
 */
describe('unknown-signer message - the deferral comes back on the next run', () => {
	async function deferralError(options: {
		onUnknownSigner?: UnknownSignerPolicy;
		/** Run the broadcast under a scoped frame, as `catchUnknownSigner` does. */
		scopedPolicy?: UnknownSignerPolicy;
	}): Promise<UnknownSignerError> {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
			onUnknownSigner: options.onUnknownSigner,
		});
		const broadcast = () =>
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			});
		const run = options.scopedPolicy
			? env.runUnderUnknownSignerPolicy({policy: options.scopedPolicy}, broadcast)
			: broadcast();
		return run.then(
			() => {
				throw new Error('expected the unsignable `from` to reject');
			},
			(e) => e as UnknownSignerError,
		);
	}

	it('warns an unwrapped run-level `throw` that a re-run surfaces the same transaction', async () => {
		const error = await deferralError({onUnknownSigner: 'throw'});

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect(error.message).toContain('STOPPED');
		expect(error.message).toContain('SAME transaction again');
		// the transaction to execute is still the deliverable, note or no note
		expect(error.message).toContain(SAFE_ADDRESS);
	});

	/**
	 * THE DIAGNOSIS. The run-once script (`id` plus `return true`) is protected when the
	 * account is signable and NOT protected here, because `recordMigration` is reached
	 * only when the script FUNCTION RETURNS and this throw unwinds first. That, and not a
	 * missing guard, is what the message must attribute the resurfacing to.
	 */
	it('attributes it to the run stopping before the completion was recorded, not to a missing guard', async () => {
		const error = await deferralError({onUnknownSigner: 'throw'});

		expect(error.message).toContain('return true');
		expect(error.message).toContain('migration');
		expect(error.message).not.toMatch(/guard/i);
	});

	/** The two sentences are ONE story: the warning hands the reader to the remedy. */
	it('points at pasting the already-executed hash as the way out', async () => {
		const error = await deferralError({onUnknownSigner: 'throw'});

		expect(error.message).toContain('paste the hash');
		expect(error.message).toContain('freshness check');
		expect(error.message).toContain('EARLIER run');
	});

	/** A CI run under the default `'auto'` is the commonest way to halt here. */
	it('warns a run whose `auto` degraded to a throw, alongside the degradation note', async () => {
		const error = await deferralError({onUnknownSigner: 'auto'});

		expect(error.message).toContain('SAME transaction again');
		// both notes, in the order they are composed: why no pause, then what happens next
		expect(error.message.indexOf('--skip-prompts')).toBeLessThan(error.message.indexOf('SAME transaction again'));
	});

	/**
	 * THE QUIET PATH, exactly as for the capability-degradation note: this is what
	 * `catchUnknownSigner` scopes, and that script does NOT stop. It catches the error,
	 * carries on, and may well reach `return true` itself, so a warning that the run
	 * halted before recording anything would be false as well as unwanted.
	 */
	it('says nothing under a scoped `throw`, which is what catchUnknownSigner pushes', async () => {
		const error = await deferralError({onUnknownSigner: 'auto', scopedPolicy: 'throw'});

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect(error.message).not.toContain('SAME transaction again');
		expect(error.message).not.toContain('freshness check');
		// still the whole transaction to execute, which is what that workflow is for
		expect(error.message).toContain(SAFE_ADDRESS);
	});

	/** Repo rule, asserted on the message a user actually sees. */
	it('adds no em dash to the message', async () => {
		const error = await deferralError({onUnknownSigner: 'throw'});
		expect(error.message).not.toContain('\u2014');
	});
});

describe('autoImpersonate is untouched by the seam', () => {
	/**
	 * `autoImpersonate` is a NODE CAPABILITY switch that runs BEFORE the seam;
	 * `onUnknownSigner` is the POLICY for what remains unsignable afterwards (ADR
	 * 0006). Setting a policy must not change whether impersonation is attempted, and
	 * an account impersonation RESOLVED must never reach the policy.
	 */
	it('still impersonates (and does not throw) when a policy is set', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'accept',
			onUnknownSigner: 'throw',
		});

		expect(calls.some((c) => c.method === 'hardhat_impersonateAccount')).toBe(true);
		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});
		expect(receipt.transactionHash).toBe(TX_HASH);
	});

	/** An account whose impersonation FAILED is unsignable, and reaches the policy. */
	it('throws for an account whose impersonation failed', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: true,
			impersonate: 'reject',
		});

		await expect(
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('admin'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			}),
		).rejects.toBeInstanceOf(UnknownSignerError);
	});

	/** Sanity: the address of a local account is what it always was. */
	it('keeps namedAccounts values untouched', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		expect(env.namedAccounts.deployer).toBe(PRIVATE_KEY_ADDRESS);
	});
});
