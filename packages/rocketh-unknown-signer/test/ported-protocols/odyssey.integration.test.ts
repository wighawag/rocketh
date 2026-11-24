/**
 * PORTED PROTOCOL SCRIPT 3 of 3: Odyssey's strategy deployment, from
 * https://github.com/odyssey-finance/odyssey-contracts-public @ 3984123bf0972f0d04fcb93edf221f70110a3faa
 * (read 2026-10-26). The finding: `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md`.
 *
 * LICENCE. That repository carries no LICENSE file and its `package.json` declares no
 * `license`, so no code is copied here. The port below is written FRESH from the structure
 * of the files it cites; the v1 behaviour is described in prose, with file and line.
 *
 * WHY THIS SCRIPT. Odyssey uses hardhat-deploy v1.0.4 for its records, `read`, `execute`,
 * `save`, `catchUnknownSigner`, and a plain `deploy` of the implementation behind each proxy.
 * Every other contract, the proxies included, is deployed by its own helpers through a
 * PERMISSIONED CREATE3 factory (`Deployer3`, `src/utils/Deployer3.sol`, a contract owned by
 * the Safe that only whitelisted callers may use, itself deployed through CreateX with a
 * Safe-permissioned salt). Strategies are the clearest governance case: a strategy is an
 * IMPLEMENTATION that `PositionRegistry` points to, and only the registry's owner (the Safe,
 * `owner` in `namedAccounts`) may register it or move it to a new version.
 *
 * THE v1 SHAPE (described, not copied):
 * - `deploy/optimism/strategies/01_aave_v3_borrow_strategy.ts` calls
 *   Odyssey's strategy helper with the strategy's name, its constructor arguments and the alias of
 *   the fee policy currently set on chain.
 * - `deployAndConfigureStrategy` (`helpers/deploy-helpers.ts:59-119`) reads the registry's
 *   `owner()` ON CHAIN (`:76`) to use as `from`; deploys the strategy through `deploy`
 *   (`:10-31`), which salts `Deployer3` with `finance.odyssey.<alias>V<nonce>` from a
 *   hand-maintained `Nonces` table (`helpers/deploy-config.ts:79-114`); then, if there was no
 *   earlier record, sends `addStrategy(implementation, feePolicy)` (`:91-95`), otherwise looks
 *   the strategy id up with `getStrategyId` and, if the address changed, sends
 *   `updateImplementation(strategyId, implementation)` (`:115-118`).
 * - Each of those registry calls goes through `executeOrStoreTxIfMultisig` (`:121-136`):
 *   `catchUnknownSigner(thunk, {log: true})`, and a caught transaction is appended to
 *   `multisig.batch.tmp.json` (`helpers/safe.ts:22-50`).
 * - `deploy/<chain>/99_safe-txs.ts` (`runAtTheEnd`) proposes the batch through
 *   `@safe-global/api-kit`, or on `hardhat`/`localhost` executes it from the impersonated
 *   Safe (`helpers/safe.ts:52-65, 76-125`).
 * - The one-contract deploy (`_deploy3One`, `helpers/deploy3.ts:151-208`) reuses a record whose
 *   creation code is unchanged, refuses a salt that already holds a contract (asking for the nonce to be bumped),
 *   and otherwise calls `Deployer3.deploy(salt, initCode)` from the deployer and saves the
 *   record itself.
 *
 * WHAT THE PORT CHANGES. Nothing structural: the helpers bypassed hardhat-deploy's own
 * deploy in v1, and they bypass rocketh's `deploy` the same way, through `read`, `execute`
 * and `save`. rocketh's `deterministic: {type: 'create3'}` is NOT a substitute, because it
 * only drives rocketh's own create3 factory (`packages/rocketh-deploy/src/index.ts:305-369`),
 * whose addresses differ from `Deployer3`'s and which no Safe gates. The batch file becomes
 * an in-run list read by the `runAtTheEnd` proposer, as for the other two ports.
 *
 * Odyssey's PROXIES. `deployUpgradable` (`helpers/deploy-helpers.ts:34-51`,
 * `helpers/deploy3.ts:40-137`) uses OpenZeppelin 5.0.1's `TransparentUpgradeableProxy`
 * (`lib/openzeppelin-contracts/package.json`), whose constructor creates its OWN `ProxyAdmin`
 * (`TransparentUpgradeableProxy.sol:78-79`), owned by `owner`, and upgrades through that
 * admin's `upgradeAndCall`. The helper saves that admin from the slot by hand after the first
 * deploy. `deployViaProxy` does it with a `custom` proxy and `createsProxyAdmin: true`, with
 * the same options on every run; the last three tests show it, including a proxy deployed
 * before the record existed, and the refusal without the flag.
 */

