import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {UnknownSignerError} from '@rocketh/core';
import type {UnknownSignerErrorData} from '@rocketh/core';
import type {DeploymentStore, Environment} from '@rocketh/core/types';
import {createMockArtifact, createTestEnvironment} from '@rocketh/test-utils';

import {catchUnknownSigner} from '../src/index.js';
import type {CaughtUnknownSignerTransaction} from '../src/index.js';

/**
 * `@rocketh/unknown-signer` — THE hardhat-deploy v1 PARITY CONTRACT, in one file.
 *
 * A team migrating from hardhat-deploy v1 has deploy scripts built on
 * `deployments.catchUnknownSigner`. Those scripts encode a governance procedure a human
 * follows on a real Safe, so a silent behaviour change is not a failing test, it is an
 * operator executing the wrong transaction. This file is what makes such a change go RED.
 *
 * The promise (spec `unknown-signer-v1-migration`) has three parts, one `describe` each:
 *
 * 1. RETURN-SHAPE PARITY: `null` on success; otherwise exactly `{from, to, value, data}`,
 *    every key PRESENT even when `undefined` (v1 returned a destructure, so `'to' in result`
 *    and `Object.keys(result)` are legitimate consumer code), `value` a string, and never
 *    `contract`. Any future field may only ever be ADDITIVE.
 * 2. NO SIDE EFFECTS: a deferring run persists nothing. No unsigned-transactions file, no
 *    deployment record, no state a second run could read (ADR 0006: persistence, if ever
 *    built, is an opt-in downstream concern, never the wrapper's).
 * 3. THUNK-ONLY, LOUDLY: the one deliberate divergence from v1. `catchUnknownSigner(p)`
 *    with an already-started promise fails with an error naming the arrow-function fix.
 *
 * Plus the printed block, which is v1's layout and is deliberately NOT extended by the
 * repeat-execution note an UNWRAPPED deferral now carries (that note is suppressed for a
 * scoped `throw`, which is every `catchUnknownSigner`). Parity is about the returned object
 * and that block, NOT about the whole of stderr: do not add a test pinning the full
 * surfaced output of an unwrapped run to v1, it was never meant to match.
 *
 * What is NOT tested here: the sign-vs-defer decision itself. That is the seam's job, in
 * `rocketh`, and is pinned there. These tests are about what the WRAPPER returns and what
 * it does not do.
 *
 * `catchUnknownSigner.integration.test.ts` covers the mechanism in more breadth (policy
 * frame plumbing, cross-realm errors, impersonation). Some assertions are deliberately
 * restated here so that the parity contract can be read, and pointed at, in one place.
 */

/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
/** An address the mock node lists in `eth_accounts`, so it is signable. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';

/** v1's four keys, in sorted order, which is how `Object.keys(...).sort()` compares them. */
const V1_KEYS = ['data', 'from', 'to', 'value'];

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

/** A deploy from `from`: no `to`, no `value`, which is what exercises the `undefined` keys. */
function deployCall(env: Environment, name: string, from: `0x${string}`) {
	const artifact = createMockArtifact(name);
	return env.broadcastDeployment(
		name,
		{
			type: 'object',
			data: {
				type: '0x2',
				from,
				data: artifact.bytecode,
				chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
			},
		},
		{abi: artifact.abi, bytecode: artifact.bytecode, metadata: artifact.metadata, argsData: '0x'},
	);
}

/** An environment whose named `admin` is unsignable (no signer material, no impersonation). */
async function safeOwnerEnvironment(options?: {deploymentStore?: DeploymentStore; deploymentsFolder?: string}) {
	return createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT, admin: SAFE_ADDRESS},
		nodeAccounts: [NODE_ACCOUNT],
		executionParams: {autoImpersonate: false},
		deploymentStore: options?.deploymentStore,
		config: options?.deploymentsFolder ? {deployments: options.deploymentsFolder} : undefined,
	});
}

/** Throw the error the seam would, with exactly the data given: drives the wrapper alone. */
function throwing(data: UnknownSignerErrorData) {
	return () => {
		throw new UnknownSignerError(data);
	};
}

/**
 * The ADDITIVE-SAFE half of the shape contract: the four v1 keys are present and carry
 * their v1 meaning, whatever else the object might one day carry. Kept apart from the
 * exact-key-set assertion on purpose, so that a deliberate additive field changes ONE
 * test (the key set) and leaves every "v1 meaning" assertion standing.
 */
