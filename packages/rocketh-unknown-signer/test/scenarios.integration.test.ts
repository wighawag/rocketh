/**
 * `@rocketh/unknown-signer`: the headline scenarios, written as deploy scripts.
 *
 * This file is the documentation a hardhat-deploy v1 user reads to see how to port a
 * script whose privileged calls are governed by a Safe. Each test body is shaped like
 * a real deploy script: deploy what you can sign for, wrap what you cannot, read the
 * transaction you have to execute out-of-band, carry on.
 *
 * WHAT "the Safe" MEANS HERE. There is no Safe-specific code in rocketh (there was
 * none in v1 either). A Safe is simply an address that is UNSIGNABLE for the run: no
 * local signing material, not listed by the node in `eth_accounts`, and not
 * impersonated. Every scenario below builds that with a named account declared as a
 * bare address plus `autoImpersonate: false`, which is the supported way to exercise
 * this path on a fork or a dev node (ADR 0006). `catchUnknownSigner` deliberately does
 * NOT override impersonation.
 *
 * THE LOOP THESE TESTS PROVE, end to end: run the script → the unsignable call is
 * caught and printed instead of broadcast → the run continues → you execute that
 * transaction on your Safe → you re-run the same script → its own on-chain state check
 * sees the change and skips the step. NOTHING IS PERSISTED between the two runs: there
 * is no unsigned-transactions file, and the tests below assert that none appears.
 *
 * The environment is the real one (`createTestEnvironment` builds it through
 * `createEnvironment`, so account resolution, signability and the single
 * `broadcastTransaction` choke point are production code) wired to a mock provider.
 * The mock is NOT an EVM: it answers RPCs rather than executing them, so where a
 * scenario depends on contract storage the test writes that storage by hand. Moving a
 * storage slot is exactly how "the Safe executed the transaction" is simulated.
 */

import {describe, it, expect, vi} from 'vitest';
import {encodeFunctionData} from 'viem';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';
import {UnknownSignerError} from '@rocketh/core';
import {createMockArtifact, createTestEnvironment, createMapDeploymentStore} from '@rocketh/test-utils';
import {deploy} from '@rocketh/deploy';
import {deployViaProxy} from '@rocketh/proxy';
import {execute, tx} from '@rocketh/read-execute';

import {catchUnknownSigner} from '../src/index.js';

// ============================================================================
// The cast
// ============================================================================

/** The key we hold: the node lists it in `eth_accounts`, so it is signable. */
const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** The Safe: a named account with no signer material that the node does not hold. */
const SAFE = '0x1111111111111111111111111111111111111111' as `0x${string}`;

/** ERC1967 implementation slot, the one `@rocketh/proxy` reads to decide on an upgrade. */
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
/** ERC173 owner slot: who is allowed to call `upgradeTo` on the proxy. */
const OWNER_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

const ZERO_SLOT = `0x${'0'.repeat(64)}` as `0x${string}`;

