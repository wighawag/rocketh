import {describe, it, expect, vi} from 'vitest';
import {UnknownSignerError} from '@rocketh/core';
import type {DeploymentStore, Environment} from '@rocketh/core/types';
import {createMapDeploymentStore, createTestEnvironment} from '@rocketh/test-utils';

import {catchUnknownSigner} from '../src/index.js';

/**
 * `@rocketh/unknown-signer` — integration tests that double as documentation.
 *
 * These drive a REAL rocketh environment (`createTestEnvironment`) whose named
 * `admin` is declared as a bare address the node does not hold, with
 * auto-impersonation off. That is exactly the Safe/multisig situation: the account
 * classifies as `unsignable`, so any transaction from it reaches the broadcast seam
 * and throws `UnknownSignerError`.
 *
 * The wrapped action here is `env.broadcastExecution(...)`, which is the funnel
 * `execute()`, `executeByName()` and `tx()` from `@rocketh/read-execute` all take
 * (and `broadcastDeployment` is the one `deploy()` takes). Driving the funnel
 * directly keeps these tests about the WRAPPER rather than about any one extension
 * package, and keeps this package's dependency on `@rocketh/core` alone.
 */

/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
/** An address the mock node lists in `eth_accounts`, so it is signable. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';

/** A privileged call from the Safe: the tx a human has to execute out-of-band. */
function upgradeCall(env: Environment, from: `0x${string}`) {
	return env.broadcastExecution({
		type: 'object',
		data: {
			type: '0x2',
			from,
			to: TARGET_CONTRACT,
			data: '0xdeadbeef',
			value: '0x1f4',
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
		},
	});
}

/** An environment whose named `admin` is unsignable (no signer material, no impersonation). */
async function safeOwnerEnvironment(options?: {deploymentStore?: DeploymentStore}) {
	return createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT, admin: SAFE_ADDRESS},
		nodeAccounts: [NODE_ACCOUNT],
		executionParams: {autoImpersonate: false},
		deploymentStore: options?.deploymentStore,
	});
}