function expectV1Core(result: CaughtUnknownSignerTransaction | null, expected: Record<string, unknown>) {
	expect(result).not.toBe(null);
	expect(typeof result).toBe('object');
	const r = result as Record<string, unknown>;
	for (const key of V1_KEYS) {
		// PRESENCE, not value: `toHaveProperty` / `toEqual` would accept a missing key as `undefined`
		expect(key in r, `key "${key}" must be present on the returned object`).toBe(true);
		expect(r[key]).toStrictEqual(expected[key]);
	}
}

describe('@rocketh/unknown-signer - hardhat-deploy v1 parity', () => {
	describe('1. Return-shape parity', () => {
		/** Nothing to catch: v1 returned `null`, not `undefined`, not `{}`, not the receipt. */
		it('returns exactly null when the action succeeds', async () => {
			const {env} = await safeOwnerEnvironment();

			const result = await catchUnknownSigner(env)(() => upgradeCall(env, env.resolveAccount('deployer')), {
				log: false,
			});

			expect(result).toBe(null);
		});

		/** Also `null` when the action returns a value of its own: the wrapper does not forward it. */
		it('returns exactly null when the action resolves to a value', async () => {
			const {env} = await safeOwnerEnvironment();

			const result = await catchUnknownSigner(env)(async () => ({some: 'value'}), {log: false});

			expect(result).toBe(null);
		});

		/**
		 * The canonical deferral: a real transaction from the Safe reaching the real seam.
		 * Every key has a value, and the key set is exactly v1's.
		 */
		it('returns {from, to, value, data} and exactly those keys for a deferred call', async () => {
			const {env} = await safeOwnerEnvironment();
			const admin = env.resolveAccount('admin');

			const result = await catchUnknownSigner(env)(() => upgradeCall(env, admin), {log: false});

			expectV1Core(result, {from: admin, to: TARGET_CONTRACT, value: '0x1f4', data: '0xdeadbeef'});
			expect(Object.keys(result!).sort()).toEqual(V1_KEYS);
		});

		/**
		 * A deferred DEPLOY has no `to` and no `value`. v1 destructured them, so both keys
		 * are still PRESENT, holding `undefined`. A consumer doing `'to' in result` to tell
		 * a deploy from a call, or `Object.keys(result)` to build a spreadsheet row, must
		 * see the same answer it saw on v1.
		 */
		it('keeps `to` and `value` present as undefined on a deferred deploy', async () => {
			const {env} = await safeOwnerEnvironment();
			const admin = env.resolveAccount('admin');

			const result = await catchUnknownSigner(env)(() => deployCall(env, 'Upgraded', admin), {log: false});

			expect(result).not.toBe(null);
			expect('from' in result!).toBe(true);
			expect('to' in result!).toBe(true);
			expect('value' in result!).toBe(true);
			expect('data' in result!).toBe(true);
			expect(result!.to).toBe(undefined);
			expect(result!.value).toBe(undefined);
			expect(Object.keys(result!).sort()).toEqual(V1_KEYS);
			expect(result).toStrictEqual({
				from: admin,
				to: undefined,
				value: undefined,
				data: createMockArtifact('Upgraded').bytecode,
			});
		});

		/**
		 * The degenerate case, where the error carries nothing but `from`: `data` is the
		 * key whose presence has not been exercised above, so it is exercised here. All
		 * three optional keys must still be present.
		 */
		it('keeps `to`, `value` and `data` present as undefined when the error carries only `from`', async () => {
			const {env} = await safeOwnerEnvironment();

			const result = await catchUnknownSigner(env)(throwing({from: SAFE_ADDRESS}), {log: false});

			expect('to' in result!).toBe(true);
			expect('value' in result!).toBe(true);
			expect('data' in result!).toBe(true);
			expect(Object.keys(result!).sort()).toEqual(V1_KEYS);
			expectV1Core(result, {from: SAFE_ADDRESS, to: undefined, value: undefined, data: undefined});
		});

		/**
		 * `UnknownSignerErrorData.value` is `bigint | string`; v1 always returned a string.
		 * A bigint is stringified in decimal and a string passes through untouched. `0n` is
		 * in the list on purpose: it is FALSY, so a truthiness shortcut would turn a
		 * zero-value transaction into `undefined` and change what the operator executes.
		 */
		it.each([
			{input: 1000000000000000000n, expected: '1000000000000000000'},
			{input: 500n, expected: '500'},
			{input: 0n, expected: '0'},
			{input: '0x1f4', expected: '0x1f4'},
			{input: '0', expected: '0'},
		])('returns value $input as the string $expected, never a bigint', async ({input, expected}) => {
			const {env} = await safeOwnerEnvironment();

			const result = await catchUnknownSigner(env)(
				throwing({from: SAFE_ADDRESS, to: TARGET_CONTRACT, value: input, data: '0x'}),
				{log: false},
			);

			expect(typeof result!.value).toBe('string');
			expect(typeof result!.value).not.toBe('bigint');
			expect(result!.value).toBe(expected);
			// a bigint anywhere in the result would make `JSON.stringify` throw: a v1 script
			//  stashing the result in a JSON file must keep working
			expect(() => JSON.stringify(result)).not.toThrow();
		});

		/**
		 * `contract` is presentation-only enrichment of the PRINTED block. v1 never returned
		 * it, so it is never a key, not even as `undefined`, even when the error carries a
		 * full `contract` block with a name, a method and arguments (including a bigint that
		 * would break a consumer's `JSON.stringify`).
		 */
		it('never has a `contract` key, even when the error carries one', async () => {
			const {env} = await safeOwnerEnvironment();

			const result = await catchUnknownSigner(env)(
				throwing({
					from: SAFE_ADDRESS,
					to: TARGET_CONTRACT,
					data: '0xdeadbeef',
					value: 7n,
					contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xnewimpl', 1n]},
				}),
				{log: false},
			);

			expect('contract' in result!).toBe(false);
			expect(Object.keys(result!).sort()).toEqual(V1_KEYS);
			expectV1Core(result, {from: SAFE_ADDRESS, to: TARGET_CONTRACT, value: '7', data: '0xdeadbeef'});
		});

		/**
		 * FROZEN KEY SET, stated once with the reason next to it. Today the object has
		 * exactly v1's four keys. A future field is allowed only if it is ADDITIVE: a PR
		 * that adds one must change THIS assertion deliberately, and must leave every
		 * `expectV1Core` assertion in this file passing, which is what "the four keys keep
		 * their v1 meaning" means in test form.
		 */
		it('has exactly the v1 key set; anything more must be a deliberate, additive change', async () => {
			const {env} = await safeOwnerEnvironment();

			const result = await catchUnknownSigner(env)(
				throwing({from: SAFE_ADDRESS, to: TARGET_CONTRACT, value: 1n, data: '0x01'}),
				{log: false},
			);

			expect(Object.keys(result!).sort()).toEqual(V1_KEYS);
			// the result is a plain object: a consumer spreading or serialising it sees only data
			expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
			expect(JSON.parse(JSON.stringify(result))).toEqual({
				from: SAFE_ADDRESS,
				to: TARGET_CONTRACT,
				value: '1',
				data: '0x01',
			});
		});

		/**
		 * The wrapper returns rather than rejects, so the rest of a migrated v1 script runs:
		 * this is what `catchUnknownSigner` is FOR. The FIRST unsignable transaction in the
		 * action is the one returned, and nothing after it in the action runs.
		 */
		it('resolves (does not reject), returning the first deferred transaction', async () => {
			const {env} = await safeOwnerEnvironment();
			const admin = env.resolveAccount('admin');
			const steps: string[] = [];

			const result = await catchUnknownSigner(env)(
				async () => {
					await upgradeCall(env, admin);
					steps.push('after-first');
					await deployCall(env, 'Never', admin);
				},
				{log: false},
			);
			steps.push('script-continues');

			expect(steps).toEqual(['script-continues']);
			expectV1Core(result, {from: admin, to: TARGET_CONTRACT, value: '0x1f4', data: '0xdeadbeef'});
		});
	});

	describe('2. No side effects: a deferring run persists nothing', () => {
		/**
		 * The scratch directory every test in this group writes to. Never a real user path:
		 * it is created under `os.tmpdir()` and removed afterwards.
		 */
		let scratch: string;
		let deploymentsFolder: string;

		beforeEach(() => {
			scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-unknown-signer-v1-parity-'));
			deploymentsFolder = path.join(scratch, 'deployments');
		});

		afterEach(() => {
			fs.rmSync(scratch, {recursive: true, force: true});
		});

		/**
		 * Example: a run whose Safe-owned upgrade defers, against a deployments folder that
		 * already holds a previous run's records (which is the situation in a real repo).
		 * The folder must be BYTE-IDENTICAL afterwards: no `.pending_transactions.json`, no
		 * record for the contract the Safe would have deployed, no batch file, nothing a
		 * second run could read. Idempotency comes from on-chain state alone, as in v1.
		 *
		 * This is the test a future batching / Safe-proposal feature trips if it starts
		 * persisting by default instead of opt-in.
		 */
		it('leaves a filesystem deployments folder byte-identical', async () => {
			const store = createFileSystemDeploymentStore();

			// a previous run: the deployer (signable) deployed something, so the folder is populated
			const seed = await safeOwnerEnvironment({deploymentStore: store, deploymentsFolder});
			await deployCall(seed.env, 'Existing', seed.env.resolveAccount('deployer'));
			const before = snapshotDirectory(scratch);
			// the seed really did write through the store, so an empty "after" could not pass vacuously
			expect(before.map((entry) => entry.path)).toEqual(
				expect.arrayContaining(['deployments/memory/Existing.json', 'deployments/memory/.chain']),
			);

			// this run: spy from the start, load those records the way the executor does at the
			//  start of a run, then defer both a call and a deploy from the Safe
			const writes = spyOnStoreMutations(store);
			const {env, internal} = await safeOwnerEnvironment({deploymentStore: store, deploymentsFolder});
			await internal.loadDeployments();
			expect(env.getOrNull('Existing')).not.toBe(null);
			const admin = env.resolveAccount('admin');

			const deferredCall = await catchUnknownSigner(env)(() => upgradeCall(env, admin), {log: false});
			const deferredDeploy = await catchUnknownSigner(env)(() => deployCall(env, 'Upgraded', admin), {
				log: false,
			});

			expect(deferredCall).not.toBe(null);
			expect(deferredDeploy).not.toBe(null);
			expect(snapshotDirectory(scratch)).toEqual(before);
			for (const spy of writes) expect(spy).not.toHaveBeenCalled();
			expect(env.getOrNull('Upgraded')).toBe(null);
		});

		/**
		 * From an EMPTY folder, a deferring run creates nothing at all: not the environment
		 * directory, not a `.chain` marker. A CI job with a "working tree is clean" check
		 * after a deploy must keep passing when that deploy deferred.
		 */
		it('creates no file or directory when the deployments folder does not exist yet', async () => {
			const store = createFileSystemDeploymentStore();
			const {env} = await safeOwnerEnvironment({deploymentStore: store, deploymentsFolder});
			const writes = spyOnStoreMutations(store);
			const before = snapshotDirectory(scratch);
			expect(before).toEqual([]);

			const deferred = await catchUnknownSigner(env)(() => upgradeCall(env, env.resolveAccount('admin')), {
				log: false,
			});

			expect(deferred).not.toBe(null);
			expect(snapshotDirectory(scratch)).toEqual([]);
			expect(fs.existsSync(deploymentsFolder)).toBe(false);
			for (const spy of writes) expect(spy).not.toHaveBeenCalled();
		});

		/**
		 * ISOLATION. The run is pointed at the scratch folder through the `deployments`
		 * config option, so every store access must name a folder inside it, and nothing
		 * may appear in the places a mis-resolved default `deployments` folder would land:
		 * the working directory, this package, the repository root, the user's home. The
		 * package tree itself is snapshotted as well, so a stray file anywhere in it fails.
		 */
		it('touches only the scratch folder, never the repo tree or the user home', async () => {
			const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
			const repoRoot = path.resolve(packageRoot, '..', '..');
			const defaultFolderCandidates = [
				path.resolve(process.cwd(), 'deployments'),
				path.join(packageRoot, 'deployments'),
				path.join(repoRoot, 'deployments'),
				path.join(os.homedir(), 'deployments'),
			];
			const existedBefore = defaultFolderCandidates.map((p) => fs.existsSync(p));
			const packageTreeBefore = snapshotDirectory(packageRoot, {skip: ['node_modules', 'dist', '.turbo']});

			const store = createFileSystemDeploymentStore();
			const accessedFolders = spyOnStoreFolders(store);
			const seed = await safeOwnerEnvironment({deploymentStore: store, deploymentsFolder});
			await deployCall(seed.env, 'Existing', seed.env.resolveAccount('deployer'));
			const {env} = await safeOwnerEnvironment({deploymentStore: store, deploymentsFolder});
			await catchUnknownSigner(env)(() => upgradeCall(env, env.resolveAccount('admin')), {log: false});

			expect(accessedFolders.length).toBeGreaterThan(0);
			for (const folder of accessedFolders) {
				expect(path.resolve(folder).startsWith(scratch + path.sep)).toBe(true);
			}
			expect(defaultFolderCandidates.map((p) => fs.existsSync(p))).toEqual(existedBefore);
			expect(snapshotDirectory(packageRoot, {skip: ['node_modules', 'dist', '.turbo']})).toEqual(packageTreeBefore);
		});

		/**
		 * The in-memory half of "no deployment-record mutation": the environment's own
		 * deployment map is unchanged too, so nothing later in the SAME run can read a
		 * record of a step that did not happen.
		 */
		it('adds no deployment record to the environment', async () => {
			const {env} = await safeOwnerEnvironment();
			const before = Object.keys(env.deployments).sort();

			await catchUnknownSigner(env)(() => deployCall(env, 'Upgraded', env.resolveAccount('admin')), {log: false});

			expect(Object.keys(env.deployments).sort()).toEqual(before);
			expect(env.getOrNull('Upgraded')).toBe(null);
		});
	});

	describe('3. Thunk-only, and loud about it (the one deliberate divergence from v1)', () => {
		/**
		 * v1 accepted `catchUnknownSigner(execute(...))`. Here that promise has already
		 * STARTED before the wrapper runs, so there is no moment to establish the policy;
		 * accepting it would give a wrapper that silently does not defer. The error must
		 * tell the migrating user exactly what to change, and must say who is complaining.
		 */
		it('rejects the v1 promise form with a message naming the arrow-function fix', async () => {
			const {env} = await safeOwnerEnvironment();
			const runUnder = vi.spyOn(env, 'runUnderUnknownSignerPolicy');
			const alreadyStarted = upgradeCall(env, env.resolveAccount('admin')).catch(() => undefined);

			const error = await catchUnknownSigner(env)(
				// @ts-expect-error the v1 promise form is deliberately not accepted
				alreadyStarted,
				{log: false},
			).then(
				() => undefined,
				(e: unknown) => e,
			);
			await alreadyStarted;

			expect(error).toBeInstanceOf(Error);
			const message = (error as Error).message;
			expect(message).toContain('@rocketh/unknown-signer');
			expect(message).toContain('catchUnknownSigner');
			expect(message).toContain('() =>');
			expect(message).toContain('catchUnknownSigner(env)(() => execute(...))');
			expect(message).toMatch(/not a promise/);
			// rejected BEFORE any policy scope was opened, so nothing can leak into the run
			expect(runUnder).not.toHaveBeenCalled();
		});

		/**
		 * Any other non-function argument is a caller mistake, never a silent `null` (which
		 * would read as "succeeded, nothing to execute" and is the worst possible answer).
		 */
		it.each([
			{label: 'a number', value: 42, type: 'number'},
			{label: 'undefined', value: undefined, type: 'undefined'},
			{label: 'null', value: null, type: 'object'},
			{label: 'a string', value: '0xdeadbeef', type: 'string'},
			{label: 'a plain object', value: {from: SAFE_ADDRESS}, type: 'object'},
		])('rejects $label with a message naming the arrow-function fix', async ({value, type}) => {
			const {env} = await safeOwnerEnvironment();
			const runUnder = vi.spyOn(env, 'runUnderUnknownSignerPolicy');

			const error = await catchUnknownSigner(env)(value as never, {log: false}).then(
				() => undefined,
				(e: unknown) => e,
			);

			expect(error).toBeInstanceOf(Error);
			const message = (error as Error).message;
			expect(message).toContain('@rocketh/unknown-signer');
			expect(message).toContain('catchUnknownSigner');
			expect(message).toContain('() =>');
			expect(message).toContain(`received ${type}`);
			expect(runUnder).not.toHaveBeenCalled();
		});

		/** The migrated form, the only mechanical change: the same call behind `() =>` works. */
		it('accepts the migrated thunk form, sync or async', async () => {
			const {env} = await safeOwnerEnvironment();
			const admin = env.resolveAccount('admin');

			const viaSyncThunk = await catchUnknownSigner(env)(() => upgradeCall(env, admin), {log: false});
			const viaAsyncThunk = await catchUnknownSigner(env)(async () => upgradeCall(env, admin), {log: false});

			expect(viaSyncThunk).toStrictEqual(viaAsyncThunk);
			expectV1Core(viaSyncThunk, {from: admin, to: TARGET_CONTRACT, value: '0x1f4', data: '0xdeadbeef'});
		});
	});

	describe('The printed block (v1 layout, unchanged by the unwrapped-run note)', () => {
		/**
		 * The block a user reads before opening their Safe, pinned in full: the method and
		 * each argument on their own line, as v1 printed them. Pinned exactly on purpose,
		 * because an operator follows this text by hand.
		 *
		 * An UNWRAPPED deferral now appends a note warning that a re-run surfaces the same
		 * transaction; that note is suppressed for a scoped `throw`, which is what every
		 * `catchUnknownSigner` pushes. So the exact equality below also pins that a wrapped
		 * v1 call sees no new text.
		 */
		it('prints exactly the v1 block and nothing else', async () => {
			const {env} = await safeOwnerEnvironment();
			const messages: string[] = [];
			vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
				messages.push(message);
			});

			await catchUnknownSigner(env)(
				throwing({
					from: SAFE_ADDRESS,
					to: TARGET_CONTRACT,
					data: '0xdeadbeef',
					value: 1000n,
					contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xnewimpl', 3n]},
				}),
			);

			const separator = '-'.repeat(87);
			expect(messages).toEqual([
				[
					separator,
					`no signer for ${SAFE_ADDRESS}`,
					'Please execute the following transaction, then re-run this script:',
					separator,
					`from: ${SAFE_ADDRESS}`,
					`to: ${TARGET_CONTRACT} (MyProxy)`,
					'method: upgradeTo',
					'args:',
					'  - 0xnewimpl',
					'  - 3',
					'value: 1000',
					'data: 0xdeadbeef',
					separator,
				].join('\n'),
			]);
		});

		/** The same, end to end through the real seam: one message, no repeat-execution note. */
		it('adds no repeat-execution note to a wrapped deferral from the real seam', async () => {
			const {env} = await safeOwnerEnvironment();
			const messages: string[] = [];
			vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
				messages.push(message);
			});

			await catchUnknownSigner(env)(() => upgradeCall(env, env.resolveAccount('admin')));

			expect(messages).toHaveLength(1);
			expect(messages[0].startsWith('-'.repeat(87) + '\nno signer for ')).toBe(true);
			expect(messages[0].endsWith('\n' + '-'.repeat(87))).toBe(true);
		});
	});
});

