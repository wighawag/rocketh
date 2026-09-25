/**
 * `@rocketh/unknown-signer`: a hardhat-deploy v1 upgrade script, PORTED, run end to end.
 *
 * `scenarios.integration.test.ts` proves the mechanism step by step. This file proves it on
 * a WHOLE SCRIPT, the way a migrating team meets it: take the v1 deploy script you already
 * have, port it, run it, and check it does what it did under v1. The rocketh script under
 * test is `upgradeVault` below; read it next to the v1 original here.
 *
 * THE v1 ORIGINAL (hardhat-deploy v1, `deploy/002_upgrade_vault.ts`). A `Vault` sits behind
 * an EIP-173 proxy owned by a Safe (the named account `safeOwner`), deployed by an earlier
 * script. This one ships v2 of the implementation, which the deployer can sign for, then
 * asks the Safe to point the proxy at it, which only the Safe can do:
 *
 * ```ts
 * import {DeployFunction} from 'hardhat-deploy/types';
 * import {forTheSafe} from '../safe/outbox';
 *
 * const func: DeployFunction = async ({deployments, getNamedAccounts, ethers}) => {
 *   const {deploy, execute, get, catchUnknownSigner} = deployments;
 *   const {deployer, safeOwner} = await getNamedAccounts();
 *
 *   const next = await deploy('Vault_Implementation_V2', {from: deployer, contract: 'VaultV2', args: [42]});
 *   const vault = await get('Vault');
 *
 *   // idempotency: only the chain can say whether the Safe already upgraded
 *   const slot = await ethers.provider.getStorageAt(vault.address, IMPLEMENTATION_SLOT);
 *   if (`0x${slot.slice(-40)}`.toLowerCase() !== next.address.toLowerCase()) {
 *     const deferred = await catchUnknownSigner(
 *       execute('Vault', {from: safeOwner}, 'upgradeTo', next.address),
 *     );
 *     if (deferred) forTheSafe.push(deferred);
 *   }
 *
 *   // the rest of the script, which does not depend on the upgrade having happened
 *   await deploy('VaultLens', {from: deployer, args: [vault.address]});
 * };
 * export default func;
 * ```
 *
 * THE PORT, as a diff of the one line `@rocketh/unknown-signer` asks you to change:
 *
 * ```diff
 * - const {catchUnknownSigner} = deployments;              // v1: built into hardhat-deploy
 * + import * as unknownSigner from '@rocketh/unknown-signer';  // rocketh: an extension,
 * + const extensions = {...deployExtension, ...unknownSigner}; // spread in rocketh/config.ts
 *
 * - const deferred = await catchUnknownSigner(execute(...));
 * + const deferred = await catchUnknownSigner(() => execute(...));
 * ```
 *
 * That is the whole shim-level port: where `catchUnknownSigner` comes from, and `() =>`.
 * The return value (`null`, or v1's `{from, to, value, data}`), the printed block, the
 * no-persistence rule and the idempotency story are unchanged, which is what the tests pin.
 *
 * WHAT ELSE DIFFERS, AND WHY IT IS NOT THIS PACKAGE'S DIFF. The rest of a v1 script is
 * translated by the general v1 → rocketh port, not by `catchUnknownSigner`: the script frame
 * (`DeployFunction` → `deployScript(async ({...}) => ...)`), `getNamedAccounts()` →
 * `namedAccounts`, and the call shapes of `deploy` / `execute` (v1's positional
 * `execute(name, {from}, method, ...args)` becomes `execute(deployment, {account,
 * functionName, args})`). Those are mechanical too, and the migration guide maps them; they
 * are the same whether or not the script ever wraps a call. Every NAME a reader would look
 * for reads the same on both sides: `deployer`, `safeOwner`, `Vault`,
 * `Vault_Implementation_V2`, `upgradeTo`, `VaultLens`, and the on-chain check.
 *
 * THE HARNESS. `createTestEnvironment` builds a REAL rocketh environment (account resolution,
 * signability and the `broadcastTransaction` choke point are production code) wired to a
 * mock provider. The Safe is `safeOwner` declared as a bare address the node does not hold,
 * with `autoImpersonate: false` (ADR 0006): that is what an unsignable owner IS, there is no
 * Safe-specific code. The mock is not an EVM, so the test keeps the chain itself (`createChain`: storage and address allocation, both outliving a run);
 * moving the implementation slot by hand is how "the Safe executed the transaction" is
 * modelled between run 1 and run 2. Deployments live in an in-memory store, so nothing is
 * written to disk.
 */