import {describe, it, expect} from 'vitest';
import {
	decodeFunctionData,
	encodeAbiParameters,
	encodeDeployData,
	encodeFunctionData,
	getAddress,
	keccak256,
	toHex,
} from 'viem';
import type {Abi, Artifact} from '@rocketh/core/types';
import {createMockArtifact} from '@rocketh/test-utils';

import type {CaughtUnknownSignerTransaction} from '../../src/index.js';
import {
	ADMIN_SLOT,
	IMPLEMENTATION_SLOT,
	createChain,
	createWorld,
	deployScript,
	run,
	sent,
	type ScriptEnvironment,
	type World,
} from './harness.js';

// ============================================================================
// The project
// ============================================================================

const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** The Safe read on chain as `PositionRegistry.owner()` (see the finding for the command). */
const SAFE = '0xd44a3e93a256c445f17a12f35a0ffef975ec6817' as `0x${string}`;

/** v1: `namedAccounts: {deployer: process.env.DEPLOYER || 0, owner: process.env.OWNER}`. */
const accounts = {deployer: 0, owner: SAFE} as const;

const ADDRESSES = {
	Deployer3: '0x5d016a9110767307d83c8f6ee5e068d7720d76cf',
	PositionRegistry: '0xee156d8ea7b96a5524ccc3cf9283ab85e80e9534',
	AaveV3: '0x000000000000000000000000000000000000aa03',
	PerformanceFeePolicy_1000_0_0: '0x000000000000000000000000000000000000fee1',
} as const;