// ============================================================================
// Fixtures
// ============================================================================

/**
 * A filesystem-backed `DeploymentStore` with the same on-disk layout and semantics as
 * `@rocketh/node`'s `createFSDeploymentStore` (`<deploymentsFolder>/<environment>/<name>`,
 * a `.chain` marker written on the first `writeFileWithChainInfo`).
 *
 * Mirrored here rather than imported because `@rocketh/node` does not export its store,
 * and pulling its `src` across the package boundary would put another package's sources
 * into this package's type-checked program. What these tests pin is that NOTHING reaches
 * the disk, and for that the property that matters is that every write goes to a real
 * directory the test can snapshot, which this store guarantees.
 */
function createFileSystemDeploymentStore(): DeploymentStore {
	const folderOf = (deploymentsFolder: string, environmentName: string) =>
		path.join(deploymentsFolder, environmentName);
	const fileOf = (deploymentsFolder: string, environmentName: string, name: string) =>
		path.join(deploymentsFolder, environmentName, name);

	// synchronous on purpose: the environment does not await its record writes, so a write
	//  that spanned a microtask could land after a snapshot was taken
	function writeFileSync(deploymentsFolder: string, environmentName: string, name: string, content: string) {
		fs.mkdirSync(folderOf(deploymentsFolder, environmentName), {recursive: true});
		fs.writeFileSync(fileOf(deploymentsFolder, environmentName, name), content);
	}

	return {
		async listFiles(deploymentsFolder, environmentName, filter) {
			const files = fs.readdirSync(folderOf(deploymentsFolder, environmentName));
			return filter ? files.filter(filter) : files;
		},
		async deleteAll(deploymentsFolder, environmentName) {
			fs.rmSync(folderOf(deploymentsFolder, environmentName), {recursive: true, force: true});
		},
		async hasFile(deploymentsFolder, environmentName, name) {
			return fs.existsSync(fileOf(deploymentsFolder, environmentName, name));
		},
		async writeFile(deploymentsFolder, environmentName, name, content) {
			writeFileSync(deploymentsFolder, environmentName, name, content);
		},
		async writeFileWithChainInfo(chainInfo, deploymentsFolder, environmentName, name, content) {
			if (!fs.existsSync(fileOf(deploymentsFolder, environmentName, '.chain'))) {
				writeFileSync(
					deploymentsFolder,
					environmentName,
					'.chain',
					JSON.stringify({chainId: chainInfo.chainId, genesisHash: chainInfo.genesisHash}),
				);
			}
			writeFileSync(deploymentsFolder, environmentName, name, content);
		},
		async readFile(deploymentsFolder, environmentName, name) {
			return fs.readFileSync(fileOf(deploymentsFolder, environmentName, name), 'utf-8');
		},
		async deleteFile(deploymentsFolder, environmentName, name) {
			fs.unlinkSync(fileOf(deploymentsFolder, environmentName, name));
		},
	};
}

