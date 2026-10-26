/**
 * PORTED PROTOCOL SCRIPT 2 of 3: Vesper's pool upgrade, from
 * https://github.com/vesperfi/vesper-contracts @ 5f23bd54f8408cdf5ed5251faa70b4888e03c5d3
 * (`vesper-deployments/`, read 2026-10-26; the archived `vesperfi/vesper-pools` @ a57e06c has
 * the same `deploy/upgrade-pool.js` shape). The finding:
 * `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md`.
 *
 * WHY THIS SCRIPT. `vesper-deployments/deploy/upgrade-pool.js` is where Vesper's governance
 * shows: each pool and its `PoolAccountant` sit behind an OpenZeppelin 4 transparent proxy
 * whose admin is an "Upgrader" (`vesper-pools/contracts/upgraders/UpgraderBase.sol`, a
 * `ProxyAdmin` with a storage-checking `safeUpgrade(proxy, implementation)`), and the script
 * reads WHO OWNS THAT UPGRADER on chain: the deployer upgrades directly, the Safe gets the
 * calls batched into ONE MultiSend proposal posted to the Safe transaction service. It never
 * uses `catchUnknownSigner`; it branches on the owner instead.
 *
 * THE v1 ORIGINAL, excerpted verbatim (MIT licensed; notice below). `safeUpgrade`
 * (`deploy/upgrade-pool.js:68-128`):
 *
 * ```js
 *   const proxy = await deployments.get(contract)
 *
 *   // Deployment may not exist so keep using ethers.getContractAt. DO NOT use read()
 *   const upgrader = await ethers.getContractAt(upgraderName, await getProxyAdminAddress(proxy.address))
 *   const upgraderOwner = await upgrader.owner()
 *   ...
 *     deployedImpl = await deploy(`${contract}_Implementation`, {
 *       contract,
 *       from: deployer,
 *       log: true,
 *       args: params,
 *     })
 *   ...
 *   const txnsToPropose = []
 *   if (deployer === upgraderOwner) {
 *     console.log(`Deployer is owner of upgrader. Safe upgrading ${contract} via ${upgraderName}`)
 *     await execute(upgraderName, { from: deployer, log: true }, 'safeUpgrade', proxy.address, deployedImpl.address)
 *   } else if (safe === upgraderOwner) {
 *     console.log(`MultiSig is owner of upgrader. Preparing safeUpgrade of ${contract} via ${upgraderName}`)
 *     const txn = await prepareTxn(upgraderName, upgrader.address, 'safeUpgrade', [proxy.address, deployedImpl.address])
 *     txnsToPropose.push(txn)
 *   } else {
 *     throw new Error('Deployer is neither owner nor a delegate')
 *   }
 *
 *   return txnsToPropose
 * ```
 *
 * and the script itself (`:130-152`):
 *
 * ```js
 * const deployFunction = async function (hre) {
 *   const { getNamedAccounts, poolConfig, targetChain, multisigNonce } = hre
 *   ...
 *   const txnsToPropose = []
 *   let txs = await safeUpgrade(hre, deployer, PoolAccountant)
 *   txnsToPropose.push(...txs)
 *   ...
 *   txs = await safeUpgrade(hre, deployer, poolConfig.contractName, [
 *     'Vesper Pool',
 *     'vPool',
 *     ethers.constants.AddressZero,
 *   ])
 *   txnsToPropose.push(...txs)
 *   if (txnsToPropose.length > 0) {
 *     await proposeMultiTxn(address.MultiSig.safe, targetChain, deployer, multisigNonce, txnsToPropose)
 *   }
 *   deployFunction.id = 'upgrade-pool'
 *   return true
 * }
 * ```
 *
 * `poolConfig`, `targetChain` and `multisigNonce` are not hardhat-deploy: the custom task
 * `deploy-core-contracts` (`tasks/deploy-core-contracts.js`) sets them on `hre` from its own
 * CLI flags (`--pool`, `--target-chain`, `--multisig-nonce`) and then calls
 * `run('deploy', deployParams)`, with any hardhat-deploy flag (`--gasprice` included) passed
 * through `--deploy-params '{...}'`.
 *
 * WHAT THE PORT CHANGES, AND WHY.
 * - The owner branch becomes ONE `deployViaProxy` with `owner` set to the owner READ ON CHAIN,
 *   the Upgrader named as the admin (`proxyAdminName`), and the Upgrader's own entry point
 *   (`upgradeFunction: {methodName: 'safeUpgrade', args: ['{proxy}', '{implementation}']}`).
 *   When the deployer owns the Upgrader the call broadcasts; when the Safe does, it is
 *   unsignable and `catchUnknownSigner` hands it back. The branch is the signability check.
 * - v1 found the Upgrader by reading the proxy's EIP-1967 admin slot. rocketh takes it by
 *   NAME and refuses to upgrade when the slot disagrees
 *   (`packages/rocketh-proxy/src/index.ts:604-611`), which is the same check made loudly.
 * - `hre.poolConfig` / `hre.multisigNonce` become `env.extra`, the run parameter a wrapper
 *   passes to `loadAndExecuteDeploymentsFromFiles({..., extra})`
 *   (`ExecutionParams.extra`, `packages/rocketh-core/src/types.ts`).
 * - `deployFunction.id = 'upgrade-pool'; return true` is NOT ported. v1 checks `func.id`
 *   BEFORE running a script (hardhat-deploy v1 `src/DeploymentsManager.ts:1186`), and this id
 *   is only assigned DURING the run, so in a fresh process v1 never skipped the script on it;
 *   it only wrote `.migrations.json`. A rocketh `id` is static, and `return true` after a
 *   deferred upgrade would record the script as done with the upgrade still owed
 *   (`documentation/script-lifecycle/index.md`). The port returns nothing.
 * - The Safe-delegate check (`isDelegateOrOwner`, a Safe service request), the
 *   `.versionInfo.json` implementation reuse and `hre.run('verify')` are not ported: they
 *   are project tooling around the deploy, not deployment behaviour.
 * - `proposeMultiTxn` (MultiSend + Safe service, `deploy/gnosis-txn.js:143-154`) stays the
 *   project's: `propose` below receives exactly the `{to, value, data}` list it encodes.
 *
 * ---------------------------------------------------------------------------------------
 * The v1 excerpts above are from Vesper, used under its licence:
 *
 * MIT License
 *
 * Copyright (c) 2024 Vesper Brewing Co Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ---------------------------------------------------------------------------------------
 */