/** The one function of the proxy a Safe operator has to run, for encoding expectations. */
const UPGRADE_TO_ABI = [
	{
		type: 'function',
		name: 'upgradeTo',
		inputs: [{type: 'address', name: 'newImplementation'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const VAULT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

const REGISTRY_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'setTreasury',
		inputs: [{type: 'address', name: 'treasury'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

// ============================================================================
// Harness
// ============================================================================

/**
 * The contract storage the mock provider serves through `eth_getStorageAt`.
 *
 * `@rocketh/proxy` decides whether an upgrade is needed by reading the proxy's
 * implementation slot, and decides who must send it by reading the owner slot. The
 * mock executes nothing, so the test writes those slots itself: once after the initial
 * deployment (mirroring what the proxy constructor would have written), and once more
 * to stand in for the Safe having executed the deferred upgrade.
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
			return slots.get(keyOf(address, slot)) ?? ZERO_SLOT;
		},
	};
}

/**
 * A run in which `safe` is unsignable: it is a named account declared as a bare
 * address, the node does not list it in `eth_accounts`, and auto-impersonation is off.
 * This is the whole configuration the feature needs (story 8 of the spec).
 *
 * Pass the same `deploymentStore` twice to model RE-RUNNING a script: the second
 * environment reloads the deployments the first one saved, exactly as a real second
 * run reloads them from disk.
 */
async function runEnvironment(options?: {
	deploymentStore?: DeploymentStore;
	storage?: ReturnType<typeof createStorage>;
	autoImpersonate?: boolean;
}) {
	const result = await createTestEnvironment({
		accounts: {deployer: DEPLOYER, safe: SAFE},
		nodeAccounts: [DEPLOYER],
		executionParams: {autoImpersonate: options?.autoImpersonate ?? false},
		deploymentStore: options?.deploymentStore,
		providerConfig: options?.storage
			? {responses: {eth_getStorageAt: (params?: unknown[]) => options.storage!.respondToGetStorageAt(params)}}
			: undefined,
	});
	// What rocketh's executor does at the start of EVERY run: read back the deployment
	//  records this environment already has. It is what makes a second run recognise what
	//  the first one deployed, so a test that models a re-run has to do it too.
	await result.internal.loadDeployments();
	return result;
}

/**
 * Two versions of the same contract.
 *
 * `deploy` is idempotent on DEPLOYED bytecode (minus the CBOR metadata whose byte
 * length is in its last two bytes), so v2 has to differ there or the implementation
 * would be considered already deployed and no upgrade would ever be attempted. A real
 * v2 differs; a second `createMockArtifact` call would not, since it returns the same
 * bytes every time.
 */
function vaultArtifact(version: 1 | 2): Artifact<typeof VAULT_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('Vault', VAULT_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		// trailing `0002` = "the last 2 bytes are CBOR metadata"
		deployedBytecode: `0x6080604052${marker}0002` as `0x${string}`,
	};
}

/** Collect everything the deployment store holds, to prove what a run did and did not write. */
async function storedFiles(store: DeploymentStore, env: Environment): Promise<string[]> {
	return (await store.listFiles('deployments', env.name)).sort();
}

/** Capture what the run printed to the user, so a test can read the deferred-tx block. */
function capturePrinted(env: Environment): {printed: () => string} {
	const messages: string[] = [];
	vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
		messages.push(message);
	});
	return {printed: () => messages.join('\n')};
}

/** Every `eth_sendTransaction` the run broadcast, as `from` addresses. */
function broadcastFrom(provider: {getRequests: () => {method: string; params?: unknown[]}[]}): string[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => ((r.params?.[0] as {from: string}).from ?? '').toLowerCase());
}

// ============================================================================
// Story 1: the headline, a proxy whose owner is a Safe
// ============================================================================

/**
 * Set up the world the upgrade scenarios start from: `Vault` deployed behind an ERC173
 * proxy owned by the Safe, with the proxy's storage reflecting that.
 *
 * Note who does what: the DEPLOYER deploys (it can sign), and the SAFE owns. That
 * split is the whole point: everything is signable until governance is involved.
 */
async function deployVaultOwnedBySafe() {
	const storage = createStorage();
	const deploymentStore = createMapDeploymentStore();
	const {env, provider} = await runEnvironment({deploymentStore, storage});

	const vault = await deployViaProxy(env)(
		'Vault',
		{account: 'deployer', artifact: vaultArtifact(1), args: [42n]},
		{owner: SAFE},
	);

	// the mock provider executes nothing, so mirror what the proxy constructor wrote
	const implementation = env.get('Vault_Implementation').address;
	storage.setAddress(vault.address, IMPLEMENTATION_SLOT, implementation);
	storage.setAddress(vault.address, OWNER_SLOT, SAFE);

	return {env, provider, storage, deploymentStore, vault, implementation};
}

describe('@rocketh/unknown-signer - Story 1: upgrading a proxy owned by a Safe', () => {
	it('surfaces the upgrade transaction for the Safe instead of failing', async () => {
		/**
		 * Example: your `Vault` sits behind a proxy owned by a Safe. You ship v2 of the
		 * implementation, which you CAN sign for, and then the proxy has to be pointed at
		 * it, which you CANNOT: only the Safe may call `upgradeTo`.
		 *
		 * Wrapping the upgrade in `catchUnknownSigner` turns "the run dies" into "here is
		 * the transaction to execute on the Safe". Note the call shape: the action is a
		 * FUNCTION, `() => ...`, never an already-started promise. That is the one
		 * mechanical change when porting a v1 script.
		 */
		const {env, vault} = await deployVaultOwnedBySafe();

		const deferred = await catchUnknownSigner(env)(() =>
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
		);

		// v2 of the implementation WAS deployed (the deployer can sign for that)...
		const newImplementation = env.get('Vault_Implementation').address;
		// ...and what is left for the Safe is exactly `proxy.upgradeTo(newImplementation)`
		expect(deferred).toStrictEqual({
			from: SAFE,
			to: vault.address,
			value: undefined,
			data: encodeFunctionData({abi: UPGRADE_TO_ABI, functionName: 'upgradeTo', args: [newImplementation]}),
		});
	});

	it('prints the transaction in a form a Safe operator can act on', async () => {
		/**
		 * What you read in the terminal before opening your Safe: who must send it, what
		 * to call, and with which arguments.
		 */
		const {env, vault} = await deployVaultOwnedBySafe();
		const {printed} = capturePrinted(env);

		await catchUnknownSigner(env)(() =>
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
		);

		const newImplementation = env.get('Vault_Implementation').address;
		expect(printed()).toContain(`from: ${SAFE}`);
		expect(printed()).toContain(`to: ${vault.address}`);
		expect(printed()).toContain('method: upgradeTo');
		expect(printed()).toContain(newImplementation);
	});

	it('lets the rest of the deploy script run', async () => {
		/**
		 * The point of wrapping: the deferred step does not halt the run, so the steps
		 * after it (the ones that do not depend on the upgrade) still happen.
		 */
		const {env} = await deployVaultOwnedBySafe();

		const deferred = await catchUnknownSigner(env)(() =>
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
		);

		// the script carries on, exactly as it would have if nothing had been deferred
		const registry = await deploy(env)('Registry', {
			account: 'deployer',
			artifact: createMockArtifact('Registry', REGISTRY_ABI),
			args: [1n],
		});

		expect(deferred).not.toBeNull();
		expect(registry.newlyDeployed).toBe(true);
		expect(env.get('Registry').address).toBe(registry.address);
	});

	it('leaves the proxy pointing at the old implementation until the Safe acts', async () => {
		/**
		 * Deferring is not doing. The saved `Vault` record still describes the deployment
		 * as it stands on-chain, and no transaction was ever sent from the Safe.
		 */
		const {env, provider, vault, implementation} = await deployVaultOwnedBySafe();
		provider.clearRequests();

		await catchUnknownSigner(env)(() =>
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
		);

		expect(env.get('Vault').address).toBe(vault.address);
		expect(broadcastFrom(provider)).not.toContain(SAFE);
		expect(env.get('Vault_Implementation').address).not.toBe(implementation);
	});
});

// ============================================================================
// Story 5: the mechanism is transaction-agnostic
// ============================================================================

describe('@rocketh/unknown-signer - Story 5: any transaction from the Safe, not just upgrades', () => {
	/**
	 * Everything a deploy script can send funnels through ONE choke point
	 * (`broadcastTransaction`), which is where the unsignable-`from` seam lives. So the
	 * same wrapper catches a plain `tx`, a deploy, an `execute` and a value transfer,
	 * and each returns the transaction the Safe has to run. Four shapes, one seam.
	 */
	it('catches a plain tx() sent from the Safe', async () => {
		const {env} = await runEnvironment();

		const deferred = await catchUnknownSigner(env)(() => tx(env)({account: 'safe', to: DEPLOYER, data: '0xdeadbeef'}));

		expect(deferred).toStrictEqual({from: SAFE, to: DEPLOYER, value: undefined, data: '0xdeadbeef'});
	});

	it('catches a deploy whose deployer is the Safe', async () => {
		/**
		 * A contract deploy has no `to`: the transaction to execute on the Safe is a
		 * plain contract-creation with the init code as its data.
		 */
		const {env} = await runEnvironment();
		const artifact = createMockArtifact('Treasury');

		const deferred = await catchUnknownSigner(env)(() =>
			deploy(env)('Treasury', {account: 'safe', artifact, args: [42n]}),
		);

		expect(deferred?.from).toBe(SAFE);
		expect(deferred?.to).toBeUndefined();
		expect(deferred?.data?.startsWith(artifact.bytecode)).toBe(true);
		// nothing was recorded: the contract does not exist until the Safe deploys it
		expect(env.getOrNull('Treasury')).toBeNull();
	});

	it('catches an execute() from the Safe, and names the call in the printed block', async () => {
		/**
		 * The `execute` path is the one that can say more than an address: the seam
		 * enriches the error with the contract, the method and the arguments, so the
		 * printed block tells the Safe operator what they are actually approving.
		 *
		 * That enrichment is for the HUMAN. It never appears on the returned object,
		 * which stays exactly v1's `{from, to, value, data}` so a migrated script that
		 * compares or forwards it needs no change.
		 */
		const {env} = await runEnvironment();
		const registry = await deploy(env)('Registry', {
			account: 'deployer',
			artifact: createMockArtifact('Registry', REGISTRY_ABI),
			args: [1n],
		});
		const {printed} = capturePrinted(env);

		const deferred = await catchUnknownSigner(env)(() =>
			execute(env)(registry, {account: 'safe', functionName: 'setTreasury', args: [DEPLOYER]}),
		);

		expect(printed()).toContain(`to: ${registry.address} (Registry)`);
		expect(printed()).toContain('method: setTreasury');
		expect(printed()).toContain(DEPLOYER);

		expect(deferred).toStrictEqual({
			from: SAFE,
			to: registry.address,
			value: undefined,
			data: encodeFunctionData({abi: REGISTRY_ABI, functionName: 'setTreasury', args: [DEPLOYER]}),
		});
		expect(deferred).not.toHaveProperty('contract');
	});

	it('catches a value transfer from the Safe', async () => {
		/**
		 * Moving funds the Safe holds is the same story: you get back the transfer to
		 * execute, `value` included (as a string, as v1 returned it).
		 */
		const {env} = await runEnvironment();

		const deferred = await catchUnknownSigner(env)(() => tx(env)({account: 'safe', to: DEPLOYER, value: 10n ** 18n}));

		expect(deferred).toStrictEqual({
			from: SAFE,
			to: DEPLOYER,
			value: '0xde0b6b3a7640000',
			data: undefined,
		});
	});
});

// ============================================================================
// Story 6: a mixed run
// ============================================================================

describe('@rocketh/unknown-signer - Story 6: a run that mixes signable and Safe-only steps', () => {
	it('broadcasts what the deployer can sign and defers only the Safe call', async () => {
		/**
		 * The realistic shape of a deploy script: most steps are yours, a couple belong to
		 * governance. Wrapping the governance step changes nothing about the others:
		 * the frame `catchUnknownSigner` pushes forces a THROW over an interactive prompt,
		 * never over signability (ADR 0006).
		 */
		const {env, provider} = await runEnvironment();

		// a step you can sign for: broadcast, mined, saved
		const registry = await deploy(env)('Registry', {
			account: 'deployer',
			artifact: createMockArtifact('Registry', REGISTRY_ABI),
			args: [1n],
		});

		// a step only the Safe can send: caught, printed, deferred
		const deferred = await catchUnknownSigner(env)(() =>
			execute(env)(registry, {account: 'safe', functionName: 'setTreasury', args: [DEPLOYER]}),
		);

		expect(registry.newlyDeployed).toBe(true);
		expect(registry.transaction?.hash).toBeDefined();
		expect(env.get('Registry').address).toBe(registry.address);

		expect(deferred?.from).toBe(SAFE);
		// the deployer's transaction went out; the Safe's never did
		expect(broadcastFrom(provider)).toEqual([DEPLOYER]);
	});

	it('keeps broadcasting signable steps INSIDE the wrapper, up to the deferred one', async () => {
		/**
		 * A single wrapper can hold several steps. Everything before the unsignable one
		 * broadcasts normally; the unsignable one unwinds the wrapped action, so anything
		 * after it in the SAME wrapper is skipped. Defer several steps independently by
		 * wrapping them separately.
		 */
		const {env, provider} = await runEnvironment();
		const done: string[] = [];

		const deferred = await catchUnknownSigner(env)(async () => {
			const registry = await deploy(env)('Registry', {
				account: 'deployer',
				artifact: createMockArtifact('Registry', REGISTRY_ABI),
				args: [1n],
			});
			done.push('deployed Registry');
			await execute(env)(registry, {account: 'safe', functionName: 'setTreasury', args: [DEPLOYER]});
			done.push('never reached');
		});

		expect(done).toEqual(['deployed Registry']);
		expect(deferred?.from).toBe(SAFE);
		expect(broadcastFrom(provider)).toEqual([DEPLOYER]);
	});
});

// ============================================================================
// Story 7: do governance later, then re-run
// ============================================================================

describe('@rocketh/unknown-signer - Story 7: execute on the Safe, then re-run the script', () => {
	it('skips the deferred upgrade on the second run and returns null', async () => {
		/**
		 * The full loop, which is the reason this feature exists.
		 *
		 * Run 1: the upgrade cannot be signed, so it is printed and deferred. You take
		 * that transaction to your Safe and execute it, modelled here by moving the
		 * proxy's implementation slot, since that is all the Safe's transaction would do.
		 * Run 2: the SAME script, in a fresh environment reloading the same deployment
		 * records, notices the proxy already points at v2 and skips the upgrade entirely.
		 * `catchUnknownSigner` returns `null`, because there was nothing left to catch.
		 *
		 * The idempotency comes from ON-CHAIN STATE, not from anything rocketh wrote
		 * down: see the sibling test for the assertion that nothing was persisted.
		 */
		const {env, storage, deploymentStore, vault} = await deployVaultOwnedBySafe();

		// ---- run 1 ------------------------------------------------------------
		const upgradeScript = (env: Environment) =>
			catchUnknownSigner(env)(() =>
				deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
			);

		const deferred = await upgradeScript(env);
		const newImplementation = env.get('Vault_Implementation').address;
		expect(deferred?.data).toBe(
			encodeFunctionData({abi: UPGRADE_TO_ABI, functionName: 'upgradeTo', args: [newImplementation]}),
		);

		// ---- the Safe executes it, out of band, in its own time ---------------
		storage.setAddress(vault.address, IMPLEMENTATION_SLOT, newImplementation);

		// ---- run 2: same script, fresh run ------------------------------------
		const {env: reRunEnv, provider: reRunProvider} = await runEnvironment({deploymentStore, storage});

		const nothingLeft = await upgradeScript(reRunEnv);

		expect(nothingLeft).toBeNull();
		// the second run sent nothing at all: the implementation was already deployed and
		//  the proxy already points at it
		expect(broadcastFrom(reRunProvider)).toEqual([]);
		expect(reRunEnv.get('Vault').address).toBe(vault.address);
	});

	it('defers again if you re-run BEFORE the Safe executed it', async () => {
		/**
		 * The negative control, and the proof that the skip above is earned: re-run without
		 * touching the chain and the upgrade is still outstanding, so it is caught and
		 * printed again. Nothing rocketh wrote down could have told it either way.
		 */
		const {env, storage, deploymentStore} = await deployVaultOwnedBySafe();
		const upgradeScript = (env: Environment) =>
			catchUnknownSigner(env)(() =>
				deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
			);

		const firstRun = await upgradeScript(env);

		const {env: reRunEnv} = await runEnvironment({deploymentStore, storage});
		const secondRun = await upgradeScript(reRunEnv);

		expect(secondRun).toStrictEqual(firstRun);
	});

	it('persists no unsigned transaction between the two runs', async () => {
		/**
		 * EXACT v1 parity, and the invariant the whole loop rests on: `catchUnknownSigner`
		 * writes NOTHING. There is no unsigned-transactions file, no batch, no marker,
		 * so the only thing that can make the second run skip the step is the chain
		 * itself. The files the store holds after run 1 are the deployment records that
		 * would exist anyway, and run 2 adds none.
		 */
		const {env, storage, deploymentStore, vault} = await deployVaultOwnedBySafe();

		const filesBefore = await storedFiles(deploymentStore, env);

		await catchUnknownSigner(env)(() =>
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
		);

		const filesAfterRun1 = await storedFiles(deploymentStore, env);
		// Run 1 rewrote the implementation record (v2 really was deployed) and nothing else.
		//  No file describes the transaction the Safe still has to execute.
		expect(filesBefore).toEqual(['.chain', 'Vault.json', 'Vault_Implementation.json', 'Vault_Proxy.json']);
		expect(filesAfterRun1).toEqual(filesBefore);
		expect(filesAfterRun1.some((name) => /unsigned|to-?execute|deferred|pending/i.test(name))).toBe(false);

		storage.setAddress(vault.address, IMPLEMENTATION_SLOT, env.get('Vault_Implementation').address);
		const {env: reRunEnv} = await runEnvironment({deploymentStore, storage});
		await catchUnknownSigner(reRunEnv)(() =>
			deployViaProxy(reRunEnv)('Vault', {account: 'deployer', artifact: vaultArtifact(2), args: [42n]}, {owner: SAFE}),
		);

		expect(await storedFiles(deploymentStore, reRunEnv)).toEqual(filesAfterRun1);
	});
});

// ============================================================================
// Story 8: how to exercise this path yourself
// ============================================================================

describe('@rocketh/unknown-signer - Story 8: autoImpersonate false routes to the seam', () => {
	/**
	 * How to test your own Safe-governed script against a fork or a dev node: declare
	 * the Safe as a named account with no signer material and turn auto-impersonation
	 * OFF for the run. Without that, rocketh would impersonate the Safe and happily
	 * broadcast, which is what you want when developing, and exactly what you do not
	 * want when rehearsing the governance path.
	 *
	 * `catchUnknownSigner` does NOT override impersonation, deliberately (ADR 0006):
	 * the run-level flag is the supported switch.
	 */
	it('throws UnknownSignerError when the call is NOT wrapped', async () => {
		const {env} = await runEnvironment({autoImpersonate: false});

		const error = await tx(env)({account: 'safe', to: DEPLOYER, data: '0xdeadbeef'}).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect((error as UnknownSignerError).data.from).toBe(SAFE);
		// the message is the whole point: it is the transaction to execute, not an RPC failure
		expect((error as UnknownSignerError).message).toContain(SAFE);
	});

	it('returns the transaction when the same call IS wrapped', async () => {
		const {env} = await runEnvironment({autoImpersonate: false});

		const deferred = await catchUnknownSigner(env)(() => tx(env)({account: 'safe', to: DEPLOYER, data: '0xdeadbeef'}));

		expect(deferred).toStrictEqual({from: SAFE, to: DEPLOYER, value: undefined, data: '0xdeadbeef'});
	});

	it('is the account classification that decides, not the wrapper', async () => {
		/**
		 * The same account, the same script, with auto-impersonation left ON: the node
		 * takes the Safe on, the account is signable, and the call BROADCASTS from inside
		 * the wrapper. Nothing is caught and `null` comes back.
		 */
		const {env, provider} = await runEnvironment({autoImpersonate: true});
		expect(env.addressSignability[SAFE]).toBe('impersonated');

		const deferred = await catchUnknownSigner(env)(() => tx(env)({account: 'safe', to: DEPLOYER, data: '0xdeadbeef'}));

		expect(deferred).toBeNull();
		expect(broadcastFrom(provider)).toContain(SAFE);
	});
});