/** Spy on every method of the store that can change what is on disk. */
function spyOnStoreMutations(store: DeploymentStore) {
	return [
		vi.spyOn(store, 'writeFile'),
		vi.spyOn(store, 'writeFileWithChainInfo'),
		vi.spyOn(store, 'deleteFile'),
		vi.spyOn(store, 'deleteAll'),
	];
}

/** Record the deployments folder named by EVERY store call, reads included. */
function spyOnStoreFolders(store: DeploymentStore): string[] {
	const folders: string[] = [];
	const methods = ['listFiles', 'deleteAll', 'hasFile', 'writeFile', 'readFile', 'deleteFile'] as const;
	for (const method of methods) {
		const original = store[method] as (...args: unknown[]) => Promise<unknown>;
		(store as Record<string, unknown>)[method] = (...args: unknown[]) => {
			folders.push(args[0] as string);
			return original(...args);
		};
	}
	const originalWithChainInfo = store.writeFileWithChainInfo;
	store.writeFileWithChainInfo = (chainInfo, deploymentsFolder, ...rest) => {
		folders.push(deploymentsFolder);
		return originalWithChainInfo(chainInfo, deploymentsFolder, ...rest);
	};
	return folders;
}

type SnapshotEntry = {path: string; kind: 'dir' | 'file' | 'other'; bytes?: string};

/**
 * A recursive, byte-level picture of a directory: every entry's path relative to `root`
 * (POSIX separators, sorted), its kind, and for a file its full content (base64). Two
 * snapshots are equal only if no entry was added, removed, or changed by a single byte.
 * Names in `skip` are not descended into (build output, installed dependencies).
 */
function snapshotDirectory(root: string, options?: {skip?: string[]}): SnapshotEntry[] {
	const skip = new Set(options?.skip ?? []);
	const entries: SnapshotEntry[] = [];
	function walk(dir: string) {
		if (!fs.existsSync(dir)) return;
		for (const name of fs.readdirSync(dir).sort()) {
			if (skip.has(name)) continue;
			const full = path.join(dir, name);
			const relative = path.relative(root, full).split(path.sep).join('/');
			const stat = fs.lstatSync(full);
			if (stat.isDirectory()) {
				entries.push({path: relative, kind: 'dir'});
				walk(full);
			} else if (stat.isFile()) {
				entries.push({path: relative, kind: 'file', bytes: fs.readFileSync(full).toString('base64')});
			} else {
				entries.push({path: relative, kind: 'other'});
			}
		}
	}
	walk(root);
	return entries;
}