const DEPLOYER3_ABI = [
	{
		type: 'function',
		name: 'deploy',
		inputs: [
			{type: 'string', name: 'salt_'},
			{type: 'bytes', name: 'initCode_'},
		],
		outputs: [{type: 'address'}],
		stateMutability: 'payable',
	},
	{
		type: 'function',
		name: 'computeAddress',
		inputs: [{type: 'string', name: 'salt_'}],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const POSITION_REGISTRY_ABI = [
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'addStrategy',
		inputs: [
			{type: 'address', name: 'implementation_'},
			{type: 'address', name: 'feePolicy_'},
		],
		outputs: [{type: 'uint256'}],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'getStrategyId',
		inputs: [
			{type: 'address', name: 'implementation_'},
			{type: 'address', name: 'feePolicy_'},
		],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'updateImplementation',
		inputs: [
			{type: 'uint256', name: 'strategyId_'},
			{type: 'address', name: 'newImplementation_'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const STRATEGY_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'aaveV3_'}], stateMutability: 'nonpayable'},
] as const satisfies Abi;

function withCode<TAbi extends Abi>(name: string, abi: TAbi, marker: string): Artifact<TAbi> {
	const base = createMockArtifact(name, abi);
	return {
		...base,
		bytecode: `${base.bytecode}${marker}` as `0x${string}`,
		deployedBytecode: `${base.deployedBytecode}${marker}` as `0x${string}`,
	};
}

const artifacts = {
	Deployer3: withCode('Deployer3', DEPLOYER3_ABI, 'c1'),
	PositionRegistry: withCode('PositionRegistry', POSITION_REGISTRY_ABI, 'c2'),
	AaveV3: withCode('AaveV3', [] as const satisfies Abi, 'c3'),
	PerformanceFeePolicy: withCode('PerformanceFeePolicy', [] as const satisfies Abi, 'c4'),
	AaveV3BorrowStrategy: withCode('AaveV3BorrowStrategy', STRATEGY_ABI, 'c5'),
};

// ============================================================================
// The ported helpers (written fresh, with this repo's own names and messages, from the
// structure of `helpers/deploy-helpers.ts` and `helpers/deploy3.ts`). The one thing reproduced
// is DATA: the salt format `finance.odyssey.<name>V<nonce>`, because the test asserts the
// salt the real factory call carries.
// ============================================================================

const SALT_PREFIX = 'finance.odyssey';
const REGISTRY = 'PositionRegistry';

/** Deploy one contract through the Safe-gated `Deployer3`, recording it like any deployment. */
async function deployThroughFactory(
	env: ScriptEnvironment,
	{
		alias,
		artifact,
		args,
		salt,
	}: {alias: string; artifact: Artifact<typeof STRATEGY_ABI>; args: [`0x${string}`]; salt: string},
) {
	const {get, getOrNull, read, execute, save, namedAccounts, network} = env;
	const {deployer} = namedAccounts as {deployer: `0x${string}`};
	const creationCode = encodeDeployData({abi: artifact.abi, bytecode: artifact.bytecode, args});
	const argsData = `0x${creationCode.slice(artifact.bytecode.length)}` as `0x${string}`;

	const existing = getOrNull(alias);
	if (existing && existing.bytecode === artifact.bytecode && existing.argsData === argsData) {
		return {...existing, newlyDeployed: false};
	}

	const deployer3 = get<typeof DEPLOYER3_ABI>('Deployer3');
	const address = (await read(deployer3, {functionName: 'computeAddress', args: [salt]})) as `0x${string}`;
	const code = await network.provider.request({method: 'eth_getCode', params: [address, 'latest']});
	if ((existing && existing.address.toLowerCase() === address.toLowerCase()) || code !== '0x') {
		throw Error(
			`${alias}: salt ${salt} already holds a contract at ${address}; bump this contract's nonce to deploy a new version`,
		);
	}

	await execute(deployer3, {account: deployer, functionName: 'deploy', args: [salt, creationCode]});
	const deployment = await save(alias, {...artifact, address, argsData});
	return {...deployment, newlyDeployed: true};
}

/** Odyssey's `deployAndConfigureStrategy` (`helpers/deploy-helpers.ts:59-119`), ported. */
async function registerStrategy(
	env: ScriptEnvironment,
	batch: CaughtUnknownSignerTransaction[],
	{
		strategyName,
		artifact,
		ctorArgs,
		nonce,
		feePolicy,
	}: {
		strategyName: string;
		artifact: Artifact<typeof STRATEGY_ABI>;
		ctorArgs: [`0x${string}`];
		nonce: number;
		feePolicy: {policyName: string};
	},
) {
	const {get, getOrNull, read, execute} = env;
	const registry = get<typeof POSITION_REGISTRY_ABI>(REGISTRY);
	// `from` is whoever owns the registry ON CHAIN, not a named account
	const from = (await read(registry, {functionName: 'owner'})) as `0x${string}`;

	const recordedStrategy = getOrNull(strategyName)?.address;
	const feePolicyAddress = get(feePolicy.policyName).address;

	const {address: deployedStrategy} = await deployThroughFactory(env, {
		alias: strategyName,
		artifact,
		args: ctorArgs,
		salt: `${SALT_PREFIX}.${strategyName}V${nonce}`,
	});

	if (recordedStrategy == null) {
		await deferToSafeIfUnsignable(env, batch, () =>
			execute(registry, {account: from, functionName: 'addStrategy', args: [deployedStrategy, feePolicyAddress]}),
		);
		return;
	}

	const id = await read(registry, {
		functionName: 'getStrategyId',
		args: [recordedStrategy, feePolicyAddress],
	});
	if (id == 0n) {
		throw Error(`no strategy registered for ${strategyName} with fee policy ${feePolicy.policyName}`);
	}

	if (deployedStrategy !== recordedStrategy) {
		await deferToSafeIfUnsignable(env, batch, () =>
			execute(registry, {account: from, functionName: 'updateImplementation', args: [id, deployedStrategy]}),
		);
	}
}

/** Odyssey's `executeOrStoreTxIfMultisig` (`helpers/deploy-helpers.ts:121-136`), ported. */
async function deferToSafeIfUnsignable(
	env: ScriptEnvironment,
	batch: CaughtUnknownSignerTransaction[],
	action: () => Promise<unknown>,
) {
	const deferred = await env.catchUnknownSigner(action, {log: true});
	if (deferred) batch.push(deferred);
}

/** `deploy/optimism/strategies/01_aave_v3_borrow_strategy.ts`, ported. */
function aaveV3BorrowStrategy(batch: CaughtUnknownSignerTransaction[], nonce = 10) {
	return deployScript(async (env) => {
		const {address: aaveAddress} = env.get('AaveV3');
		await registerStrategy(env, batch, {
			strategyName: 'AaveV3BorrowStrategy',
			artifact: artifacts.AaveV3BorrowStrategy,
			ctorArgs: [aaveAddress],
			nonce, // `Nonces[AAVE_V3_BORROW_STRATEGY]` (`helpers/deploy-config.ts:96`)
			feePolicy: {policyName: 'PerformanceFeePolicy_1000_0_0'},
		});
	});
}

/** `deploy/<chain>/99_safe-txs.ts` (`runAtTheEnd`). */
function safeTxs(batch: CaughtUnknownSignerTransaction[], propose: (txs: CaughtUnknownSignerTransaction[]) => void) {
	return deployScript(async () => {
		if (batch.length > 0) propose([...batch]);
	});
}

// ============================================================================
// The chain
// ============================================================================

function odysseyChain() {
	const strategies = new Map<string, bigint>(); // `${implementation}:${feePolicy}` -> id
	let nextId = 1n;
	const keyOf = (implementation: string, feePolicy: string) =>
		`${implementation.toLowerCase()}:${feePolicy.toLowerCase()}`;
	const computeAddress = (salt: string) => getAddress(`0x${keccak256(toHex(salt)).slice(-40)}`);
	const chain = createChain({
		call(to, data) {
			if (to === ADDRESSES.Deployer3) {
				const {args} = decodeFunctionData({abi: DEPLOYER3_ABI, data});
				return encodeAbiParameters([{type: 'address'}], [computeAddress(args[0] as string)]);
			}
			if (to === ADDRESSES.PositionRegistry) {
				const call = decodeFunctionData({abi: POSITION_REGISTRY_ABI, data});
				if (call.functionName === 'owner') return encodeAbiParameters([{type: 'address'}], [SAFE]);
				if (call.functionName === 'getStrategyId') {
					const [implementation, feePolicy] = call.args;
					return encodeAbiParameters([{type: 'uint256'}], [strategies.get(keyOf(implementation, feePolicy)) ?? 0n]);
				}
			}
			return undefined;
		},
		onTransaction(tx) {
			if (!tx.to || !tx.data) return;
			if (tx.to.toLowerCase() === ADDRESSES.Deployer3) {
				const {args} = decodeFunctionData({abi: DEPLOYER3_ABI, data: tx.data});
				chain.setCode(computeAddress(args[0] as string));
			}
			if (tx.to.toLowerCase() === ADDRESSES.PositionRegistry) {
				const call = decodeFunctionData({abi: POSITION_REGISTRY_ABI, data: tx.data});
				if (call.functionName === 'addStrategy') strategies.set(keyOf(call.args[0], call.args[1]), nextId++);
				if (call.functionName === 'updateImplementation') {
					for (const [key, id] of strategies) {
						if (id === call.args[0]) {
							strategies.delete(key);
							strategies.set(keyOf(call.args[1], key.split(':')[1]), id);
						}
					}
				}
			}
		},
	});
	return chain;
}

/** `npx hardhat deploy --network optimism`. */
const OPTIMISM = {accounts, nodeAccounts: [DEPLOYER], environmentName: 'optimism', chainId: 10};

/** The core and components scripts already ran: the registry, `AaveV3`, the fee policy, `Deployer3`. */
async function afterCoreAndComponents(): Promise<World> {
	const world = createWorld(odysseyChain());
	const {env} = await run(world, OPTIMISM);
	const record = (name: string, artifact: Artifact, address: string) =>
		env.save(name, {...artifact, address: address as `0x${string}`, argsData: '0x'});
	await record('Deployer3', artifacts.Deployer3, ADDRESSES.Deployer3);
	await record(REGISTRY, artifacts.PositionRegistry, ADDRESSES.PositionRegistry);
	await record('AaveV3', artifacts.AaveV3, ADDRESSES.AaveV3);
	await record(
		'PerformanceFeePolicy_1000_0_0',
		artifacts.PerformanceFeePolicy,
		ADDRESSES.PerformanceFeePolicy_1000_0_0,
	);
	return world;
}

async function deployRun(world: World, nonce?: number) {
	const result = await run(world, OPTIMISM);
	const batch: CaughtUnknownSignerTransaction[] = [];
	const proposals: CaughtUnknownSignerTransaction[][] = [];
	await aaveV3BorrowStrategy(batch, nonce)(result.env);
	await safeTxs(batch, (txs) => proposals.push(txs))(result.env);
	return {...result, batch, proposals};
}

const registryCall = (functionName: 'addStrategy' | 'updateImplementation', args: readonly unknown[]) =>
	encodeFunctionData({abi: POSITION_REGISTRY_ABI, functionName, args} as Parameters<typeof encodeFunctionData>[0]);

// ============================================================================
// The tests
// ============================================================================

describe('ported: Odyssey strategy deployment (Safe-gated create3 factory, registry-held implementation)', () => {
	it('run 1: the deployer deploys the strategy through Deployer3, and registering it is batched for the Safe', async () => {
		const world = await afterCoreAndComponents();
		const {env, provider, batch, proposals} = await deployRun(world);

		const implementation = env.get('AaveV3BorrowStrategy').address;
		// recorded at the address the factory computes for the salt (what `computeAddress` answered)
		expect(implementation).toBe(
			getAddress(`0x${keccak256(toHex('finance.odyssey.AaveV3BorrowStrategyV10')).slice(-40)}`),
		);
		expect(sent(provider)).toEqual([
			{
				from: DEPLOYER,
				to: ADDRESSES.Deployer3,
				data: encodeFunctionData({
					abi: DEPLOYER3_ABI,
					functionName: 'deploy',
					args: [
						'finance.odyssey.AaveV3BorrowStrategyV10',
						encodeDeployData({
							abi: STRATEGY_ABI,
							bytecode: artifacts.AaveV3BorrowStrategy.bytecode,
							args: [ADDRESSES.AaveV3],
						}),
					],
				}),
			},
		]);
		expect(batch).toStrictEqual([
			{
				from: SAFE,
				to: ADDRESSES.PositionRegistry,
				value: undefined,
				data: registryCall('addStrategy', [implementation, ADDRESSES.PerformanceFeePolicy_1000_0_0]),
			},
		]);
		expect(proposals).toStrictEqual([batch]);
	});

	it('run 2, after the Safe executed the batch: the record is reused and nothing is sent or batched', async () => {
		const world = await afterCoreAndComponents();
		const first = await deployRun(world);
		for (const tx of first.proposals[0]) world.chain.execute(tx);

		const second = await deployRun(world);

		expect(second.batch).toEqual([]);
		expect(sent(second.provider)).toEqual([]);
	});

	it('a new strategy version with its nonce bumped: deployed at the new salt, and the registry move batched for the Safe', async () => {
		const world = await afterCoreAndComponents();
		const first = await deployRun(world);
		for (const tx of first.proposals[0]) world.chain.execute(tx);

		const original = artifacts.AaveV3BorrowStrategy;
		artifacts.AaveV3BorrowStrategy = withCode('AaveV3BorrowStrategy', STRATEGY_ABI, 'd5');
		try {
			const next = await deployRun(world, 11);
			const v2 = next.env.get('AaveV3BorrowStrategy').address;
			expect(v2).not.toBe(first.env.get('AaveV3BorrowStrategy').address);
			expect(next.batch).toStrictEqual([
				{
					from: SAFE,
					to: ADDRESSES.PositionRegistry,
					value: undefined,
					data: registryCall('updateImplementation', [1n, v2]),
				},
			]);
		} finally {
			artifacts.AaveV3BorrowStrategy = original;
		}
	});

	it('a new strategy version WITHOUT the nonce bump: refused by the helper, before anything is sent', async () => {
		const world = await afterCoreAndComponents();
		const first = await deployRun(world);
		for (const tx of first.proposals[0]) world.chain.execute(tx);

		const original = artifacts.AaveV3BorrowStrategy;
		artifacts.AaveV3BorrowStrategy = withCode('AaveV3BorrowStrategy', STRATEGY_ABI, 'd5');
		try {
			const {env, provider} = await run(world, OPTIMISM);
			await expect(aaveV3BorrowStrategy([], 10)(env)).rejects.toThrow("bump this contract's nonce");
			expect(sent(provider)).toEqual([]);
		} finally {
			artifacts.AaveV3BorrowStrategy = original;
		}
	});
});

// ============================================================================
// An OpenZeppelin 5 transparent proxy, whose admin the proxy creates
// ============================================================================

/** OpenZeppelin 5's `TransparentUpgradeableProxy(logic, initialOwner, data)`: no public functions. */
const TUP_V5_ABI = [
	{
		type: 'constructor',
		inputs: [
			{type: 'address', name: '_logic'},
			{type: 'address', name: 'initialOwner'},
			{type: 'bytes', name: '_data'},
		],
		stateMutability: 'payable',
	},
] as const satisfies Abi;
/** OpenZeppelin 5's `ProxyAdmin`: `owner()` and `upgradeAndCall` only (no `upgrade`). */
const PROXY_ADMIN_V5_ABI = [
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
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
const REGISTRY_IMPL_ABI = [
	{type: 'function', name: 'initialize', inputs: [], outputs: [], stateMutability: 'nonpayable'},
] as const satisfies Abi;
const v5 = {
	TransparentUpgradeableProxy: withCode('TransparentUpgradeableProxy', TUP_V5_ABI, 'f1'),
	ProxyAdmin: withCode('ProxyAdmin', PROXY_ADMIN_V5_ABI, 'f2'),
	PositionRegistry: withCode('PositionRegistry', REGISTRY_IMPL_ABI, 'f3'),
	PositionRegistryV2: withCode('PositionRegistry', REGISTRY_IMPL_ABI, 'f4'),
};
/** The address the v5 proxy constructor gives the `ProxyAdmin` it creates. */
const CREATED_PROXY_ADMIN = '0x3f6da0a118b3a0ddfdbab4690cc96b2cf73b488d';

/**
 * A chain where deploying the v5 proxy does what its constructor does: point the
 * implementation slot at `_logic` and create a ProxyAdmin, owned by the Safe, whose address
 * it writes into the admin slot (`_admin = address(new ProxyAdmin(initialOwner))`).
 */
function v5Chain() {
	const chain: ReturnType<typeof createChain> = createChain({
		call(to, data) {
			if (to === CREATED_PROXY_ADMIN && data.startsWith('0x8da5cb5b')) {
				return encodeAbiParameters([{type: 'address'}], [SAFE]);
			}
			return undefined;
		},
		onTransaction(tx) {
			const creationCode = v5.TransparentUpgradeableProxy.bytecode;
			if (!tx.createdAddress || !tx.data?.startsWith(creationCode)) return;
			const logic = `0x${tx.data.slice(creationCode.length + 24, creationCode.length + 64)}`;
			chain.setAddress(tx.createdAddress, IMPLEMENTATION_SLOT, logic);
			chain.setAddress(tx.createdAddress, ADMIN_SLOT, CREATED_PROXY_ADMIN);
			chain.setCode(CREATED_PROXY_ADMIN);
		},
	});
	return chain;
}

/**
 * The registry behind an OpenZeppelin 5 proxy, deployed through `deployViaProxy`, with the
 * same options on every run. `createsProxyAdmin: false` is the v1-era shape: a plain `custom`
 * proxy, with no record of the admin it created.
 */
function registryViaV5Proxy(
	artifact: Artifact<typeof REGISTRY_IMPL_ABI>,
	out: {deferred?: CaughtUnknownSignerTransaction | null},
	{createsProxyAdmin = true}: {createsProxyAdmin?: boolean} = {},
) {
	return deployScript(async ({deployViaProxy, catchUnknownSigner, namedAccounts}) => {
		const {owner, deployer} = namedAccounts as {owner: `0x${string}`; deployer: `0x${string}`};
		out.deferred = await catchUnknownSigner(() =>
			deployViaProxy(
				REGISTRY,
				{account: deployer, artifact, args: []},
				{
					owner,
					proxyContract: createsProxyAdmin
						? {
								type: 'custom',
								artifact: v5.TransparentUpgradeableProxy,
								createsProxyAdmin: true,
								proxyAdminArtifact: v5.ProxyAdmin,
							}
						: {type: 'custom', artifact: v5.TransparentUpgradeableProxy},
					execute: {init: 'initialize'},
				},
			),
		);
	});
}

describe('An OpenZeppelin 5 transparent proxy (Odyssey `helpers/deploy3.ts:40-137`) through deployViaProxy', () => {
	it('one call, same options: deploys the proxy, records the ProxyAdmin it created, and defers the upgrade to the Safe', async () => {
		/**
		 * `createsProxyAdmin: true` tells `deployViaProxy` that the proxy's constructor creates
		 * its admin: the owner (the Safe) goes to the constructor as `initialOwner`, and the
		 * created ProxyAdmin is read from the admin slot and recorded as `<name>_ProxyAdmin`.
		 * The upgrade then goes to that ProxyAdmin as `upgradeAndCall` (the proxy has no
		 * `upgradeTo`), from the Safe that owns it, so it is deferred. Odyssey's v1 helper did
		 * the same by hand, with different code on the first deploy and on later ones.
		 */
		const world = createWorld(v5Chain());
		const first = await run(world, OPTIMISM);
		await registryViaV5Proxy(v5.PositionRegistry, {})(first.env);
		const proxy = first.env.get(`${REGISTRY}_Proxy`).address;
		expect(first.env.get(`${REGISTRY}_ProxyAdmin`).address.toLowerCase()).toBe(CREATED_PROXY_ADMIN);
		// the constructor got the Safe as `initialOwner`; no ProxyAdmin was deployed by rocketh
		expect(first.env.get(`${REGISTRY}_Proxy`).argsData.toLowerCase()).toContain(SAFE.slice(2).toLowerCase());
		expect(sent(first.provider).some((tx) => tx.data?.startsWith(v5.ProxyAdmin.bytecode))).toBe(false);

		const {env} = await run(world, OPTIMISM);
		const out: {deferred?: CaughtUnknownSignerTransaction | null} = {};
		await registryViaV5Proxy(v5.PositionRegistryV2, out)(env);

		expect(out.deferred).toStrictEqual({
			from: SAFE,
			to: CREATED_PROXY_ADMIN,
			// `deployViaProxy` sends `upgradeAndCall` with an explicit zero value
			value: '0x0',
			data: encodeFunctionData({
				abi: PROXY_ADMIN_V5_ABI,
				functionName: 'upgradeAndCall',
				args: [proxy, env.get(`${REGISTRY}_Implementation`).address, '0x'],
			}),
		});
	});

	it('a proxy deployed without the record (the v1-era shape) gets it on the next run, and its upgrade is deferred the same way', async () => {
		/**
		 * A project migrating from v1 has proxies whose ProxyAdmin rocketh never recorded.
		 * Adding `createsProxyAdmin` is enough: the next run reads the admin slot, records the
		 * admin, and the upgrade proceeds as above.
		 */
		const world = createWorld(v5Chain());
		const first = await run(world, OPTIMISM);
		await registryViaV5Proxy(v5.PositionRegistry, {}, {createsProxyAdmin: false})(first.env);
		const proxy = first.env.get(`${REGISTRY}_Proxy`).address;
		expect(first.env.getOrNull(`${REGISTRY}_ProxyAdmin`)).toBeNull();

		const {env} = await run(world, OPTIMISM);
		const out: {deferred?: CaughtUnknownSignerTransaction | null} = {};
		await registryViaV5Proxy(v5.PositionRegistryV2, out)(env);

		expect(env.get(`${REGISTRY}_ProxyAdmin`).address.toLowerCase()).toBe(CREATED_PROXY_ADMIN);
		expect(out.deferred).toStrictEqual({
			from: SAFE,
			to: CREATED_PROXY_ADMIN,
			value: '0x0',
			data: encodeFunctionData({
				abi: PROXY_ADMIN_V5_ABI,
				functionName: 'upgradeAndCall',
				args: [proxy, env.get(`${REGISTRY}_Implementation`).address, '0x'],
			}),
		});
	});

	it('without `createsProxyAdmin`, the upgrade is refused: the admin slot holds the created ProxyAdmin, not the owner', async () => {
		/**
		 * A plain `custom` proxy compares the admin slot with the OWNER. That is right for a
		 * proxy that takes its admin as a constructor argument, and is why an OpenZeppelin 5
		 * proxy needs the flag.
		 */
		const world = createWorld(v5Chain());
		const first = await run(world, OPTIMISM);
		await registryViaV5Proxy(v5.PositionRegistry, {}, {createsProxyAdmin: false})(first.env);

		const {env} = await run(world, OPTIMISM);
		await expect(registryViaV5Proxy(v5.PositionRegistryV2, {}, {createsProxyAdmin: false})(env)).rejects.toThrow(
			`To change owner/admin, you need to call the proxy directly, it currently is ${CREATED_PROXY_ADMIN}`,
		);
	});
});
