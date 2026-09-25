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
import {decodeFunctionData, encodeFunctionData, encodeFunctionResult, zeroAddress} from 'viem';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';
import {UnknownSignerError} from '@rocketh/core';
import {createMockArtifact, createTestEnvironment, createMapDeploymentStore} from '@rocketh/test-utils';
import {deploy} from '@rocketh/deploy';
import {deployViaProxy, type ImplementationDeployer} from '@rocketh/proxy';
import {execute, read, tx} from '@rocketh/read-execute';

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
 * What an `Ownable` contract answers to `owner()`, served through `eth_call`.
 *
 * Needed where ownership lives in a contract's ordinary storage rather than in a proxy
 * slot: a shared `ProxyAdmin` is `Ownable`, and `@rocketh/proxy` asks it `owner()` to
 * learn who must send the upgrade. Same trick as `createStorage`: the mock executes
 * nothing, so the test answers the read itself. Any other call gets the harness's `0x`.
 *
 * Owners are keyed by DEPLOYMENT NAME, resolved against the run's environment when the
 * read arrives, because `@rocketh/proxy` deploys the admin and reads its owner within a
 * single call: there is no moment in between for the test to learn the new address and
 * mirror what the constructor wrote.
 */
function createOwners() {
	const OWNER_SELECTOR = '0x8da5cb5b';
	const owners = new Map<string, `0x${string}`>();
	return {
		setOwner(deploymentName: string, owner: `0x${string}`) {
			owners.set(deploymentName, owner);
		},
		respondToCall(params: unknown[] | undefined, env: Environment | undefined) {
			const [call] = params as [{to?: string; data?: string; input?: string}];
			const data = (call.data ?? call.input ?? '').toLowerCase();
			if (!env || !call.to || !data.startsWith(OWNER_SELECTOR)) return '0x';
			for (const [name, owner] of owners) {
				if (env.getOrNull(name)?.address.toLowerCase() === call.to.toLowerCase()) {
					return `0x${owner.slice(2).toLowerCase().padStart(64, '0')}`;
				}
			}
			return '0x';
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
	owners?: ReturnType<typeof createOwners>;
	registrar?: ReturnType<typeof createRegistrar>;
	autoImpersonate?: boolean;
}) {
	const responses: Record<string, (params?: unknown[]) => unknown> = {};
	let thisRun: Environment | undefined;
	if (options?.storage) {
		responses.eth_getStorageAt = (params?: unknown[]) => options.storage!.respondToGetStorageAt(params);
	}
	if (options?.owners || options?.registrar) {
		responses.eth_call = (params?: unknown[]) =>
			options.registrar?.respondToCall(params, thisRun) ?? options.owners?.respondToCall(params, thisRun) ?? '0x';
	}
	const result = await createTestEnvironment({
		accounts: {deployer: DEPLOYER, safe: SAFE},
		nodeAccounts: [DEPLOYER],
		executionParams: {autoImpersonate: options?.autoImpersonate ?? false},
		deploymentStore: options?.deploymentStore,
		providerConfig: Object.keys(responses).length > 0 ? {responses} : undefined,
	});
	thisRun = result.env;
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
		// The version MARKER has to sit in the CODE, ahead of the metadata, or the two
		//  versions are indistinguishable once the metadata is stripped and no upgrade is
		//  ever detected. Layout: <code><marker><2-byte blob><2-byte length of that blob>.
		//  The trailing `0002` declares the blob length EXCLUDING itself, exactly as solc
		//  writes it, so stripping removes `dead0002` and leaves the marker in place.
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
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
		 * THE UPGRADE's idempotency comes from ON-CHAIN STATE: nothing about the deferred
		 * transaction is persisted, and run 2 skips it because it reads the proxy's
		 * implementation slot (see the sibling test for the assertion that nothing was
		 * written). Be careful not to over-read that: the v2 IMPLEMENTATION deploy is
		 * skipped for a different reason, the ordinary deployment record, which run 2
		 * reloads and compares bytecode against. `deploy` does not re-check code on-chain
		 * on that path. So this loop is chain-driven exactly where it has to be — the part
		 * a human did out-of-band — and record-driven everywhere it always was.
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

// ============================================================================
// Matrix: many proxies, one multisig-owned ProxyAdmin
// ============================================================================

/**
 * THE TOPOLOGY. Several proxies (here three "markets" of the same `Registry`) are all
 * transparent proxies administered by ONE shared `ProxyAdmin`, and that admin is owned
 * by the multisig. So there is a single governance surface: one owner, one admin
 * contract, N upgrade calls. Only the multisig can call `ProxyAdmin.upgrade(proxy, impl)`,
 * and the run cannot sign for it (the same unsignable SAFE as every scenario above).
 *
 * THE DEFERRED SET TO EXPECT on an upgrade run: exactly N transactions, one per proxy, in
 * the order the script visits the proxies. Every one has the same `from` (the multisig)
 * and the same `to` (the shared admin, NOT the proxy: with a shared admin the proxy's
 * own `upgradeTo` is only callable by the admin contract). Their `data` differs only in
 * the proxy address, because the three markets share one implementation. They are
 * independent of each other, so the multisig may execute them in any order.
 */
const MARKETS = ['Alpha', 'Beta', 'Gamma'] as const;
const SHARED_ADMIN = 'SharedProxyAdmin';

/** The functions of `ProxyAdmin` the multisig has to call, for decoding the deferred set. */
const PROXY_ADMIN_ABI = [
	{
		type: 'function',
		name: 'upgrade',
		inputs: [
			{type: 'address', name: 'proxy'},
			{type: 'address', name: 'implementation'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/**
 * One implementation shared by every market, deployed once under its own name. The first
 * market to ask deploys it (or redeploys it when the code changed); the others find it
 * already deployed with the same bytecode and reuse it.
 */
function sharedRegistryImplementation(env: Environment, version: 1 | 2): ImplementationDeployer<typeof VAULT_ABI> {
	return (_name, args, options) =>
		deploy(env)('Registry_Implementation', {...args, artifact: vaultArtifact(version)}, options);
}

/** The deploy-script step for ONE market: deploy it, or upgrade it if the code changed. */
function deployMarket(env: Environment, market: (typeof MARKETS)[number], version: 1 | 2) {
	return deployViaProxy(env)(
		`Registry${market}`,
		{account: 'deployer', artifact: sharedRegistryImplementation(env, version), args: [42n]},
		{
			owner: SAFE,
			proxyContract: {type: 'SharedAdminOptimizedTransparentProxy', proxyAdminName: SHARED_ADMIN},
		},
	);
}

/**
 * The upgrade script, written the way it has to be: ONE `catchUnknownSigner` PER PROXY.
 * Each wrapper holds exactly one deferrable call, so each one yields its own deferral
 * and the loop visits every market.
 */
async function upgradeAllMarkets(env: Environment) {
	const deferred = [];
	for (const market of MARKETS) {
		deferred.push(await catchUnknownSigner(env)(() => deployMarket(env, market, 2)));
	}
	return deferred;
}

/**
 * The world the upgrade run starts from: three markets at v1, all behind the shared admin,
 * the admin owned by the multisig. The deployer does all of this (it can sign for
 * deployments); the multisig only ever appears as the admin's owner.
 */
async function deployMarketsBehindSharedAdmin() {
	const storage = createStorage();
	const owners = createOwners();
	const deploymentStore = createMapDeploymentStore();
	// what the admin's constructor (`ProxyAdmin(initialOwner)`) writes
	owners.setOwner(SHARED_ADMIN, SAFE);
	const {env, provider} = await runEnvironment({deploymentStore, storage, owners});

	const proxies: `0x${string}`[] = [];
	for (const market of MARKETS) {
		const registry = await deployMarket(env, market, 1);
		// the mock executes nothing, so mirror what each proxy constructor wrote
		storage.setAddress(registry.address, IMPLEMENTATION_SLOT, env.get('Registry_Implementation').address);
		storage.setAddress(registry.address, OWNER_SLOT, env.get(SHARED_ADMIN).address);
		proxies.push(registry.address);
	}

	return {env, provider, storage, owners, deploymentStore, proxies, admin: env.get(SHARED_ADMIN).address};
}

describe('@rocketh/unknown-signer - Matrix: many proxies behind one multisig-owned ProxyAdmin', () => {
	it('surfaces exactly one deferred upgrade per proxy, all from the multisig to the shared admin', async () => {
		/**
		 * Example: you ship v2 of `Registry`, which three markets share. The deployer
		 * deploys the new implementation; each proxy then has to be pointed at it through
		 * the shared admin, which only the multisig can do. The run hands you three
		 * transactions: none dropped, none duplicated, in the order the script visited
		 * the markets.
		 */
		const {env, proxies, admin} = await deployMarketsBehindSharedAdmin();

		const deferred = await upgradeAllMarkets(env);

		const v2 = env.get('Registry_Implementation').address;
		expect(deferred).toStrictEqual(
			proxies.map((proxy) => ({
				from: SAFE,
				to: admin,
				value: undefined,
				data: encodeFunctionData({abi: PROXY_ADMIN_ABI, functionName: 'upgrade', args: [proxy, v2]}),
			})),
		);
		// three distinct proxies, so three distinct transactions: nothing surfaced twice
		expect(new Set(proxies.map((p) => p.toLowerCase())).size).toBe(MARKETS.length);
		expect(new Set(deferred.map((d) => d?.data)).size).toBe(MARKETS.length);
	});

	it('varies the deferred data ONLY in the proxy address', async () => {
		/**
		 * What the multisig operator sees when comparing the three: same method, same new
		 * implementation, a different proxy each time. Decoding makes that explicit
		 * rather than leaving it to eyeballing three hex blobs.
		 */
		const {env, proxies} = await deployMarketsBehindSharedAdmin();

		const deferred = await upgradeAllMarkets(env);

		const decoded = deferred.map((d) => decodeFunctionData({abi: PROXY_ADMIN_ABI, data: d!.data as `0x${string}`}));
		// decoding returns checksummed addresses, so compare case-insensitively
		const v2 = env.get('Registry_Implementation').address.toLowerCase();
		expect(decoded.map((call) => call.functionName)).toEqual(['upgrade', 'upgrade', 'upgrade']);
		expect(decoded.map((call) => call.args[1].toLowerCase())).toEqual([v2, v2, v2]);
		expect(decoded.map((call) => call.args[0].toLowerCase())).toEqual(proxies.map((p) => p.toLowerCase()));
	});

	it('surfaces the same set, in the same order, when re-run before the multisig acts', async () => {
		/**
		 * You lost your terminal, or you just want the list again: re-run the same script
		 * against the same deployments. Nothing on chain changed, so the same three
		 * upgrades are outstanding, and they come back identical and in the same order.
		 * The deployer broadcasts nothing the second time: v2 is already deployed.
		 */
		const {env, storage, owners, deploymentStore} = await deployMarketsBehindSharedAdmin();

		const firstRun = await upgradeAllMarkets(env);

		const {env: reRunEnv, provider: reRunProvider} = await runEnvironment({deploymentStore, storage, owners});
		const secondRun = await upgradeAllMarkets(reRunEnv);

		expect(firstRun).toHaveLength(MARKETS.length);
		expect(secondRun).toStrictEqual(firstRun);
		expect(broadcastFrom(reRunProvider)).toEqual([]);
	});

	it('persists no unsigned transaction for any of the N deferrals', async () => {
		/**
		 * Three deferrals, zero files about them. The store holds the deployment records
		 * that would exist anyway, and no run adds anything describing what the multisig
		 * still has to execute. The chain is the only memory.
		 */
		const {env, storage, owners, deploymentStore} = await deployMarketsBehindSharedAdmin();
		const filesBefore = await storedFiles(deploymentStore, env);

		await upgradeAllMarkets(env);
		const filesAfterRun1 = await storedFiles(deploymentStore, env);

		const {env: reRunEnv} = await runEnvironment({deploymentStore, storage, owners});
		await upgradeAllMarkets(reRunEnv);

		expect(filesBefore).toEqual(
			[
				'.chain',
				'RegistryAlpha.json',
				'RegistryAlpha_Proxy.json',
				'RegistryBeta.json',
				'RegistryBeta_Proxy.json',
				'RegistryGamma.json',
				'RegistryGamma_Proxy.json',
				'Registry_Implementation.json',
				`${SHARED_ADMIN}.json`,
			].sort(),
		);
		expect(filesAfterRun1).toEqual(filesBefore);
		expect(await storedFiles(deploymentStore, reRunEnv)).toEqual(filesBefore);
		expect(filesAfterRun1.some((name) => /unsigned|to-?execute|deferred|pending/i.test(name))).toBe(false);
	});

	it('THE TRAP: one wrapper around the whole batch captures the first deferral and skips the rest', async () => {
		/**
		 * Why the script above wraps each proxy separately. A deferral does not "record and
		 * continue" inside the action: the `UnknownSignerError` UNWINDS the action it was
		 * thrown in, and `catchUnknownSigner` catches it at the wrapper. So with one wrapper
		 * around the loop, the first market's upgrade is surfaced, and the loop never gets
		 * to the second and third. No error, no warning: they are silently not attempted.
		 *
		 * This test pins that behaviour so the wrap-each-step rule is enforced, not folklore.
		 */
		const {env, proxies, admin} = await deployMarketsBehindSharedAdmin();
		const attempted: string[] = [];

		const onlyOne = await catchUnknownSigner(env)(async () => {
			for (const market of MARKETS) {
				attempted.push(market);
				await deployMarket(env, market, 2);
			}
		});

		const v2 = env.get('Registry_Implementation').address;
		// ONE transaction came back, for the first proxy only...
		expect(onlyOne).toStrictEqual({
			from: SAFE,
			to: admin,
			value: undefined,
			data: encodeFunctionData({abi: PROXY_ADMIN_ABI, functionName: 'upgrade', args: [proxies[0], v2]}),
		});
		// ...because Beta and Gamma were never even reached
		expect(attempted).toEqual(['Alpha']);

		// and they are still outstanding: the per-proxy script finds all three
		const allThree = await upgradeAllMarkets(env);
		expect(allThree.map((d) => d?.data)).toEqual(
			proxies.map((proxy) => encodeFunctionData({abi: PROXY_ADMIN_ABI, functionName: 'upgrade', args: [proxy, v2]})),
		);
	});
});

// ============================================================================
// Matrix: an upgrade plus a dependent follow-up from the same owner
// ============================================================================

/**
 * THE TOPOLOGY. Real upgrades rarely stop at `upgrade()`: there is usually a follow-up
 * from the SAME owner (repoint a registrar, run a migration, flip a flag). Here the proxy
 * sits behind a shared `ProxyAdmin` owned by the multisig, and a governance-owned
 * `Registrar` must be pointed at whichever implementation the proxy runs. Both calls have
 * the multisig as `from`, so on an upgrade run BOTH defer, and the operator receives an
 * ordered pair: `[ProxyAdmin.upgrade(proxy, v2), Registrar.setRegistry(v2, version + 1)]`.
 *
 * WHY THE ORDER IS THE SCRIPT'S RESPONSIBILITY. rocketh does not batch deferrals, does
 * not reorder them, and does not know that one depends on the other. Each
 * `catchUnknownSigner` catches the one transaction its action reached and hands it back
 * as a return value; the "pair" only exists because the script collects those return
 * values in the order it performed the steps. So the surfaced order is exactly the order
 * of the script's `await`s, nothing more. If the script repointed the registrar before
 * upgrading, the operator would get the pair in THAT order, and executing it would leave
 * the registrar naming an implementation the proxy is not yet running. The contract shape
 * that makes this matter (see `demoes/hardhat-deploy/governance`): `Registrar.setRegistry`
 * refuses any version that is not exactly `version() + 1`, so a pair replayed out of
 * order, or twice, reverts rather than quietly producing a wrong state.
 *
 * WHY THE PAIR IS IDEMPOTENT THROUGH PARTIAL EXECUTION. rocketh persists nothing between
 * runs, so "has this step already happened?" can only be answered by the chain, and each
 * step answers it with its OWN read: the upgrade by `@rocketh/proxy` reading the proxy's
 * implementation slot, the follow-up by the script reading `Registrar.registry()`. Because
 * the two reads are independent, a multisig that executed only the first transaction gets,
 * on the next run, only the second.
 */
const ORDERED_PROXY = 'OrderedRegistry';
const ORDERED_ADMIN = 'OrderedProxyAdmin';

/** The governance-owned pointer; its shape mirrors the demo's `Registrar.sol`. */
const REGISTRAR_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'owner_'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'registry', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{type: 'function', name: 'version', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'setRegistry',
		inputs: [
			{type: 'address', name: 'registry_'},
			{type: 'uint256', name: 'version_'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/**
 * What the `Registrar` answers to `registry()` and `version()`, served through `eth_call`.
 *
 * Same trick as `createStorage` and `createOwners`: the mock executes nothing, so the test
 * holds the registrar's state and `point` stands in for governance having executed
 * `setRegistry`. Calls to anything other than the `Registrar` deployment return
 * `undefined`, so the harness falls through to the other responders.
 */
function createRegistrar() {
	let registry: `0x${string}` = zeroAddress;
	let version = 0n;
	const selectorOf = (functionName: 'registry' | 'version') =>
		encodeFunctionData({abi: REGISTRAR_ABI, functionName}).toLowerCase();
	return {
		point(registry_: `0x${string}`, version_: bigint) {
			registry = registry_;
			version = version_;
		},
		respondToCall(params: unknown[] | undefined, env: Environment | undefined): `0x${string}` | undefined {
			const [call] = params as [{to?: string; data?: string; input?: string}];
			const data = (call.data ?? call.input ?? '').toLowerCase();
			const registrar = env?.getOrNull('Registrar');
			if (!registrar || call.to?.toLowerCase() !== registrar.address.toLowerCase()) return undefined;
			if (data.startsWith(selectorOf('registry'))) {
				return encodeFunctionResult({abi: REGISTRAR_ABI, functionName: 'registry', result: registry});
			}
			if (data.startsWith(selectorOf('version'))) {
				return encodeFunctionResult({abi: REGISTRAR_ABI, functionName: 'version', result: version});
			}
			return undefined;
		},
	};
}

/** The deploy-script step that converges the proxy on `version` of the implementation. */
function deployOrderedRegistry(env: Environment, version: 1 | 2) {
	return deployViaProxy(env)(
		ORDERED_PROXY,
		{account: 'deployer', artifact: vaultArtifact(version), args: [42n]},
		{owner: SAFE, proxyContract: {type: 'SharedAdminOptimizedTransparentProxy', proxyAdminName: ORDERED_ADMIN}},
	);
}

/**
 * The deploy script under test, shaped like `deploy/003_upgrade_then_migrate.ts`: STEP 1
 * upgrades, STEP 2 repoints the registrar, each in its own `catchUnknownSigner`, and the
 * returned array is built in the order the steps ran. That array IS the ordered pair;
 * nothing in rocketh assembles it.
 */
async function upgradeThenRepoint(env: Environment) {
	// STEP 1: converge the proxy on v2 (deferred while the proxy still runs v1)
	const deferredUpgrade = await catchUnknownSigner(env)(() => deployOrderedRegistry(env, 2));

	// STEP 2: point the registrar at the implementation the proxy should run, guarded by an
	//  on-chain read, since nothing else can say whether governance already did it
	const implementation = env.get(`${ORDERED_PROXY}_Implementation`).address;
	const registrar = env.get<typeof REGISTRAR_ABI>('Registrar');
	const currentTarget = await read(env)(registrar, {functionName: 'registry'});

	let deferredFollowUp = null;
	if (currentTarget.toLowerCase() !== implementation.toLowerCase()) {
		const currentVersion = await read(env)(registrar, {functionName: 'version'});
		deferredFollowUp = await catchUnknownSigner(env)(() =>
			execute(env)(registrar, {
				account: 'safe',
				functionName: 'setRegistry',
				args: [implementation, currentVersion + 1n],
			}),
		);
	}

	return [deferredUpgrade, deferredFollowUp] as const;
}

/**
 * The world the upgrade run starts from: the proxy at v1 behind the multisig-owned admin,
 * and the registrar (owned by the multisig from birth) already pointing at v1 as its
 * version 1, i.e. governance executed the previous release's follow-up.
 */
async function deployRegistryWithRegistrar() {
	const storage = createStorage();
	const owners = createOwners();
	const registrar = createRegistrar();
	const deploymentStore = createMapDeploymentStore();
	// what the admin's constructor (`ProxyAdmin(initialOwner)`) writes
	owners.setOwner(ORDERED_ADMIN, SAFE);
	const {env, provider} = await runEnvironment({deploymentStore, storage, owners, registrar});

	// deploying the registrar is signable: the deployer sends it, the multisig owns it
	const registrarDeployment = await deploy(env)('Registrar', {
		account: 'deployer',
		artifact: createMockArtifact('Registrar', REGISTRAR_ABI),
		args: [SAFE],
	});

	const proxy = await deployOrderedRegistry(env, 1);
	const v1 = env.get(`${ORDERED_PROXY}_Implementation`).address;
	// the mock executes nothing, so mirror what the proxy constructor and the previous
	//  release's (already executed) follow-up wrote
	storage.setAddress(proxy.address, IMPLEMENTATION_SLOT, v1);
	storage.setAddress(proxy.address, OWNER_SLOT, env.get(ORDERED_ADMIN).address);
	registrar.point(v1, 1n);

	return {
		env,
		provider,
		storage,
		owners,
		registrar,
		deploymentStore,
		proxy: proxy.address,
		admin: env.get(ORDERED_ADMIN).address,
		registrarAddress: registrarDeployment.address,
	};
}

describe('@rocketh/unknown-signer - Matrix: an upgrade and a dependent follow-up from the same multisig', () => {
	it('surfaces both calls, in the order the script performed them, both from the multisig', async () => {
		/**
		 * Example: you ship v2. The deployer deploys the new implementation; then the
		 * proxy has to be upgraded AND the registrar repointed, and only the multisig can
		 * do either. Two wrapped calls with the same unsignable `from` both reach the
		 * `broadcastTransaction` seam, so the run hands you two transactions: none
		 * dropped, upgrade first, follow-up second, because that is the order the script
		 * awaited them in.
		 */
		const {env, provider, proxy, admin, registrarAddress} = await deployRegistryWithRegistrar();
		provider.clearRequests();

		const [deferredUpgrade, deferredFollowUp] = await upgradeThenRepoint(env);

		const v2 = env.get(`${ORDERED_PROXY}_Implementation`).address;
		expect([deferredUpgrade, deferredFollowUp]).toStrictEqual([
			{
				from: SAFE,
				to: admin,
				value: undefined,
				data: encodeFunctionData({abi: PROXY_ADMIN_ABI, functionName: 'upgrade', args: [proxy, v2]}),
			},
			{
				from: SAFE,
				to: registrarAddress,
				value: undefined,
				// version 2 because the registrar is at version 1: exactly the next one,
				//  which is the only version `setRegistry` accepts
				data: encodeFunctionData({abi: REGISTRAR_ABI, functionName: 'setRegistry', args: [v2, 2n]}),
			},
		]);

		// the follow-up names the implementation the upgrade installs, and the next version
		const followUp = decodeFunctionData({abi: REGISTRAR_ABI, data: deferredFollowUp!.data as `0x${string}`});
		expect(followUp.functionName).toBe('setRegistry');
		expect(followUp.args).toEqual([expect.stringMatching(new RegExp(`^${v2}$`, 'i')), 2n]);

		// both were surfaced, neither was sent: only the deployer's v2 deploy broadcast
		expect(broadcastFrom(provider)).toEqual([DEPLOYER]);
	});

	it('surfaces ONLY the follow-up when re-run after the multisig executed just the upgrade', async () => {
		/**
		 * Continuing the story: the multisig executes the first transaction of the pair
		 * (modelled by moving the proxy's implementation slot to v2, which is all
		 * `ProxyAdmin.upgrade` would do) and has not yet executed the second. You re-run
		 * the same script.
		 *
		 * The upgrade step reads the slot, sees v2, and skips: its wrapper returns `null`.
		 * The follow-up step reads the registrar, sees it still names v1 at version 1, and
		 * defers the SAME `setRegistry(v2, 2)` as before. So partial execution converges
		 * rather than duplicating: the operator is never handed the upgrade twice, and the
		 * follow-up's version argument has not drifted to 3. Once the multisig executes the
		 * follow-up too, a third run surfaces nothing at all.
		 */
		const {env, storage, owners, registrar, deploymentStore, proxy} = await deployRegistryWithRegistrar();

		// ---- run 1: the ordered pair ------------------------------------------
		const [, firstFollowUp] = await upgradeThenRepoint(env);
		const v2 = env.get(`${ORDERED_PROXY}_Implementation`).address;

		// ---- the multisig executes ONLY the upgrade ---------------------------
		storage.setAddress(proxy, IMPLEMENTATION_SLOT, v2);

		// ---- run 2: same script, fresh run ------------------------------------
		const {env: reRunEnv, provider: reRunProvider} = await runEnvironment({
			deploymentStore,
			storage,
			owners,
			registrar,
		});
		const [upgradeAgain, followUpAgain] = await upgradeThenRepoint(reRunEnv);

		expect(upgradeAgain).toBeNull();
		expect(followUpAgain).toStrictEqual(firstFollowUp);
		expect(followUpAgain?.from).toBe(SAFE);
		// nothing broadcast: v2 was already deployed, and the multisig's call only deferred
		expect(broadcastFrom(reRunProvider)).toEqual([]);

		// ---- the multisig executes the follow-up; run 3 has nothing left -------
		registrar.point(v2, 2n);
		const {env: finalEnv} = await runEnvironment({deploymentStore, storage, owners, registrar});
		expect(await upgradeThenRepoint(finalEnv)).toEqual([null, null]);
	});
});