describe('@rocketh/unknown-signer - catchUnknownSigner', () => {
	describe('Story 2 & 3: catch the unknown signer and get the transaction back', () => {
		/**
		 * Example: your proxy owner is a Safe. Wrap the privileged call so the run does
		 * not halt, and get back the exact transaction to execute on the Safe.
		 *
		 * Note the call shape: the action is a FUNCTION (`() => ...`), not an
		 * already-started promise. That is the one mechanical change from a v1 script.
		 */
		it('returns {from, to, value, data} when the from is unsignable', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const admin = env.resolveAccount('admin');
			const deferred = await _catchUnknownSigner(() => upgradeCall(env, admin), {log: false});

			expect(deferred).toEqual({
				from: admin,
				to: TARGET_CONTRACT,
				value: '0x1f4',
				data: '0xdeadbeef',
			});
		});

		/** The run continues: the wrapper resolves rather than rejecting. */
		it('lets the run continue past the deferred step', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);
			const admin = env.resolveAccount('admin');

			const steps: string[] = [];
			await _catchUnknownSigner(
				async () => {
					steps.push('governance-call');
					await upgradeCall(env, admin);
					steps.push('never reached');
				},
				{log: false},
			);
			steps.push('next-step');

			expect(steps).toEqual(['governance-call', 'next-step']);
		});

		/** Nothing to catch: the action ran to completion, so the result is `null`. */
		it('returns null when the action succeeds', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const result = await _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('deployer')), {
				log: false,
			});

			expect(result).toBe(null);
		});
	});

	describe('Story 10: exact v1 return parity', () => {
		/**
		 * v1 returned `{from, to, value, data}` from a destructure, so every key is
		 * PRESENT even when its value is `undefined`. A migrated script may compare
		 * strictly or enumerate the keys, so this is asserted with `toStrictEqual`
		 * (which, unlike `toEqual`, does not treat a missing key as `undefined`).
		 */
		it('keeps every key present even when undefined', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);
			const admin = env.resolveAccount('admin');

			// a deploy-shaped transaction: no `to`, no `value`
			const deferred = await _catchUnknownSigner(
				() =>
					env.broadcastDeployment(
						'Upgraded',
						{
							type: 'object',
							data: {
								type: '0x2',
								from: admin,
								data: '0x60016000',
								chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
							},
						},
						{abi: [], bytecode: '0x60016000', metadata: '{}', argsData: '0x'},
					),
				{log: false},
			);

			expect(deferred).toStrictEqual({from: admin, to: undefined, value: undefined, data: '0x60016000'});
			expect(Object.keys(deferred!).sort()).toEqual(['data', 'from', 'to', 'value']);
		});

		/**
		 * `UnknownSignerErrorData.value` is `bigint | string`, while v1 always returned a
		 * string. A `bigint` is therefore stringified (decimal, like `Error.message`
		 * renders it), and a string value is passed through untouched.
		 */
		it('stringifies a bigint value and passes a string value through', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const bigintValue = await _catchUnknownSigner(
				() => {
					throw new UnknownSignerError({from: SAFE_ADDRESS, to: TARGET_CONTRACT, value: 1000000000000000000n});
				},
				{log: false},
			);
			expect(bigintValue?.value).toBe('1000000000000000000');
			expect(typeof bigintValue?.value).toBe('string');

			const stringValue = await _catchUnknownSigner(
				() => {
					throw new UnknownSignerError({from: SAFE_ADDRESS, to: TARGET_CONTRACT, value: '0xde0b6b3a7640000'});
				},
				{log: false},
			);
			expect(stringValue?.value).toBe('0xde0b6b3a7640000');
		});

		/**
		 * `contract` is presentation-only enrichment of the printed message. v1 never
		 * returned it and neither do we, so a script that persists or hashes the result
		 * sees the same shape it always did.
		 */
		it('never puts `contract` on the returned object', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const deferred = await _catchUnknownSigner(
				() => {
					throw new UnknownSignerError({
						from: SAFE_ADDRESS,
						to: TARGET_CONTRACT,
						data: '0xdeadbeef',
						contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xnewimpl']},
					});
				},
				{log: false},
			);

			expect(deferred).not.toHaveProperty('contract');
			expect(Object.keys(deferred!).sort()).toEqual(['data', 'from', 'to', 'value']);
		});
	});

	describe('The action is a THUNK only (the one deliberate divergence from v1)', () => {
		/**
		 * v1 accepted `Promise | (() => Promise)`. The promise form cannot work here:
		 * `catchUnknownSigner(execute(...))` has already STARTED the action before the
		 * wrapper runs, so there is no moment at which to push the policy frame.
		 *
		 * The TYPE rejects it: `_catchUnknownSigner(alreadyStarted)` is a real compile error,
		 * marked below with `@ts-expect-error`. (This repo's `pnpm typecheck` covers `src/**`
		 * only, so that marker documents the contract rather than being enforced in CI —
		 * `npx tsc --noEmit` over this file is the manual check.) Because JavaScript callers
		 * and `as any` exist, the runtime rejects it too, with an error that names the fix.
		 */
		it('rejects a promise-form call with an actionable error', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);
			const admin = env.resolveAccount('admin');

			const alreadyStarted = upgradeCall(env, admin).catch(() => undefined);

			await expect(
				// @ts-expect-error the v1 promise form is deliberately not accepted
				_catchUnknownSigner(alreadyStarted, {log: false}),
			).rejects.toThrow(/\(\) =>/);

			// the same call as a JavaScript caller (or an `as any` escape hatch) would make it:
			//  no type error left to catch it, so the RUNTIME guard is what has to name the fix.
			await expect(_catchUnknownSigner(alreadyStarted as any, {log: false})).rejects.toThrow(
				/@rocketh\/unknown-signer/,
			);

			await alreadyStarted;
		});

		/** A non-callable, non-thenable argument is a caller mistake too, not a silent no-op. */
		it('rejects a non-callable argument', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			await expect(
				// @ts-expect-error not a thunk
				_catchUnknownSigner(42),
			).rejects.toThrow(/function/);
		});
	});

	describe('Policy frame plumbing', () => {
		/**
		 * The frame the seam reads is `{policy: 'throw'}`, and it is in force for the action
		 * and nothing else.
		 *
		 * The environment exposes ONE verb (`runUnderUnknownSignerPolicy`) rather than a push
		 * and a pop, so "the scope is retired afterwards" is no longer something this package
		 * can get wrong: it does not own the `finally` any more. What is still worth pinning
		 * here is the frame's CONTENT and that the action really runs inside it.
		 */
		it('runs the action under a {policy: "throw"} scope', async () => {
			const {env} = await safeOwnerEnvironment();
			const runUnder = vi.spyOn(env, 'runUnderUnknownSignerPolicy');
			const _catchUnknownSigner = catchUnknownSigner(env);

			let scopesOpenDuringAction = 0;
			await _catchUnknownSigner(
				async () => {
					scopesOpenDuringAction = runUnder.mock.calls.length;
					await upgradeCall(env, env.resolveAccount('admin'));
				},
				{log: false},
			);

			expect(scopesOpenDuringAction).toBe(1);
			expect(runUnder).toHaveBeenCalledTimes(1);
			expect(runUnder.mock.calls[0][0]).toEqual({policy: 'throw'});
		});

		/**
		 * An action that throws something ELSE (a bug in the deploy script, a reverted read,
		 * an RPC failure) still leaves the run with its ambient policy back.
		 *
		 * That the scope is retired is asserted BEHAVIOURALLY, on an ambient `'ask'` run, in
		 * `per-call-policy.integration.test.ts`: a stranded `'throw'` frame would silently
		 * disable the interactive policy for the rest of the run, and counting calls would
		 * not notice. What this one pins is that the foreign error propagates rather than
		 * being swallowed as if it were a deferral.
		 */
		it('lets a non-UnknownSignerError out of the scope', async () => {
			const {env} = await safeOwnerEnvironment();
			const runUnder = vi.spyOn(env, 'runUnderUnknownSignerPolicy');
			const _catchUnknownSigner = catchUnknownSigner(env);

			await expect(
				_catchUnknownSigner(async () => {
					throw new Error('something else went wrong');
				}),
			).rejects.toThrow('something else went wrong');

			expect(runUnder).toHaveBeenCalledTimes(1);
		});

		/** One scope per call, including when one wrapper is nested inside another. */
		it('opens exactly one scope per call, and nests', async () => {
			const {env} = await safeOwnerEnvironment();
			const runUnder = vi.spyOn(env, 'runUnderUnknownSignerPolicy');
			const _catchUnknownSigner = catchUnknownSigner(env);

			await _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('deployer')), {log: false});
			await _catchUnknownSigner(
				() => _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('deployer')), {log: false}),
				{log: false},
			);

			expect(runUnder.mock.calls.length).toBe(3);
		});
	});

	describe('ANTI-REGRESSION (ADR 0006): the frame never defeats impersonation', () => {
		/**
		 * The frame `catchUnknownSigner` pushes forces `throw` over `ask`, NEVER over
		 * impersonation. An account the node CAN sign for — including an impersonated one
		 * — is signable, full stop, and still BROADCASTS inside the wrapper.
		 *
		 * This is the misreading that bounced an earlier task set: if `catchUnknownSigner`
		 * tried to defeat `autoImpersonate`, every fork test wrapped in it would silently
		 * change behaviour, and the mixed run (story 6) would break.
		 */
		it('still broadcasts an impersonated account inside the wrapper', async () => {
			const {env, provider} = await createTestEnvironment({
				accounts: {admin: SAFE_ADDRESS},
				nodeAccounts: [],
				executionParams: {autoImpersonate: true},
			});
			expect(env.addressSignability[SAFE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('impersonated');

			const _catchUnknownSigner = catchUnknownSigner(env);
			const receipt = await upgradeCall(env, env.resolveAccount('admin')).then(
				(r) => r,
				() => undefined,
			);
			expect(receipt).toBeDefined();

			provider.clearRequests();
			const result = await _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('admin')), {log: false});

			// nothing was caught: the impersonated account broadcast as usual
			expect(result).toBe(null);
			expect(provider.getRequests().some((r) => r.method === 'eth_sendTransaction')).toBe(true);
		});

		/**
		 * Story 6, the MIXED run inside ONE wrapper: the signable call broadcasts, and
		 * only the genuinely unsignable one is caught.
		 */
		it('broadcasts the signable call and catches only the unsignable one', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const broadcast: string[] = [];
			const deferred = await _catchUnknownSigner(
				async () => {
					await upgradeCall(env, env.resolveAccount('deployer'));
					broadcast.push('deployer');
					await upgradeCall(env, env.resolveAccount('admin'));
					broadcast.push('admin');
				},
				{log: false},
			);

			expect(broadcast).toEqual(['deployer']);
			expect(deferred?.from).toBe(env.resolveAccount('admin'));
		});
	});

	describe('Printing the transaction to execute', () => {
		/**
		 * The printed block is what the user reads before opening their Safe, so it names
		 * the contract, the method and each argument when the seam enriched the error with
		 * a `contract` block.
		 */
		it('prints a v1-style block including the contract, method and args', async () => {
			const {env} = await safeOwnerEnvironment();
			const messages: string[] = [];
			vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
				messages.push(message);
			});
			const _catchUnknownSigner = catchUnknownSigner(env);

			await _catchUnknownSigner(() => {
				throw new UnknownSignerError({
					from: SAFE_ADDRESS,
					to: TARGET_CONTRACT,
					data: '0xdeadbeef',
					value: 1000n,
					contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xnewimpl', [1n, 2n]]},
				});
			});

			const printed = messages.join('\n');
			expect(printed).toContain(SAFE_ADDRESS);
			expect(printed).toContain(`to: ${TARGET_CONTRACT} (MyProxy)`);
			expect(printed).toContain('method: upgradeTo');
			expect(printed).toContain('0xnewimpl');
			// bigints nested in an argument must render, never throw (a `uint256[]` argument)
			expect(printed).toContain('1n');
			expect(printed).toContain('value: 1000');
			expect(printed).toContain('data: 0xdeadbeef');
		});

		/**
		 * `contract.name` is optional (it is a reverse-lookup that can miss), so the
		 * printed target falls back to the raw `to` address.
		 */
		it('falls back to the `to` address when contract.name is absent', async () => {
			const {env} = await safeOwnerEnvironment();
			const messages: string[] = [];
			vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
				messages.push(message);
			});
			const _catchUnknownSigner = catchUnknownSigner(env);

			await _catchUnknownSigner(() => {
				throw new UnknownSignerError({
					from: SAFE_ADDRESS,
					to: TARGET_CONTRACT,
					contract: {method: 'upgradeTo', args: []},
				});
			});

			const printed = messages.join('\n');
			expect(printed).toContain(`to: ${TARGET_CONTRACT}`);
			expect(printed).not.toContain('(undefined)');
		});

		/** `log: false` suppresses the print, and still returns the value. */
		it('suppresses the print when log is false but still returns the value', async () => {
			const {env} = await safeOwnerEnvironment();
			const showMessage = vi.spyOn(env, 'showMessage').mockImplementation(() => undefined);
			const _catchUnknownSigner = catchUnknownSigner(env);

			const deferred = await _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('admin')), {
				log: false,
			});

			expect(showMessage).not.toHaveBeenCalled();
			expect(deferred?.from).toBe(env.resolveAccount('admin'));
		});

		/** Printing is ON by default, matching v1. */
		it('prints by default and when log is explicitly true', async () => {
			const {env} = await safeOwnerEnvironment();
			const showMessage = vi.spyOn(env, 'showMessage').mockImplementation(() => undefined);
			const _catchUnknownSigner = catchUnknownSigner(env);
			const admin = env.resolveAccount('admin');

			await _catchUnknownSigner(() => upgradeCall(env, admin));
			await _catchUnknownSigner(() => upgradeCall(env, admin), {});
			await _catchUnknownSigner(() => upgradeCall(env, admin), {log: true});

			expect(showMessage).toHaveBeenCalledTimes(3);
		});
	});

	describe('Errors that are not UnknownSignerError', () => {
		/** Rethrown unchanged — same instance, same message, same custom fields. */
		it('rethrows the exact error instance', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			class CustomError extends Error {
				readonly code = 'CUSTOM';
			}
			const thrown = new CustomError('boom');

			const caught = await _catchUnknownSigner(async () => {
				throw thrown;
			}).then(
				() => undefined,
				(e) => e,
			);

			expect(caught).toBe(thrown);
			expect((caught as CustomError).code).toBe('CUSTOM');
		});

		/**
		 * Cross-realm safety: an `UnknownSignerError` built in another realm (a duplicated
		 * `@rocketh/core` in the dependency tree, a worker) fails `instanceof`, so the
		 * stable `name` is the fallback. Without it a migrated v1 script would see the
		 * error rethrown instead of caught.
		 */
		it('catches a cross-realm UnknownSignerError by name', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const foreign = Object.assign(new Error('unknown signer from another realm'), {
				name: 'UnknownSignerError',
				data: {from: SAFE_ADDRESS, to: TARGET_CONTRACT, data: '0xdeadbeef'},
			});

			const deferred = await _catchUnknownSigner(
				async () => {
					throw foreign;
				},
				{log: false},
			);

			expect(deferred).toStrictEqual({
				from: SAFE_ADDRESS,
				to: TARGET_CONTRACT,
				value: undefined,
				data: '0xdeadbeef',
			});
		});

		/** An error merely NAMED like ours but without `data` is not ours; rethrow it. */
		it('rethrows a look-alike error that carries no data', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);

			const lookAlike = Object.assign(new Error('not really'), {name: 'UnknownSignerError'});

			await expect(
				_catchUnknownSigner(async () => {
					throw lookAlike;
				}),
			).rejects.toBe(lookAlike);
		});
	});

	describe('Zero persistence (v1 parity)', () => {
		/**
		 * NOTHING is written. Idempotency is on-chain-state-driven: the user executes the
		 * deferred transaction on their Safe and re-runs the idempotent script, whose
		 * on-chain state check then skips the completed step. There is no unsigned-tx file
		 * and no other side effect — a persisted batch, if ever built, belongs downstream.
		 */
		it('writes nothing to the deployment store', async () => {
			const store = createMapDeploymentStore();
			const writeFile = vi.spyOn(store, 'writeFile');
			const writeFileWithChainInfo = vi.spyOn(store, 'writeFileWithChainInfo');
			const deleteFile = vi.spyOn(store, 'deleteFile');
			const deleteAll = vi.spyOn(store, 'deleteAll');

			const {env} = await safeOwnerEnvironment({deploymentStore: store});
			const _catchUnknownSigner = catchUnknownSigner(env);

			const deferred = await _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('admin')), {
				log: false,
			});

			expect(deferred).not.toBe(null);
			expect(writeFile).not.toHaveBeenCalled();
			expect(writeFileWithChainInfo).not.toHaveBeenCalled();
			expect(deleteFile).not.toHaveBeenCalled();
			expect(deleteAll).not.toHaveBeenCalled();
			expect(await store.listFiles('deployments', env.name)).toEqual([]);
		});

		/** The wrapper mutates nothing on the environment beyond the push/pop frame. */
		it('leaves the environment unchanged', async () => {
			const {env} = await safeOwnerEnvironment();
			const _catchUnknownSigner = catchUnknownSigner(env);
			const before = Object.keys(env).sort();

			await _catchUnknownSigner(() => upgradeCall(env, env.resolveAccount('admin')), {log: false});

			expect(Object.keys(env).sort()).toEqual(before);
			expect(Object.keys(env.deployments)).toEqual([]);
		});
	});
});