import {describe, it, expect, vi} from 'vitest';
import {encodeFunctionData} from 'viem';
import {withEnvironment} from '@rocketh/core';
import type {Abi, Artifact, CurriedFunctions, DeploymentStore, Environment} from '@rocketh/core/types';
import {createMockArtifact, createTestEnvironment, createMapDeploymentStore} from '@rocketh/test-utils';
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';
import * as readExecuteExtension from '@rocketh/read-execute';

import * as unknownSignerExtension from '../src/index.js';
import type {CaughtUnknownSignerTransaction} from '../src/index.js';

// ============================================================================
// The project: accounts, artifacts, config
// ============================================================================

/** `deployer`: the key the deploy machine holds, listed by the node, so signable. */
const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** `safeOwner`: the Safe. A bare address with no signer material: unsignable for the run. */
const SAFE_OWNER = '0x1111111111111111111111111111111111111111' as `0x${string}`;

/** The v1 project's `namedAccounts`, carried over name for name. */
const namedAccounts = {deployer: DEPLOYER, safeOwner: SAFE_OWNER};

/** EIP-1967 implementation slot: where the proxy keeps the implementation it runs. */
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
/** EIP-1967 admin slot, which the EIP-173 proxy uses for its owner. */
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

const VAULT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

const VAULT_LENS_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'vault'}], stateMutability: 'nonpayable'},
] as const satisfies Abi;

