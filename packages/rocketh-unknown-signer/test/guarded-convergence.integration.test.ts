/**
 * THE LOOP CLOSES: a Safe-governed upgrade, deferred on one run and SKIPPED on the next.
 *
 * This file is the answer to the question a hardhat-deploy v1 migrant asks about a script
 * whose privileged calls belong to a Safe: "I ran it, it printed a transaction, I executed
 * that transaction on my Safe, I ran it again. What stops it handing me the same
 * transaction a second time?".
 *
 * `test/scenarios.integration.test.ts` already tells this story for one call rocketh
 * happens to guard INTERNALLY: `deployViaProxy` compares the proxy's current implementation
 * itself, so a re-run after the Safe acted skips the upgrade with nothing declared by the
 * author. This file tells it for a call the USER guards, with `execute`'s `guard` option
 * (`docs/adr/0013-the-execute-guard-is-a-declared-read.md`), which is what the same
 * convergence looks like for a call rocketh knows nothing about: an upgrade through a
 * ProxyAdmin, a registry entry, a role grant, a treasury transfer.
 *
 * WHY IT CANNOT BE SOLVED BY REMEMBERING. Under the `throw` path rocketh OBSERVED nothing:
 * it did not send the transaction, it did not see one land, and it therefore may not record
 * that the step happened (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`).
 * Nothing is written between the two runs below, and the tests assert that. The ONLY thing
 * that can make run 2 skip the step is the chain itself, which is exactly what the guard
 * reads. For an idempotent setter, re-handing the operator the transaction would be a
 * wasted round trip; for a mint, a transfer, an increment or a governance action carrying
 * its own nonce, following the printed instructions twice is a loss.
 *
 * WHAT "the Safe" MEANS HERE, unchanged from the sibling scenario file: an address that is
 * UNSIGNABLE for the run. No local signing material, absent from the node's `eth_accounts`,
 * and not impersonated. It is built as a named account declared as a bare address with
 * `autoImpersonate: false` (ADR 0006). There is no Safe-specific code in rocketh.
 *
 * THREE MECHANISMS, KEPT APART, because conflating them is how this gets misread:
 *   - AUTO-IMPERSONATION is a NODE CAPABILITY, resolved BEFORE the seam. It is off here, so
 *     the Safe stays genuinely unsignable.
 *   - The UNKNOWN-SIGNER SEAM is the policy that runs AFTERWARDS, once a `from` turns out to
 *     be unsignable: print the transaction and defer.
 *   - The GUARD answers "is this call still needed", never "can we sign it". It runs BEFORE
 *     the transaction is built, so a satisfied guard reaches neither the broadcast choke
 *     point nor the seam, and an UNSATISFIED guard on an unsignable account defers exactly
 *     as it always did.
 *
 * THE HARNESS. `createTestEnvironment` builds a REAL environment (account resolution,
 * signability, the single `broadcastTransaction` choke point are all production code) wired
 * to a mock provider. That provider is not an EVM: it answers RPCs rather than executing
 * them, so the test keeps the contract storage itself. Moving a slot by hand IS how "the
 * Safe executed the transaction, out of band, in its own time" is modelled, and the provider
 * records every request, which is how a run proves what it did and did not send.
 */

import {describe, it, expect, vi} from 'vitest';
import {encodeFunctionData, getAddress} from 'viem';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';
import {createMockArtifact, createTestEnvironment, createMapDeploymentStore} from '@rocketh/test-utils';
import {deploy} from '@rocketh/deploy';
import {execute} from '@rocketh/read-execute';
import type {GuardedExecutionResult, StorageGuardEvaluation} from '@rocketh/read-execute';

import {catchUnknownSigner} from '../src/index.js';
import type {CaughtUnknownSignerTransaction} from '../src/index.js';

// ============================================================================
// The cast
// ============================================================================