import {describe, it, expect} from 'vitest';
import {decodeFunctionData, encodeAbiParameters, encodeFunctionData, zeroAddress} from 'viem';
import type {Abi, Artifact} from '@rocketh/core/types';
import {createMockArtifact} from '@rocketh/test-utils';
import type {ProxyDeployOptions} from '@rocketh/proxy';

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
/** `vesper-commons/config/mainnet/address.js:148`, `MultiSig.safe`. */
const SAFE = '0x9520b477aa81180e6ddc006fc09fb6d3eb4e807a' as `0x${string}`;

/** v1: `namedAccounts: {deployer}` plus `Address.MultiSig.safe` from the config package. */
const accounts = {deployer: 0, safe: SAFE} as const;

const POOL_ABI = [
	{
		type: 'constructor',
		inputs: [
			{type: 'string', name: 'name_'},
			{type: 'string', name: 'symbol_'},
			{type: 'address', name: 'token_'},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'initialize',
		inputs: [
			{type: 'string', name: 'name_'},
			{type: 'string', name: 'symbol_'},
			{type: 'address', name: 'token_'},
			{type: 'address', name: 'poolAccountant_'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const POOL_ACCOUNTANT_ABI = [
	{
		type: 'function',
		name: 'init',
		inputs: [{type: 'address', name: 'pool_'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** `UpgraderBase.sol`: an OpenZeppelin 4 `ProxyAdmin` plus `safeUpgrade`. */
const UPGRADER_ABI = [
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'safeUpgrade',
		inputs: [
			{type: 'address', name: '_proxy'},
			{type: 'address', name: '_implementation'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
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

function withCode<TAbi extends Abi>(name: string, abi: TAbi, marker: string): Artifact<TAbi> {
	const base = createMockArtifact(name, abi);
	return {
		...base,
		bytecode: `${base.bytecode}${marker}` as `0x${string}`,
		deployedBytecode: `${base.deployedBytecode}${marker}` as `0x${string}`,
	};
}

const artifacts = {
	VETH: withCode('VETH', POOL_ABI, 'a1'),
	PoolAccountant: withCode('PoolAccountant', POOL_ACCOUNTANT_ABI, 'a2'),
	VPoolUpgrader: withCode('VPoolUpgrader', UPGRADER_ABI, 'a3'),
	PoolAccountantUpgrader: withCode('PoolAccountantUpgrader', UPGRADER_ABI, 'a4'),
};
/** The sources after the change being shipped: different code, same ABI. */
const recompiled = {
	VETH: withCode('VETH', POOL_ABI, 'b1'),
	PoolAccountant: withCode('PoolAccountant', POOL_ACCOUNTANT_ABI, 'b2'),
};

/** `vesper-commons/config/mainnet/poolConfig.js:21-26`, the part the upgrade reads. */
const POOL_CONFIG = {VETH: {contractName: 'VETH' as const, poolParams: ['vETH Pool', 'vETH', zeroAddress] as const}};

/** v1's `hre.poolConfig` / `hre.multisigNonce`, set by the wrapper task: here, `env.extra`. */
type Extra = {pool: keyof typeof POOL_CONFIG; multisigNonce?: number};
function runParameters(env: ScriptEnvironment): Extra {
	return env.extra as Extra;
}

// ============================================================================
// The ported scripts
// ============================================================================

/**
 * `deploy/deploy-vpool.js`, the part that put the pool behind its Upgrader (setup only). v1
 * passed `skipIfAlreadyDeployed: true` on the pool's proxy deploy, so that script never
 * upgrades an existing pool; `upgradeIndex: 0` ("step 0 only") is the rocketh spelling of
 * that, pinned in the last test.
 */
const deployVPool = deployScript(async (env) => {
	const {deployViaProxy, namedAccounts} = env;
	const {deployer} = namedAccounts as {deployer: `0x${string}`};
	const poolConfig = POOL_CONFIG[runParameters(env).pool];

	const accountantProxy = await deployViaProxy(
		'PoolAccountant',
		{account: deployer, artifact: artifacts.PoolAccountant, args: []},
		{proxyContract: {type: 'SharedAdminOpenZeppelinTransparentProxy', proxyAdminName: 'PoolAccountantUpgrader'}},
	);
	await deployViaProxy(
		poolConfig.contractName,
		{account: deployer, artifact: artifacts.VETH, args: ['Vesper pool', 'vPool', zeroAddress]},
		{
			upgradeIndex: 0, // v1: `skipIfAlreadyDeployed: true`
			proxyContract: {type: 'SharedAdminOpenZeppelinTransparentProxy', proxyAdminName: 'VPoolUpgrader'},
			execute: {
				init: {methodName: 'initialize', args: [...poolConfig.poolParams, accountantProxy.address]},
			},
		},
	);
});

/** `safeUpgrade` (`deploy/upgrade-pool.js:68-128`), ported. Returns what the Safe must sign. */
async function safeUpgrade(
	env: ScriptEnvironment,
	contract: 'PoolAccountant' | 'VETH',
	params: readonly unknown[],
): Promise<CaughtUnknownSignerTransaction[]> {
	const {deployViaProxy, catchUnknownSigner, read, get, namedAccounts} = env;
	const {deployer, safe} = namedAccounts as {deployer: `0x${string}`; safe: `0x${string}`};
	const upgraderName = contract === 'VETH' ? 'VPoolUpgrader' : `${contract}Upgrader`;

	const upgraderOwner = (
		(await read(get<typeof UPGRADER_ABI>(upgraderName), {functionName: 'owner'})) as string
	).toLowerCase() as `0x${string}`;
	if (upgraderOwner !== deployer && upgraderOwner !== safe) {
		throw new Error('Deployer is neither owner nor a delegate');
	}

	const deferred = await catchUnknownSigner(
		() =>
			deployViaProxy(
				contract,
				{account: deployer, artifact: artifacts[contract] as Artifact, args: [...params]},
				{
					owner: upgraderOwner,
					proxyContract: {type: 'SharedAdminOpenZeppelinTransparentProxy', proxyAdminName: upgraderName},
					upgradeFunction: {methodName: 'safeUpgrade', args: ['{proxy}', '{implementation}']},
				},
			),
		{log: false},
	);
	return deferred ? [deferred] : [];
}

/**
 * `deploy/upgrade-pool.js`, ported. `propose` stands in for `proposeMultiTxn` (MultiSend of
 * the list, posted to the Safe transaction service at `nonce`).
 */
function upgradePool(propose: (safe: `0x${string}`, txs: CaughtUnknownSignerTransaction[], nonce?: number) => void) {
	return deployScript(async (env) => {
		const {pool, multisigNonce} = runParameters(env);
		const poolConfig = POOL_CONFIG[pool];
		const {safe} = env.namedAccounts as {safe: `0x${string}`};

		const txnsToPropose: CaughtUnknownSignerTransaction[] = [];
		txnsToPropose.push(...(await safeUpgrade(env, 'PoolAccountant', [])));
		txnsToPropose.push(...(await safeUpgrade(env, poolConfig.contractName, ['Vesper Pool', 'vPool', zeroAddress])));
		if (txnsToPropose.length > 0) {
			propose(safe, txnsToPropose, multisigNonce);
		}
		// v1: `deployFunction.id = 'upgrade-pool'; return true`. Not ported: see the header.
	});
}

// ============================================================================
// The chain
// ============================================================================

function vesperChain() {
	const owners = new Map<string, `0x${string}`>();
	return {
		owners,
		chain: createChain({
			call(to, data) {
				const {functionName} = decodeFunctionData({abi: UPGRADER_ABI, data});
				if (functionName === 'owner') {
					return encodeAbiParameters([{type: 'address'}], [owners.get(to) ?? DEPLOYER]);
				}
				return undefined;
			},
		}),
	};
}

/** `npm run deploy -- --pool VETH --network mainnet ... --multisig-nonce 42`. */
function mainnet(extra: Extra) {
	return {accounts, nodeAccounts: [DEPLOYER], environmentName: 'mainnet', chainId: 1, executionParams: {extra}};
}

/**
 * The world `upgrade-pool` starts from: the Upgraders deployed by the deployer, the pool and
 * its accountant deployed behind them by `deploy-vpool`, and, unless `upgradersOwnedBy` says
 * otherwise, the Upgraders' ownership handed to the Safe (a manual step Vesper audits with
 * its `verify-admin` task, `tasks/verify-admin.js`).
 */
async function afterDeployVPool(upgradersOwnedBy: `0x${string}` = SAFE) {
	const {chain, owners} = vesperChain();
	const world: World = createWorld(chain);
	const {env} = await run(world, mainnet({pool: 'VETH'}));
	const vPoolUpgrader = await env.save('VPoolUpgrader', {
		...artifacts.VPoolUpgrader,
		address: '0x000000000000000000000000000000000000a0a3',
		argsData: '0x',
	});
	const accountantUpgrader = await env.save('PoolAccountantUpgrader', {
		...artifacts.PoolAccountantUpgrader,
		address: '0x000000000000000000000000000000000000a0a4',
		argsData: '0x',
	});
	await deployVPool(env);
	chain.constructProxies(env, ['PoolAccountant', 'VETH']);
	owners.set(vPoolUpgrader.address, upgradersOwnedBy);
	owners.set(accountantUpgrader.address, upgradersOwnedBy);
	return {world, env, upgraders: {VETH: vPoolUpgrader.address, PoolAccountant: accountantUpgrader.address}};
}

const safeUpgradeData = (proxy: string, implementation: string) =>
	encodeFunctionData({
		abi: UPGRADER_ABI,
		functionName: 'safeUpgrade',
		args: [proxy as `0x${string}`, implementation as `0x${string}`],
	});

async function shipRecompiledSources<T>(body: () => Promise<T>): Promise<T> {
	const original = {VETH: artifacts.VETH, PoolAccountant: artifacts.PoolAccountant};
	Object.assign(artifacts, recompiled);
	try {
		return await body();
	} finally {
		Object.assign(artifacts, original);
	}
}

// ============================================================================
// The tests
// ============================================================================

describe('ported: Vesper pool upgrade (Upgrader owner read on chain, one MultiSend proposal)', () => {
	it('the Safe owns the Upgraders: both `safeUpgrade` calls come back as ONE proposal, at the nonce the run was given', async () => {
		const {world, env: before, upgraders} = await afterDeployVPool();
		await shipRecompiledSources(async () => {
			const {env, provider} = await run(world, mainnet({pool: 'VETH', multisigNonce: 42}));
			const proposals: {safe: string; txs: CaughtUnknownSignerTransaction[]; nonce?: number}[] = [];

			await upgradePool((safe, txs, nonce) => proposals.push({safe, txs, nonce}))(env);

			const accountant = before.get('PoolAccountant').address;
			const pool = before.get('VETH').address;
			expect(proposals).toStrictEqual([
				{
					safe: SAFE,
					nonce: 42,
					txs: [
						{
							from: SAFE,
							to: upgraders.PoolAccountant,
							value: undefined,
							data: safeUpgradeData(accountant, env.get('PoolAccountant_Implementation').address),
						},
						{
							from: SAFE,
							to: upgraders.VETH,
							value: undefined,
							data: safeUpgradeData(pool, env.get('VETH_Implementation').address),
						},
					],
				},
			]);
			// the deployer shipped the two implementations; nothing was sent from the Safe
			expect(sent(provider).map((tx) => tx.from)).toEqual([DEPLOYER, DEPLOYER]);
		});
	});

	it('re-run after the Safe executed the proposal: the proxies already point at the new code, nothing is proposed', async () => {
		const {world} = await afterDeployVPool();
		await shipRecompiledSources(async () => {
			const first = await run(world, mainnet({pool: 'VETH'}));
			const proposals: CaughtUnknownSignerTransaction[][] = [];
			await upgradePool((_, txs) => proposals.push(txs))(first.env);
			for (const tx of proposals[0]) world.chain.execute(tx);

			const second = await run(world, mainnet({pool: 'VETH'}));
			const again: CaughtUnknownSignerTransaction[][] = [];
			await upgradePool((_, txs) => again.push(txs))(second.env);

			expect(again).toEqual([]);
			expect(sent(second.provider)).toEqual([]);
			expect(world.chain.readAddress(second.env.get('VETH').address, IMPLEMENTATION_SLOT)).toBe(
				second.env.get('VETH_Implementation').address.toLowerCase(),
			);
		});
	});

	it('the deployer still owns the Upgraders: the SAME script sends both `safeUpgrade` calls itself and proposes nothing', async () => {
		/** v1's `if (deployer === upgraderOwner)` branch, which rocketh reaches by signability. */
		const {world, upgraders} = await afterDeployVPool(DEPLOYER);
		await shipRecompiledSources(async () => {
			const {env, provider} = await run(world, mainnet({pool: 'VETH'}));
			const proposals: CaughtUnknownSignerTransaction[][] = [];

			await upgradePool((_, txs) => proposals.push(txs))(env);

			expect(proposals).toEqual([]);
			const upgrades = sent(provider).filter((tx) => tx.to === upgraders.VETH || tx.to === upgraders.PoolAccountant);
			expect(upgrades).toEqual([
				{
					from: DEPLOYER,
					to: upgraders.PoolAccountant,
					data: safeUpgradeData(env.get('PoolAccountant').address, env.get('PoolAccountant_Implementation').address),
				},
				{
					from: DEPLOYER,
					to: upgraders.VETH,
					data: safeUpgradeData(env.get('VETH').address, env.get('VETH_Implementation').address),
				},
			]);
		});
	});

	it('the Upgrader named in the script is not the proxy admin on chain: refused, where v1 read the slot', async () => {
		/**
		 * v1 resolved the Upgrader from the proxy's admin slot. rocketh takes it by name and
		 * checks the slot, so a stale record (an Upgrader replaced by `changeProxyAdmin`
		 * without updating the record) stops the run instead of upgrading through the wrong one.
		 */
		const {world, env: before} = await afterDeployVPool();
		world.chain.setAddress(before.get('VETH_Proxy').address, ADMIN_SLOT, '0x000000000000000000000000000000000000beef');
		await shipRecompiledSources(async () => {
			const {env} = await run(world, mainnet({pool: 'VETH'}));
			await expect(upgradePool(() => {})(env)).rejects.toThrow(
				'To change owner/admin, you need to call the proxy directly',
			);
		});
	});

	it('v1 `skipIfAlreadyDeployed` on a PROXY deploy does not compile in rocketh, so the port cannot carry it by accident', () => {
		/**
		 * `ProxyDeployOptions` omits it (`packages/rocketh-proxy/src/index.ts:116-119`). In v1
		 * the flag was handed to the IMPLEMENTATION deploy (hardhat-deploy v1 `src/helpers.ts:1211`,
		 * honoured at `:868-870`), so a recorded implementation was never redeployed and no
		 * upgrade could follow. "Never upgrade once deployed" is what `upgradeIndex: 0` says.
		 */
		const v1Options: ProxyDeployOptions = {
			// @ts-expect-error v1's `skipIfAlreadyDeployed` is not a `deployViaProxy` option: `upgradeIndex: 0` is
			skipIfAlreadyDeployed: true,
		};
		expect(v1Options).toBeDefined();
	});

	it('`deploy-vpool` re-run after a recompile leaves the pool alone: `upgradeIndex: 0` is v1 `skipIfAlreadyDeployed`', async () => {
		/**
		 * Same script, both sources changed, Upgraders still the deployer's. The accountant step
		 * (no option) upgrades as usual; the pool step (`upgradeIndex: 0`, v1
		 * `skipIfAlreadyDeployed: true`) hands back the existing deployment and deploys nothing,
		 * which is why Vesper upgrades pools only through `upgrade-pool`.
		 */
		const {world, env: before} = await afterDeployVPool(DEPLOYER);
		await shipRecompiledSources(async () => {
			const {env} = await run(world, mainnet({pool: 'VETH'}));

			await deployVPool(env);

			const pool = env.get('VETH').address;
			expect(env.get('VETH_Implementation').address).toBe(before.get('VETH_Implementation').address);
			expect(world.chain.readAddress(pool, IMPLEMENTATION_SLOT)).toBe(
				before.get('VETH_Implementation').address.toLowerCase(),
			);
			const accountant = env.get('PoolAccountant').address;
			expect(env.get('PoolAccountant_Implementation').address).not.toBe(
				before.get('PoolAccountant_Implementation').address,
			);
			expect(world.chain.readAddress(accountant, IMPLEMENTATION_SLOT)).toBe(
				env.get('PoolAccountant_Implementation').address.toLowerCase(),
			);
		});
	});
});