/** The proxy function the Safe has to call, to encode what the test expects back. */
const UPGRADE_TO_ABI = [
	{
		type: 'function',
		name: 'upgradeTo',
		inputs: [{type: 'address', name: 'newImplementation'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/**
 * What `rocketh/deploy.ts` re-exports as `artifacts`. `VaultV2` gets its own bytecode so it
 * is a genuinely different contract from `Vault` v1, as it would be in a real project.
 */
const artifacts = {
	Vault: createMockArtifact('Vault', VAULT_ABI),
	VaultV2: {
		...createMockArtifact('VaultV2', VAULT_ABI),
		bytecode: '0x6080604052348015600f57600080fd5b5022' as `0x${string}`,
		deployedBytecode: '0x608060405222dead0002' as `0x${string}`,
	} satisfies Artifact<typeof VAULT_ABI>,
	VaultLens: createMockArtifact('VaultLens', VAULT_LENS_ABI),
};

/** What `rocketh/config.ts` exports: the extensions every deploy script receives. */
const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...proxyExtension,
	...unknownSignerExtension,
};

/**
 * What `rocketh/deploy.ts` exports, reduced to what the test needs: rocketh's
 * `setupDeployScripts(extensions).deployScript` layers the curried extensions over the
 * environment and hands the result to the script. Done inline so this package does not
 * take a dependency on `rocketh` just to reach a two-line helper.
 */
function deployScript(callback: (env: Environment & CurriedFunctions<typeof extensions>) => Promise<void>) {
	return (env: Environment) =>
		callback(Object.assign(Object.create(Object.getPrototypeOf(env)), env, withEnvironment(env, extensions)));
}

// ============================================================================
// The ported scripts
// ============================================================================

/**
 * `deploy/001_deploy_vault.ts`, ported: the EARLIER script that put `Vault` behind a proxy
 * owned by the Safe. Only there to set the stage; not what this file is about.
 * (v1: `deploy('Vault', {from: deployer, args: [42], proxy: {owner: safeOwner}})`.)
 */
const deployVault = deployScript(async ({deployViaProxy, namedAccounts}) => {
	const {deployer, safeOwner} = namedAccounts;
	await deployViaProxy(
		'Vault',
		{account: deployer, artifact: artifacts.Vault, args: [42n]},
		{owner: safeOwner as `0x${string}`},
	);
});

/**
 * `deploy/002_upgrade_vault.ts`, ported. THE SCRIPT UNDER TEST: compare it line by line with
 * the v1 original in the header.
 *
 * `forTheSafe` stands in for whatever the v1 script did with a deferred transaction (the
 * v1 `../safe/outbox` module: a list the operator reads, a JSON file, a spreadsheet row). It
 * is where the test observes the wrapper's return value, exactly as the script's author
 * would.
 */
function upgradeVault(forTheSafe: CaughtUnknownSignerTransaction[]) {
	return deployScript(async ({deploy, execute, get, catchUnknownSigner, namedAccounts, network}) => {
		const {deployer, safeOwner} = namedAccounts;

		const next = await deploy('Vault_Implementation_V2', {account: deployer, artifact: artifacts.VaultV2, args: [42n]});
		const vault = get<typeof UPGRADE_TO_ABI>('Vault');

		// idempotency: only the chain can say whether the Safe already upgraded
		const slot = await network.provider.request({
			method: 'eth_getStorageAt',
			params: [vault.address, IMPLEMENTATION_SLOT, 'latest'],
		});
		if (`0x${slot.slice(-40)}`.toLowerCase() !== next.address.toLowerCase()) {
			const deferred = await catchUnknownSigner(() =>
				execute(vault, {account: safeOwner, functionName: 'upgradeTo', args: [next.address]}),
			);
			if (deferred) forTheSafe.push(deferred);
		}

		// the rest of the script, which does not depend on the upgrade having happened
		await deploy('VaultLens', {account: deployer, artifact: artifacts.VaultLens, args: [vault.address]});
	});
}

// ============================================================================
// Harness
// ============================================================================

/**
 * The chain, which OUTLIVES a run: what the mock provider serves to every run over it.
 *
 * Two things a real chain carries from one `rocketh deploy` invocation to the next, which a
 * fresh mock provider would otherwise forget: contract STORAGE (the proxy's slots, which the
 * test writes by hand because the mock executes nothing) and ADDRESS ALLOCATION (a contract
 * deployed on run 2 must not land on an address run 1 already used, or v2 of the
 * implementation would share v1's address and no upgrade would ever be needed).
 */
function createChain() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	let txCount = 0;
	const contractAddressForHash = new Map<string, `0x${string}`>();
	return {
		/** Write an ADDRESS-valued slot (left-padded to 32 bytes, as the EVM stores it). */
		setAddress(address: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
		},
		responses: {
			eth_getStorageAt(params?: unknown[]) {
				const [address, slot] = params as [string, string];
				return slots.get(keyOf(address, slot)) ?? (`0x${'0'.repeat(64)}` as `0x${string}`);
			},
			eth_sendTransaction() {
				const hex = (++txCount).toString(16);
				const hash = `0x${'c'.repeat(64 - hex.length)}${hex}` as `0x${string}`;
				contractAddressForHash.set(hash, `0x${'c'.repeat(40 - hex.length)}${hex}` as `0x${string}`);
				return hash;
			},
			eth_getTransactionReceipt(params?: unknown[]) {
				const hash = params?.[0] as `0x${string}`;
				return {
					contractAddress: contractAddressForHash.get(hash) ?? (`0x${'0'.repeat(40)}` as `0x${string}`),
					status: '0x1' as const,
					transactionHash: hash,
					blockHash: `0x${'b'.repeat(64)}` as `0x${string}`,
					blockNumber: '0x1' as const,
					transactionIndex: '0x0' as const,
					gasUsed: '0x5208' as const,
					effectiveGasPrice: '0x3b9aca00' as const,
					logs: [],
					from: DEPLOYER,
				};
			},
		},
	};
}

/**
 * One `rocketh deploy` invocation: a fresh environment over the same deployment store and
 * the same chain. Passing the same world twice is a RE-RUN.
 */
async function run(world: {deploymentStore: DeploymentStore; chain: ReturnType<typeof createChain>}) {
	const result = await createTestEnvironment({
		accounts: namedAccounts,
		nodeAccounts: [DEPLOYER],
		executionParams: {autoImpersonate: false},
		deploymentStore: world.deploymentStore,
		providerConfig: {responses: world.chain.responses},
	});
	// what rocketh's executor does at the start of every run: reload the saved deployments
	await result.internal.loadDeployments();
	const printed: string[] = [];
	vi.spyOn(result.env, 'showMessage').mockImplementation((message: string) => {
		printed.push(message);
	});
	return {...result, printed: () => printed.join('\n')};
}

/** Every `eth_sendTransaction` a run broadcast, as lowercased `from` addresses. */
function broadcastFrom(provider: {getRequests: () => {method: string; params?: unknown[]}[]}): string[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => ((r.params?.[0] as {from: string}).from ?? '').toLowerCase());
}

/**
 * The world `002_upgrade_vault` starts from: `001_deploy_vault` already ran, so `Vault` v1
 * sits behind a proxy owned by the Safe. The storage mirrors what the proxy constructor wrote.
 */
async function afterFirstDeployment() {
	const world = {deploymentStore: createMapDeploymentStore(), chain: createChain()};
	const {env} = await run(world);
	await deployVault(env);
	const vault = env.get('Vault').address;
	world.chain.setAddress(vault, IMPLEMENTATION_SLOT, env.get('Vault_Implementation').address);
	world.chain.setAddress(vault, ADMIN_SLOT, SAFE_OWNER);
	return {world, vault};
}

// ============================================================================
// The tests: run the ported script, observe what v1 would have done
// ============================================================================

describe('@rocketh/unknown-signer - a ported hardhat-deploy v1 proxy-upgrade script', () => {
	it('run 1: the Safe-only upgrade is DEFERRED, handed back in v1 shape, never waited on', async () => {
		/**
		 * You run the ported script. The deployer ships v2 (it can sign); the upgrade belongs
		 * to the Safe, so instead of hanging for a receipt or reverting, `catchUnknownSigner`
		 * hands back the transaction to execute: exactly `proxy.upgradeTo(v2)`, from the Safe.
		 */
		const {world, vault} = await afterFirstDeployment();
		const {env, provider, printed} = await run(world);
		const forTheSafe: CaughtUnknownSignerTransaction[] = [];

		await upgradeVault(forTheSafe)(env);

		const v2 = env.get('Vault_Implementation_V2').address;
		expect(forTheSafe).toStrictEqual([
			{
				from: SAFE_OWNER,
				to: vault,
				value: undefined,
				data: encodeFunctionData({abi: UPGRADE_TO_ABI, functionName: 'upgradeTo', args: [v2]}),
			},
		]);
		// nothing was sent from the Safe: deferred, not attempted
		expect(broadcastFrom(provider)).not.toContain(SAFE_OWNER);
		// and v1's printed block told the operator what to do
		expect(printed()).toContain(`from: ${SAFE_OWNER}`);
		expect(printed()).toContain('method: upgradeTo');
	});

	it('run 1: the returned object has exactly v1 keys, all present, `value` a string or absent', async () => {
		/**
		 * The consumer code a v1 script already has (`forTheSafe.push(deferred)`, a JSON dump,
		 * `'to' in deferred`) keeps working: the four v1 keys, every one PRESENT, nothing else.
		 * `upgradeTo` carries no ETH, so `value` is present and `undefined`, as under v1; when a
		 * call does carry ETH it is a string (pinned in `v1-parity.integration.test.ts`).
		 */
		const {world} = await afterFirstDeployment();
		const {env} = await run(world);
		const forTheSafe: CaughtUnknownSignerTransaction[] = [];

		await upgradeVault(forTheSafe)(env);

		const [deferred] = forTheSafe;
		expect(Object.keys(deferred).sort()).toEqual(['data', 'from', 'to', 'value']);
		for (const key of ['from', 'to', 'value', 'data']) {
			expect(key in deferred, `key "${key}" must be present`).toBe(true);
		}
		expect(deferred.value === undefined || typeof deferred.value === 'string').toBe(true);
		expect(typeof deferred.data).toBe('string');
	});

	it('run 1: the statement AFTER the wrapper still runs', async () => {
		/**
		 * The point of wrapping: the deferral unwinds only the wrapped `execute`, not the
		 * script. `VaultLens`, deployed on the line after the wrapper, is deployed in the same
		 * run, by the deployer, pointing at the proxy.
		 */
		const {world, vault} = await afterFirstDeployment();
		const {env, provider} = await run(world);
		provider.clearRequests();

		await upgradeVault([])(env);

		const lens = env.getOrNull('VaultLens');
		expect(lens).not.toBeNull();
		expect(lens?.argsData).toContain(vault.slice(2).toLowerCase());
		// two broadcasts, both the deployer's: v2 of the implementation, then the lens
		expect(broadcastFrom(provider)).toEqual([DEPLOYER, DEPLOYER]);
	});

	it('run 2, after the Safe executed it: the script\u2019s own on-chain check skips the upgrade', async () => {
		/**
		 * The operator executes the deferred `upgradeTo` on the Safe, modelled by moving the
		 * proxy's implementation slot to v2 (all that transaction does). You re-run the SAME
		 * script, unedited. Its `if` reads the slot, sees v2, and never reaches the wrapper:
		 * nothing is deferred, nothing is printed, nothing is broadcast, and the script runs to
		 * the end. Nothing rocketh wrote in run 1 told it so: the chain did.
		 */
		const {world, vault} = await afterFirstDeployment();
		const firstRun = await run(world);
		const forTheSafe: CaughtUnknownSignerTransaction[] = [];
		await upgradeVault(forTheSafe)(firstRun.env);
		expect(forTheSafe).toHaveLength(1);
		const v2 = firstRun.env.get('Vault_Implementation_V2').address;

		// ---- the Safe executes the deferred transaction, out of band ----------
		world.chain.setAddress(vault, IMPLEMENTATION_SLOT, v2);

		// ---- run 2: same script, fresh run ------------------------------------
		const secondRun = await run(world);
		const nothingForTheSafe: CaughtUnknownSignerTransaction[] = [];
		await expect(upgradeVault(nothingForTheSafe)(secondRun.env)).resolves.toBeUndefined();

		expect(nothingForTheSafe).toEqual([]);
		expect(secondRun.printed()).not.toContain('no signer for');
		expect(broadcastFrom(secondRun.provider)).toEqual([]);
		// the script ran to its last line: the lens from run 1 is still the recorded one
		expect(secondRun.env.get('VaultLens').address).toBe(firstRun.env.get('VaultLens').address);
	});
});