/** The key we hold: the node lists it in `eth_accounts`, so it is signable. */
const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** The Safe: a named account with no signer material that the node does not hold. */
const SAFE = '0x1111111111111111111111111111111111111111' as `0x${string}`;

/**
 * The EIP-1967 IMPLEMENTATION slot: `bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`.
 *
 * The canonical topology rather than a toy, and the reason the `storage` guard kind exists:
 * a transparent proxy routes every non-admin call to its implementation and therefore
 * exposes NO getter to ask. The upgrade transaction goes to the ProxyAdmin; the only thing
 * that can confirm it landed is this slot, on the PROXY.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1967
 */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;

/**
 * OpenZeppelin's `ProxyAdmin`: the contract holding the upgrade right for a transparent
 * proxy. `upgradeAndCall` is `onlyOwner`, and in a governed system that owner is the Safe.
 */
const PROXY_ADMIN_ABI = [
	{
		type: 'function',
		name: 'upgradeAndCall',
		inputs: [
			{type: 'address', name: 'proxy'},
			{type: 'address', name: 'implementation'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'payable',
	},
] as const satisfies Abi;

/** The transparent proxy, whose ABI is EMPTY: there is nothing here a `call` guard could name. */
const PROXY_ABI = [] as const satisfies Abi;

const VAULT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

/** An ordinary contract the deployer owns, for the signable half of a mixed run. */
const REGISTRY_ABI = [
	{
		type: 'function',
		name: 'setTreasury',
		inputs: [{type: 'address', name: 'treasury'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

// ============================================================================
// THE DEPLOY SCRIPT: written ONCE, run twice, unedited
//
// Every test below calls THIS function. That is the point being made rather than a way of
// saving lines: convergence must not require the author to comment a step out, add an `if`,
// or edit anything at all between the run that defers and the run that skips. There is
// literally one script, and byte-identity is a property of the file rather than of a
// comparison a test performs.
// ============================================================================

/** What the script reports back, so a test can read what happened without editing the script. */
type ScriptOutcome = {
	/** The implementation the proxy is supposed to end up pointing at. */
	implementation: `0x${string}`;
	/** The guarded call's result, absent on the run where it was deferred (it unwound). */
	upgrade: GuardedExecutionResult<StorageGuardEvaluation<'address'>> | undefined;
	/** The transaction to execute on the Safe, or `null` when there was nothing left to do. */
	deferred: CaughtUnknownSignerTransaction | null;
};

async function upgradeTheVault(env: Environment): Promise<ScriptOutcome> {
	// ---- a step the deployer CAN sign for: ship the new implementation ----------------
	// Record-driven idempotency, as it always was: run 2 reloads this deployment and does
	//  not redeploy, which is also what keeps the guard's expected address stable.
	const implementation = await deploy(env)('Vault_Implementation', {
		account: 'deployer',
		artifact: vaultArtifact(2),
		args: [42n],
	});

	// ---- an ordinary signable step, untouched by any of this ---------------------------
	// It carries no guard, so it broadcasts on EVERY run. Nothing about wrapping a
	//  governance step, or guarding one, changes what the rest of the script does.
	await execute(env)(env.get<typeof REGISTRY_ABI>('Registry'), {
		account: 'deployer',
		functionName: 'setTreasury',
		args: [DEPLOYER],
	});

	// ---- the privileged step: only the Safe may call it ---------------------------------
	const proxy = env.get<typeof PROXY_ABI>('Vault_Proxy');
	const proxyAdmin = env.get<typeof PROXY_ADMIN_ABI>('Vault_ProxyAdmin');

	let upgrade: GuardedExecutionResult<StorageGuardEvaluation<'address'>> | undefined;
	const deferred = await catchUnknownSigner(env)(async () => {
		upgrade = await execute(env)(proxyAdmin, {
			account: 'safe',
			functionName: 'upgradeAndCall',
			args: [proxy.address, implementation.address, '0x'],
			// The guard reads a DIFFERENT contract from the one being called, which is the
			//  common case rather than the exception: the transaction goes to the admin, the
			//  effect lands in the proxy's implementation slot. `as: 'address'` is what decodes
			//  the word AND supplies the comparison rule an ABI would otherwise have supplied,
			//  which is why a lowercase word matches a checksummed expectation.
			guard: {
				kind: 'storage',
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				as: 'address',
				equals: implementation.address,
			},
		});
	});

	return {implementation: implementation.address, upgrade, deferred};
}

// ============================================================================
// Harness
// ============================================================================

const ZERO_WORD = `0x${'0'.repeat(64)}` as `0x${string}`;

/**
 * The contract storage the mock provider serves through `eth_getStorageAt`, keyed by
 * ADDRESS and SLOT because the guard deliberately reads a contract other than the one it
 * executes against.
 *
 * The mock executes nothing, so the test writes the slots: once to describe the world as it
 * stands before the upgrade, and once more to stand in for the Safe having executed the
 * deferred transaction.
 */
function createStorage() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		/** Write an ADDRESS-valued slot (left-padded to 32 bytes, as the EVM stores it). */
		setAddress(address: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
		},
		respondToGetStorageAt(params?: unknown[]) {
			const [address, slot] = params as [string, string];
			return slots.get(keyOf(address, slot)) ?? ZERO_WORD;
		},
	};
}

/**
 * A run in which `safe` is UNSIGNABLE: a named account declared as a bare address, absent
 * from the node's accounts, with auto-impersonation off. That is the entire configuration
 * this path needs, and it is how you rehearse a Safe-governed script on a fork.
 *
 * Pass the same `deploymentStore` and the same `storage` twice to model RE-RUNNING the
 * script: the second environment reloads the records the first one saved and reads the same
 * chain, exactly as a real second run does.
 */
async function runEnvironment(options: {
	deploymentStore: DeploymentStore;
	storage: ReturnType<typeof createStorage>;
	autoImpersonate?: boolean;
}) {
	const result = await createTestEnvironment({
		accounts: {deployer: DEPLOYER, safe: SAFE},
		nodeAccounts: [DEPLOYER],
		executionParams: {autoImpersonate: options.autoImpersonate ?? false},
		deploymentStore: options.deploymentStore,
		providerConfig: {
			responses: {eth_getStorageAt: (params?: unknown[]) => options.storage.respondToGetStorageAt(params)},
		},
	});
	// What the executor does at the start of EVERY run: read back the deployment records
	//  this environment already has.
	await result.internal.loadDeployments();
	return result;
}

/**
 * Two versions of the same contract.
 *
 * `deploy` is idempotent on DEPLOYED bytecode (minus the CBOR metadata whose byte length is
 * in its last two bytes), so v2 has to differ there or it would count as already deployed
 * and no upgrade would ever be needed. Layout: `<code><marker><2-byte blob><2-byte length>`,
 * the marker sitting AHEAD of the metadata so stripping cannot remove it.
 */
function vaultArtifact(version: 1 | 2): Artifact<typeof VAULT_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('Vault', VAULT_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

/**
 * The world as it stands BEFORE any of this: a Vault behind a transparent proxy, whose
 * ProxyAdmin is owned by the Safe, plus an ordinary Registry the deployer owns.
 *
 * Note who does what. The DEPLOYER deployed everything, because everything was signable
 * until governance took over; the SAFE owns the admin, which is why the upgrade is the one
 * step that is not ours to send.
 */
async function deployTheWorld() {
	const storage = createStorage();
	const deploymentStore = createMapDeploymentStore();
	const {env, provider} = await runEnvironment({deploymentStore, storage});

	const implementationV1 = await deploy(env)('Vault_Implementation', {
		account: 'deployer',
		artifact: vaultArtifact(1),
		args: [42n],
	});
	const proxy = await deploy(env)('Vault_Proxy', {
		account: 'deployer',
		artifact: createMockArtifact('Vault_Proxy', PROXY_ABI),
		args: [],
	});
	await deploy(env)('Vault_ProxyAdmin', {
		account: 'deployer',
		artifact: createMockArtifact('Vault_ProxyAdmin', PROXY_ADMIN_ABI),
		args: [],
	});
	await deploy(env)('Registry', {
		account: 'deployer',
		artifact: createMockArtifact('Registry', REGISTRY_ABI),
		args: [],
	});

	// the mock provider executes nothing, so mirror what the proxy's own storage holds
	storage.setAddress(proxy.address, EIP1967_IMPLEMENTATION_SLOT, implementationV1.address);
	provider.clearRequests();

	return {env, provider, storage, deploymentStore, proxy};
}

/** The transaction the Safe operator has to execute: `proxyAdmin.upgradeAndCall(proxy, impl, '0x')`. */
function upgradeCalldata(proxy: `0x${string}`, implementation: `0x${string}`): `0x${string}` {
	return encodeFunctionData({
		abi: PROXY_ADMIN_ABI,
		functionName: 'upgradeAndCall',
		args: [proxy, implementation, '0x'],
	});
}

/** Capture what the run printed to the user, so a test can read (or fail to find) the deferred block. */
function capturePrinted(env: Environment): {printed: () => string} {
	const messages: string[] = [];
	vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
		messages.push(message);
	});
	return {printed: () => messages.join('\n')};
}

type RecordedRequest = {method: string; params?: unknown[]};

/** Every `eth_sendTransaction` the run broadcast, as `from` addresses. */
function broadcastFrom(provider: {getRequests: () => RecordedRequest[]}): string[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => ((r.params?.[0] as {from: string}).from ?? '').toLowerCase());
}

/** Every `eth_getStorageAt` the run made, as `[address, slot]` pairs. */
function storageReads(provider: {getRequests: () => RecordedRequest[]}): [string, string][] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_getStorageAt')
		.map((r) => [(r.params as [string, string])[0].toLowerCase(), (r.params as [string, string])[1]]);
}

/** Whether the run mentioned an address ANYWHERE in what it sent to the node. */
function everMentioned(provider: {getRequests: () => RecordedRequest[]}, address: `0x${string}`): boolean {
	return provider.getRequests().some((r) =>
		JSON.stringify(r.params ?? [])
			.toLowerCase()
			.includes(address.toLowerCase().slice(2)),
	);
}

/** Everything the deployment store holds, name and CONTENT, to prove what a run wrote. */
async function storedRecords(store: DeploymentStore, env: Environment): Promise<Record<string, string>> {
	const names = (await store.listFiles('deployments', env.name)).sort();
	const records: Record<string, string> = {};
	for (const name of names) {
		records[name] = await store.readFile('deployments', env.name, name);
	}
	return records;
}

// ============================================================================
// The loop
// ============================================================================

describe('@rocketh/unknown-signer - a guarded Safe upgrade: defer, execute out of band, re-run', () => {
	it('RUN 1 defers the upgrade and hands the operator the exact transaction to execute', async () => {
		/**
		 * Run 1. The chain does not yet satisfy the guard (the proxy still points at v1), so
		 * the step is still needed: rocketh builds the transaction, hits the unknown-signer
		 * seam because the Safe cannot sign, and defers.
		 *
		 * What comes back is v1's shape exactly, `{from, to, value, data}`, and what is printed
		 * is what a Safe operator acts on. Nothing about the guard changes this half: an
		 * UNSATISFIED guard on an unsignable account defers precisely as it did before guards
		 * existed.
		 */
		const {env, provider, proxy} = await deployTheWorld();
		const {printed} = capturePrinted(env);

		const run1 = await upgradeTheVault(env);

		expect(run1.deferred).toStrictEqual({
			from: SAFE,
			to: env.get('Vault_ProxyAdmin').address,
			value: undefined,
			data: upgradeCalldata(proxy.address, run1.implementation),
		});
		// the guarded call never returned: the seam unwound it, so there is no result to read
		expect(run1.upgrade).toBeUndefined();

		// what the operator reads before opening their Safe
		expect(printed()).toContain(`from: ${SAFE}`);
		expect(printed()).toContain('method: upgradeAndCall');
		expect(printed()).toContain(run1.implementation);

		// the guard DID read the chain, on the proxy, and the Safe's transaction never went out
		expect(storageReads(provider)).toContainEqual([proxy.address.toLowerCase(), EIP1967_IMPLEMENTATION_SLOT]);
		expect(broadcastFrom(provider)).not.toContain(SAFE.toLowerCase());
	});

	it('RUN 2, after the Safe executed it, SKIPS the step and completes', async () => {
		/**
		 * THE HEADLINE. Between the runs the operator executed the printed transaction on
		 * their Safe, with no rocketh involvement whatsoever. That is modelled here by moving
		 * the proxy's implementation slot, which is all that transaction does.
		 *
		 * Run 2 then runs the SAME script, unedited. The guard reads the new state, is
		 * satisfied, and the step is skipped: no transaction is built, the unknown-signer seam
		 * is never consulted, and `catchUnknownSigner` returns `null` because there was
		 * nothing left to catch. The operator is NOT handed the privileged transaction a
		 * second time, and the run completes rather than aborting.
		 *
		 * Read the request log for the guarded step and there is exactly one thing in it: the
		 * guard's own declared read. Nothing was sent, and the Safe is not so much as named in
		 * anything run 2 said to the node.
		 *
		 * BE PRECISE ABOUT WHAT THAT LOG CAN SHOW, because it is a fact worth knowing: a
		 * deferral costs NO RPC. The seam throws before the transaction ever leaves rocketh, so
		 * run 1's log for this step is the same single read as run 2's. What separates them in
		 * the log is what was SENT (nothing, in both cases, from the Safe) and what came back
		 * to the operator (a transaction, then none). The request-log proof that run 2 never got
		 * as far as BUILDING the transaction is the sibling test at the bottom of this file,
		 * which runs the same guarded call with the Safe made signable: satisfied, it still
		 * sends nothing; unsatisfied, it sends.
		 */
		const {env, storage, deploymentStore, proxy} = await deployTheWorld();

		// ---- run 1: still needed, so it is deferred ---------------------------------------
		const run1 = await upgradeTheVault(env);
		expect(run1.deferred?.data).toBe(upgradeCalldata(proxy.address, run1.implementation));

		// ---- the Safe executes it, out of band, in its own time ----------------------------
		storage.setAddress(proxy.address, EIP1967_IMPLEMENTATION_SLOT, run1.implementation);

		// ---- run 2: the same script, a fresh run ------------------------------------------
		const {env: reRunEnv, provider: reRunProvider} = await runEnvironment({deploymentStore, storage});
		const {printed} = capturePrinted(reRunEnv);
		reRunProvider.clearRequests();

		const run2 = await upgradeTheVault(reRunEnv);

		// the step was not needed, and the evaluation is the only evidence of why nothing happened
		expect(run2.upgrade?.outcome).toBe('skipped');
		expect(run2.upgrade?.evaluation).toEqual({
			kind: 'storage',
			target: proxy.address,
			slot: EIP1967_IMPLEMENTATION_SLOT,
			word: `0x${run1.implementation.slice(2).toLowerCase().padStart(64, '0')}`,
			as: 'address',
			// the word holds the address LOWERCASED, as the EVM stores it, and the declared
			//  interpretation is what both checksums the decoded value and folds case when
			//  comparing it: `value` and `expected` here differ in spelling and still match
			value: getAddress(run1.implementation),
			expected: run1.implementation,
			satisfied: true,
		});

		// the operator is not handed the same privileged transaction again, and is not told to
		//  execute anything at all
		expect(run2.deferred).toBeNull();
		expect(printed()).not.toContain('Please execute the following transaction');

		// FROM THE REQUEST LOG, not from the return value: the only thing run 2 asked the
		//  chain about this step is the guard's declared read, nothing was sent from the Safe,
		//  and the Safe is not named in any request the run made
		expect(storageReads(reRunProvider)).toEqual([[proxy.address.toLowerCase(), EIP1967_IMPLEMENTATION_SLOT]]);
		expect(broadcastFrom(reRunProvider)).not.toContain(SAFE.toLowerCase());
		expect(everMentioned(reRunProvider, SAFE)).toBe(false);

		// and the run COMPLETED: the implementation is the same one run 1 deployed
		expect(run2.implementation).toBe(run1.implementation);
	});

	it('defers AGAIN when the Safe has not acted, which is what makes the skip earned', async () => {
		/**
		 * The negative control, and the proof that the skip above is chain-derived rather than
		 * remembered. Re-run without touching the chain and the upgrade is still outstanding,
		 * so the identical transaction is surfaced a second time. Nothing rocketh wrote down
		 * could have told it either way: under a deferral it observed nothing, so it may
		 * assert nothing (ADR 0012).
		 */
		const {env, storage, deploymentStore} = await deployTheWorld();

		const run1 = await upgradeTheVault(env);

		const {env: reRunEnv} = await runEnvironment({deploymentStore, storage});
		const run2 = await upgradeTheVault(reRunEnv);

		expect(run2.deferred).toStrictEqual(run1.deferred);
		expect(run2.upgrade).toBeUndefined();
	});

	it('MIXES signable and Safe-only steps: the signable ones broadcast on both runs', async () => {
		/**
		 * The realistic shape of a deploy script: most steps are yours, one belongs to
		 * governance. The unguarded `setTreasury` the deployer sends broadcasts on EVERY run,
		 * before and after the Safe acted, exactly as it would in a script with no Safe in it.
		 * Only the guarded, unsignable step changes behaviour, and only because the chain did.
		 *
		 * (An unguarded call re-sending on every run is the gap the guard closes. It is
		 * harmless for an idempotent setter and expensive for anything else, which is the
		 * argument for guarding the calls that matter.)
		 */
		const {env, provider, storage, deploymentStore, proxy} = await deployTheWorld();

		const run1 = await upgradeTheVault(env);
		// run 1 broadcast the deployer's two steps (the v2 implementation and the treasury
		//  call) and nothing from the Safe
		expect(broadcastFrom(provider)).toEqual([DEPLOYER, DEPLOYER]);
		expect(run1.deferred?.from).toBe(SAFE);

		storage.setAddress(proxy.address, EIP1967_IMPLEMENTATION_SLOT, run1.implementation);

		const {env: reRunEnv, provider: reRunProvider} = await runEnvironment({deploymentStore, storage});
		reRunProvider.clearRequests();
		const run2 = await upgradeTheVault(reRunEnv);

		// run 2 still sends the treasury call (unguarded, so still needed as far as anyone
		//  knows) while the v2 implementation is not redeployed and the Safe's step is skipped
		expect(broadcastFrom(reRunProvider)).toEqual([DEPLOYER]);
		expect(run2.upgrade?.outcome).toBe('skipped');
		expect(run2.deferred).toBeNull();
	});

	it('persists NOTHING: no file appears, and the deployment records are unchanged', async () => {
		/**
		 * The invariant the whole loop rests on, and the one a test that only checked the skip
		 * would miss. The guard writes nothing: no marker, no "executed calls" file, no batch.
		 * Idempotency here is chain-derived, and a test that would still pass if a state file
		 * appeared is not testing the guarantee.
		 *
		 * The files the store holds are the deployment records that would exist anyway, and
		 * run 2 neither adds one nor alters one: it deployed nothing and skipped the only
		 * remaining step.
		 */
		const {env, storage, deploymentStore, proxy} = await deployTheWorld();

		const run1 = await upgradeTheVault(env);
		const afterRun1 = await storedRecords(deploymentStore, env);

		expect(Object.keys(afterRun1)).toEqual([
			'.chain',
			'Registry.json',
			'Vault_Implementation.json',
			'Vault_Proxy.json',
			'Vault_ProxyAdmin.json',
		]);
		// nothing describes the transaction the Safe still has to execute, nor the guard
		expect(
			Object.keys(afterRun1).some((name) => /unsigned|to-?execute|deferred|pending|guard|executed/i.test(name)),
		).toBe(false);

		storage.setAddress(proxy.address, EIP1967_IMPLEMENTATION_SLOT, run1.implementation);

		const {env: reRunEnv} = await runEnvironment({deploymentStore, storage});
		await upgradeTheVault(reRunEnv);

		// byte-for-byte the same records: the convergence cost the store nothing
		expect(await storedRecords(deploymentStore, reRunEnv)).toEqual(afterRun1);
	});
});

// ============================================================================
// Why the skip is a SKIP, and not a quiet failure to sign
// ============================================================================

describe('@rocketh/unknown-signer - the guard and the seam stay orthogonal', () => {
	it('does not build the transaction at all, even when the Safe IS signable', async () => {
		/**
		 * "Is this needed" and "can we sign it" are separate questions, answered in that order
		 * (ADR 0013, ADR 0006). This test removes the seam from the picture entirely by turning
		 * auto-impersonation ON, which makes the node take the Safe on and the account
		 * signable: nothing would stop a needed call from broadcasting.
		 *
		 * With the guard satisfied, still nothing is sent. That is the request-log proof that
		 * the skip happens BEFORE the transaction is built, rather than being an unsignable
		 * `from` failing quietly somewhere further down. The same run with the guard
		 * unsatisfied broadcasts from the Safe, which is the control that makes the absence
		 * above mean something.
		 */
		const storage = createStorage();
		const deploymentStore = createMapDeploymentStore();
		const {env, provider} = await runEnvironment({deploymentStore, storage, autoImpersonate: true});
		expect(env.addressSignability[SAFE]).toBe('impersonated');

		const proxyAdmin = await deploy(env)('Vault_ProxyAdmin', {
			account: 'deployer',
			artifact: createMockArtifact('Vault_ProxyAdmin', PROXY_ADMIN_ABI),
			args: [],
		});
		const proxy = await deploy(env)('Vault_Proxy', {
			account: 'deployer',
			artifact: createMockArtifact('Vault_Proxy', PROXY_ABI),
			args: [],
		});
		const nextImplementation = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;
		const upgrade = () =>
			execute(env)(proxyAdmin, {
				account: 'safe',
				functionName: 'upgradeAndCall',
				args: [proxy.address, nextImplementation, '0x'],
				guard: {
					kind: 'storage' as const,
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address' as const,
					equals: nextImplementation,
				},
			});

		// SATISFIED: nothing is sent, although the Safe could have signed
		storage.setAddress(proxy.address, EIP1967_IMPLEMENTATION_SLOT, nextImplementation);
		provider.clearRequests();
		expect((await upgrade()).outcome).toBe('skipped');
		expect(broadcastFrom(provider)).toEqual([]);

		// UNSATISFIED: the very same call goes out, which is what proves the absence above
		storage.setAddress(proxy.address, EIP1967_IMPLEMENTATION_SLOT, ('0x' + 'ee'.repeat(20)) as `0x${string}`);
		provider.clearRequests();
		expect((await upgrade()).outcome).toBe('sent');
		expect(broadcastFrom(provider)).toEqual([SAFE.toLowerCase()]);
	});
});
