/**
 * PORTED PROTOCOL SCRIPT 1 of 3: Metronome Synth's debt-token deployment, from
 * https://github.com/autonomoussoftware/metronome-synth-public @ 1852ce00751499beccf302d324687be3ad9bd27f
 * (read 2026-10-26). The finding: `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md`.
 *
 * WHY THIS SCRIPT. Every upgradeable Metronome contract goes through one helper,
 * `deployUpgradable` (`deploy/helpers/index.ts:104-189`), and every parameter change through
 * `updateParamIfNeeded` (`:196-273`). A Gnosis Safe (`GOVERNOR`, which `helpers/address.ts`
 * sets equal to `GNOSIS_SAFE_ADDRESS` on every chain) owns every proxy's admin contract and is
 * the `governor()` of every pool. So one debt-token script exercises the whole governance
 * pattern: a proxy behind a custom ProxyAdmin ("Upgrader") the Safe owns, ONE implementation
 * shared by many proxies (`implementationName`), Safe-only calls caught with
 * `catchUnknownSigner` and queued to a batch file, and a `runAtTheEnd` script
 * (`deploy/scripts/<chain>/99_multisig_txs.ts`) that proposes the batch to the Safe service.
 * `deploy/scripts/mainnet/pool1/26_msusd_debt_token.ts` and `27_mseth_debt_token.ts` are two
 * calls of `buildDebtTokenDeployFunction` (`deploy/helpers/index.ts:312-368`); this file ports
 * that builder and both scripts.
 *
 * THE v1 ORIGINAL, excerpted verbatim (Metronome Synth is MIT licensed; notice below). From
 * `deploy/helpers/index.ts`, `deployUpgradable`:
 *
 * ```ts
 *   const owner = hre.network.name == 'hardhat' ? deployer : GOVERNOR
 *   const implementationName = alias === contract ? undefined : contract
 *
 *   const deployFunction = () =>
 *     deploy(alias, {
 *       contract,
 *       from: deployer,
 *       log: true,
 *       proxy: {
 *         owner,
 *         proxyContract: 'OpenZeppelinTransparentProxy',
 *         viaAdminContract: adminContract,
 *         implementationName: contract.match(/Pool.sol/) ? 'Pool' : implementationName,
 *         execute: {
 *           init: {
 *             methodName: 'initialize',
 *             args: initializeArgs,
 *           },
 *         },
 *       },
 *     })
 *
 *   const multiSigDeployTx = await catchUnknownSigner(deployFunction, {log: true})
 *   ...
 *   if (multiSigDeployTx) {
 *     if (force) {
 *       await executeForcedTxUsingMultiSig(hre, multiSigDeployTx)
 *     } else {
 *       await saveForMultiSigBatchExecution(multiSigDeployTx)
 *     }
 *   }
 *   ...
 *   // Note: `hardhat-deploy` is partially not working when upgrading an implementation used by many proxies
 *   // because it deploys the new implementation, updates the deployment JSON files but isn't properly calling `upgrade()`
 *   // See more: https://github.com/wighawag/hardhat-deploy/issues/284#issuecomment-1139971427
 *   const usesManyProxies = [ 'DepositToken', 'DebtToken', 'SyntheticToken', ... ].includes(contract)
 *
 *   if (usesManyProxies) {
 *     const actualImpl = await read(adminContract, 'getProxyImplementation', address)
 *     if (getAddress(actualImpl) !== getAddress(implementationAddress!)) {
 *       const multiSigUpgradeTx = await catchUnknownSigner(
 *         execute(adminContract, {from: GOVERNOR, log: true}, 'upgrade', address, implementationAddress),
 *         {log: true}
 *       )
 *       if (multiSigUpgradeTx) {
 *         await saveForMultiSigBatchExecution(multiSigUpgradeTx)
 *       }
 *     }
 *   }
 * ```
 *
 * and `updateParamIfNeeded`, which reads the governor ON CHAIN and sends from it:
 *
 * ```ts
 *     if (!isCurrentValueUpdated(currentValue, writeArgs)) {
 *       const governor = contractAlias.match(/^Pool\d+$/)
 *         ? await read(contractAlias, 'governor')
 *         : await read(PoolRegistry, 'governor')
 *       ...
 *       const multiSigTx = await catchUnknownSigner(doExecute, {log: true})
 *       if (multiSigTx) {
 *         if (force) {
 *           await executeForcedTxUsingMultiSig(hre, multiSigTx)
 *         } else {
 *           await saveForMultiSigBatchExecution(multiSigTx)
 *         }
 *       }
 *     }
 * ```
 *
 * `saveForMultiSigBatchExecution` (`deploy/helpers/safe.ts:104-132`) appends `{to, data, value}`
 * to `multisig.batch.tmp.json`, de-duplicated and refusing any `from` that is not the Safe;
 * `99_multisig_txs.ts` (`func.runAtTheEnd = true`) reads the file and proposes ONE Safe
 * transaction through `@safe-global/api-kit`, or on `hardhat`/`localhost` executes each entry
 * from the impersonated Safe (`deploy/helpers/safe.ts:28-36`). "Forced"
 * (`executeForcedTxUsingMultiSig`, `:135-142`) proposes everything so far and calls `exit()`.
 *
 * WHAT THE PORT CHANGES, AND WHY.
 * - `implementationName: 'DebtToken'` (one implementation record shared by every debt-token
 *   proxy) has no rocketh option: the record is always `<name>_Implementation`. The SHARING it
 *   bought is kept with `deterministicImplementation: true`: every debt token's
 *   implementation is the same creation code, so create2 lands them on ONE address, and the
 *   second deploy finds code there and records it without broadcasting
 *   (`packages/rocketh-deploy/src/index.ts:771-791`). Pinned below.
 * - The `usesManyProxies` re-check is DROPPED. rocketh decides an upgrade per proxy, from that
 *   proxy's own EIP-1967 implementation slot (`packages/rocketh-proxy/src/index.ts:564-572`),
 *   so every proxy sharing the implementation is upgraded through its admin. Pinned below.
 * - `hre.network.name == 'hardhat' ? deployer : GOVERNOR` becomes a per-network named
 *   account, `governor: {default: 'deployer', mainnet: <the Safe>}`.
 * - The batch FILE becomes an in-run list (`forTheSafe`) read by the `runAtTheEnd` proposer, the
 *   shape `documentation/script-lifecycle/index.md#the-batch-proposer-what-runattheend-is-really-for`
 *   documents. rocketh persists nothing about a deferral; a project that wants v1's file
 *   writes it itself, as v1 projects already did.
 * - "Forced" is not ported: it exists to STOP the run until the Safe acts. In rocketh that is
 *   what NOT wrapping the call does: the default `onUnknownSigner: 'auto'` asks for the hash
 *   of the Safe transaction and continues the SAME run, or throws in CI.
 * - On `hardhat`/`localhost` v1 executed the batch from the impersonated Safe. A rocketh fork
 *   run impersonates the named Safe up front (`documentation/fork-runs/index.md`), so the
 *   calls execute in place and nothing is deferred; the last test pins that.
 *
 * ---------------------------------------------------------------------------------------
 * The v1 excerpts above, and the error messages the ported helpers below reuse, are from
 * Metronome Synth, used under its licence:
 *
 * MIT License
 *
 * Copyright (c) 2024 Autonomous Software
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
import {decodeFunctionData, encodeAbiParameters, encodeFunctionData, parseEther, toFunctionSelector} from 'viem';
import type {Abi, Artifact, Deployment} from '@rocketh/core/types';
import {createMockArtifact} from '@rocketh/test-utils';

import type {CaughtUnknownSignerTransaction} from '../../src/index.js';
import {createChain, createWorld, deployScript, run, sent, type ScriptEnvironment, type World} from './harness.js';

// ============================================================================
// The project: accounts and artifacts
// ============================================================================

const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** The mainnet Safe that is GOVERNOR and GNOSIS_SAFE_ADDRESS (`helpers/address.ts:60-61`). */
const SAFE = '0xd1de3f9cd4ae2f23da941a67ca4c739f8dd9af33' as `0x${string}`;

/** v1: `namedAccounts: {deployer}` plus `Address.GOVERNOR`, chosen by network name. */
const accounts = {
	deployer: 0,
	governor: {default: 'deployer', mainnet: SAFE},
} as const;

const DEBT_TOKEN_ABI = [
	{
		type: 'function',
		name: 'initialize',
		inputs: [
			{type: 'string', name: 'name_'},
			{type: 'string', name: 'symbol_'},
			{type: 'address', name: 'pool_'},
			{type: 'address', name: 'syntheticToken_'},
			{type: 'uint256', name: 'interestRate_'},
			{type: 'uint256', name: 'maxTotalSupply_'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{type: 'function', name: 'maxTotalSupply', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'updateMaxTotalSupply',
		inputs: [{type: 'uint256', name: 'newMaxTotalSupply_'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const POOL_ABI = [
	{type: 'function', name: 'governor', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'doesDebtTokenExist',
		inputs: [{type: 'address', name: 'debtToken_'}],
		outputs: [{type: 'bool'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'addDebtToken',
		inputs: [{type: 'address', name: 'debtToken_'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const POOL_REGISTRY_ABI = [
	{type: 'function', name: 'governor', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'idOfPool',
		inputs: [{type: 'address', name: 'pool_'}],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** `contracts/upgraders/UpgraderBase.sol`: an OpenZeppelin 4 `ProxyAdmin` with storage checks. */
const UPGRADER_ABI = [
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'upgrade',
		inputs: [
			{type: 'address', name: 'proxy_'},
			{type: 'address', name: 'implementation_'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'upgradeAndCall',
		inputs: [
			{type: 'address', name: 'proxy_'},
			{type: 'address', name: 'implementation_'},
			{type: 'bytes', name: 'data_'},
		],
		outputs: [],
		stateMutability: 'payable',
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

/** What `rocketh/deploy.ts` re-exports as `artifacts`. Swapped to model a recompile. */
const artifacts = {
	DebtToken: withCode('DebtToken', DEBT_TOKEN_ABI, 'd1'),
	Pool: withCode('Pool', POOL_ABI, 'e1'),
	PoolRegistry: withCode('PoolRegistry', POOL_REGISTRY_ABI, 'e2'),
	DebtTokenUpgrader: withCode('DebtTokenUpgrader', UPGRADER_ABI, 'e3'),
	SyntheticToken: withCode('SyntheticToken', [] as const satisfies Abi, 'e4'),
};
const DebtTokenV2 = withCode('DebtToken', DEBT_TOKEN_ABI, 'd2');

// ============================================================================
// The ported helpers (`deploy/helpers/index.ts`, `deploy/helpers/safe.ts`)
// ============================================================================

/** `UpgradableContracts.DebtToken` (`deploy/helpers/index.ts:68-93`), artifact made explicit. */
const DebtTokenConfig = {alias: '', adminContract: 'DebtTokenUpgrader'};
const PoolRegistry = 'PoolRegistry';

/**
 * `saveForMultiSigBatchExecution` + `prepareTx`: the batch, de-duplicated, Safe-only. A list
 * the `runAtTheEnd` proposer reads instead of `multisig.batch.tmp.json`.
 */
function saveForMultiSigBatchExecution(batch: CaughtUnknownSignerTransaction[], tx: CaughtUnknownSignerTransaction) {
	if (!tx.to || !tx.data) throw Error('The `to` and `data` args can not be null');
	if (tx.from.toLowerCase() !== SAFE) {
		throw Error(`Trying to propose a multi-sig transaction but sender ('${tx.from}') isn't the safe address.`);
	}
	if (!batch.some((i) => i.to === tx.to && i.data === tx.data && i.value === tx.value)) batch.push(tx);
}

async function deployUpgradable(
	env: ScriptEnvironment,
	batch: CaughtUnknownSignerTransaction[],
	{alias, adminContract, initializeArgs}: {alias: string; adminContract: string; initializeArgs: readonly unknown[]},
) {
	const {deployViaProxy, catchUnknownSigner, namedAccounts, get} = env;
	const {deployer, governor} = namedAccounts as {deployer: `0x${string}`; governor: `0x${string}`};

	const multiSigDeployTx = await catchUnknownSigner(
		() =>
			deployViaProxy(
				alias,
				{account: deployer, artifact: artifacts.DebtToken, args: []},
				{
					owner: governor,
					proxyContract: {type: 'SharedAdminOpenZeppelinTransparentProxy', proxyAdminName: adminContract},
					// v1 `implementationName: 'DebtToken'`: one implementation for every debt token
					deterministicImplementation: true,
					execute: {init: {methodName: 'initialize', args: [...initializeArgs]}},
				},
			),
		{log: true},
	);
	if (multiSigDeployTx) saveForMultiSigBatchExecution(batch, multiSigDeployTx);

	// v1's `usesManyProxies` re-check is not needed: see the header
	const {address, implementation: implementationAddress} = get(alias);
	return {address, implementationAddress};
}

type LooseRead = (d: Deployment<Abi>, args: {functionName: string; args?: readonly unknown[]}) => Promise<unknown>;
type LooseExecute = (
	d: Deployment<Abi>,
	args: {account: `0x${string}`; functionName: string; args?: readonly unknown[]},
) => Promise<unknown>;

async function updateParamIfNeeded(
	env: ScriptEnvironment,
	batch: CaughtUnknownSignerTransaction[],
	{
		contractAlias,
		readMethod,
		readArgs,
		writeMethod,
		writeArgs,
		isCurrentValueUpdated = (current, next) => String(current) === String(next?.[0]),
	}: {
		contractAlias: string;
		readMethod: string;
		readArgs?: readonly unknown[];
		writeMethod: string;
		writeArgs: readonly unknown[];
		isCurrentValueUpdated?: (current: unknown, next?: readonly unknown[]) => boolean;
	},
) {
	const read = env.read as unknown as LooseRead;
	const execute = env.execute as unknown as LooseExecute;
	const currentValue = await read(env.get(contractAlias), {functionName: readMethod, args: readArgs});
	if (!isCurrentValueUpdated(currentValue, writeArgs)) {
		// the governor is READ ON CHAIN, not a named account, exactly as in v1
		const governor = (await read(env.get(/^Pool\d+$/.test(contractAlias) ? contractAlias : PoolRegistry), {
			functionName: 'governor',
		})) as `0x${string}`;
		const multiSigTx = await env.catchUnknownSigner(
			() => execute(env.get(contractAlias), {account: governor, functionName: writeMethod, args: writeArgs}),
			{log: true},
		);
		if (multiSigTx) saveForMultiSigBatchExecution(batch, multiSigTx);
	}
}

/** `buildDebtTokenDeployFunction` (`deploy/helpers/index.ts:312-368`), ported. */
function buildDebtTokenDeployFunction(
	batch: CaughtUnknownSignerTransaction[],
	{
		poolAlias,
		name,
		symbol,
		interestRate,
		maxTotalSupply,
	}: {poolAlias: string; name: string; symbol: string; interestRate: bigint; maxTotalSupply: bigint},
) {
	const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
	const debtAlias = `${capitalize(symbol)}Debt_${poolAlias}`;
	const syntheticAlias = `${capitalize(symbol)}Synthetic`;

	return deployScript(async (env) => {
		const {get, read} = env;
		const {address: poolAddress} = get(poolAlias);
		const poolId = await read(get<typeof POOL_REGISTRY_ABI>(PoolRegistry), {
			functionName: 'idOfPool',
			args: [poolAddress],
		});
		const {address: syntheticTokenAddress} = get(syntheticAlias);

		const {address: debtTokenAddress} = await deployUpgradable(env, batch, {
			...DebtTokenConfig,
			alias: debtAlias,
			initializeArgs: [
				`${name}-Debt`,
				`${symbol}-Debt-${poolId}`,
				poolAddress,
				syntheticTokenAddress,
				interestRate,
				maxTotalSupply,
			],
		});

		await updateParamIfNeeded(env, batch, {
			contractAlias: poolAlias,
			readMethod: 'doesDebtTokenExist',
			readArgs: [debtTokenAddress],
			writeMethod: 'addDebtToken',
			writeArgs: [debtTokenAddress],
			isCurrentValueUpdated: (currentValue) => currentValue === true,
		});

		await updateParamIfNeeded(env, batch, {
			contractAlias: debtAlias,
			readMethod: 'maxTotalSupply',
			writeMethod: 'updateMaxTotalSupply',
			writeArgs: [maxTotalSupply],
		});
	});
}

/** `deploy/scripts/mainnet/pool1/26_msusd_debt_token.ts` and `27_mseth_debt_token.ts`. */
function debtTokenScripts(batch: CaughtUnknownSignerTransaction[], msUSDMaxTotalSupply = parseEther('7500000')) {
	return [
		buildDebtTokenDeployFunction(batch, {
			poolAlias: 'Pool1',
			name: 'Metronome Synth USD',
			symbol: 'msUSD',
			interestRate: parseEther('0.06'), // 6%
			maxTotalSupply: msUSDMaxTotalSupply,
		}),
		buildDebtTokenDeployFunction(batch, {
			poolAlias: 'Pool1',
			name: 'Metronome Synth ETH',
			symbol: 'msETH',
			interestRate: parseEther('0.04'), // 4%
			maxTotalSupply: parseEther('4000'),
		}),
	];
}

/**
 * `deploy/scripts/mainnet/99_multisig_txs.ts` (`runAtTheEnd`): propose the whole batch as one
 * Safe transaction. `propose` stands in for `@safe-global/api-kit`'s `proposeTransaction`.
 */
function multisigTxs(
	batch: CaughtUnknownSignerTransaction[],
	propose: (txs: CaughtUnknownSignerTransaction[]) => void,
) {
	return deployScript(async () => {
		if (batch.length > 0) propose([...batch]);
	});
}

// ============================================================================
// The chain: what the Metronome contracts answer
// ============================================================================

const ADDRESSES = {
	PoolRegistry: '0x11ead85c679eaf528c9c1fe094bf538db880048a',
	Pool1: '0x3364f53cb866762aef66deef2a6b1a17c1f17f46',
	DebtTokenUpgrader: '0x0000000000000000000000000000000000d0d0d0',
	MsUSDSynthetic: '0x0000000000000000000000000000000000005d01',
	MsETHSynthetic: '0x0000000000000000000000000000000000005d02',
} as const;

const ALL_ABIS = [...DEBT_TOKEN_ABI, ...POOL_ABI, ...POOL_REGISTRY_ABI, ...UPGRADER_ABI] as const;
const INITIALIZE_SELECTOR = toFunctionSelector('initialize(string,string,address,address,uint256,uint256)');

function metronomeChain() {
	const debtTokensInPool = new Set<string>();
	const maxTotalSupply = new Map<string, bigint>();
	const address = (value: string) => encodeAbiParameters([{type: 'address'}], [value as `0x${string}`]);

	return createChain({
		call(to, data) {
			const call = decodeFunctionData({abi: ALL_ABIS, data});
			switch (call.functionName) {
				case 'owner':
					return to === ADDRESSES.DebtTokenUpgrader ? address(SAFE) : undefined;
				case 'governor':
					return address(SAFE);
				case 'idOfPool':
					return encodeAbiParameters([{type: 'uint256'}], [1n]);
				case 'doesDebtTokenExist':
					return encodeAbiParameters([{type: 'bool'}], [debtTokensInPool.has(call.args[0].toLowerCase())]);
				case 'maxTotalSupply':
					return encodeAbiParameters([{type: 'uint256'}], [maxTotalSupply.get(to) ?? 0n]);
			}
			return undefined;
		},
		onTransaction(tx) {
			// a proxy constructor runs `initialize`, which sets `maxTotalSupply`
			if (tx.createdAddress && tx.data?.includes(INITIALIZE_SELECTOR.slice(2))) {
				const init = `0x${tx.data.slice(tx.data.indexOf(INITIALIZE_SELECTOR.slice(2)))}` as `0x${string}`;
				const {args} = decodeFunctionData({abi: DEBT_TOKEN_ABI, data: init});
				maxTotalSupply.set(tx.createdAddress.toLowerCase(), (args as readonly unknown[])[5] as bigint);
			}
			if (!tx.to || !tx.data) return;
			try {
				const call = decodeFunctionData({abi: ALL_ABIS, data: tx.data});
				if (call.functionName === 'addDebtToken') debtTokensInPool.add(call.args[0].toLowerCase());
				if (call.functionName === 'updateMaxTotalSupply') maxTotalSupply.set(tx.to.toLowerCase(), call.args[0]);
			} catch {
				// not a Metronome call
			}
		},
	});
}

/** The mainnet run: `npm run deploy -- --network mainnet`. */
const MAINNET = {accounts, nodeAccounts: [DEPLOYER], environmentName: 'mainnet', chainId: 1};

/**
 * What earlier scripts left on chain: the pool registry, Pool1, the two synthetic tokens and
 * the debt-token Upgrader, whose ownership `00_pre_upgraders.ts` handed to the Safe.
 */
async function afterEarlierScripts(): Promise<World> {
	const world = createWorld(metronomeChain());
	const {env} = await run(world, MAINNET);
	const record = (name: string, artifact: Artifact, address: string) =>
		env.save(name, {...artifact, address: address as `0x${string}`, argsData: '0x'});
	await record('PoolRegistry', artifacts.PoolRegistry, ADDRESSES.PoolRegistry);
	await record('Pool1', artifacts.Pool, ADDRESSES.Pool1);
	await record('MsUSDSynthetic', artifacts.SyntheticToken, ADDRESSES.MsUSDSynthetic);
	await record('MsETHSynthetic', artifacts.SyntheticToken, ADDRESSES.MsETHSynthetic);
	await record('DebtTokenUpgrader', artifacts.DebtTokenUpgrader, ADDRESSES.DebtTokenUpgrader);
	return world;
}

/** One `hardhat deploy` invocation: both debt-token scripts, then the `runAtTheEnd` proposer. */
async function deployRun(world: World, options: {msUSDMaxTotalSupply?: bigint; fork?: boolean} = {}) {
	const result = await run(world, {
		...MAINNET,
		executionParams: options.fork ? {autoImpersonate: true} : {},
	});
	const batch: CaughtUnknownSignerTransaction[] = [];
	const proposals: CaughtUnknownSignerTransaction[][] = [];
	for (const script of debtTokenScripts(batch, options.msUSDMaxTotalSupply)) await script(result.env);
	await multisigTxs(batch, (txs) => proposals.push(txs))(result.env);
	world.chain.constructProxies(result.env, ['MsUSDDebt_Pool1', 'MsETHDebt_Pool1']);
	return {...result, batch, proposals};
}

function call<TAbi extends Abi>(abi: TAbi, functionName: string, args: readonly unknown[]) {
	return encodeFunctionData({abi, functionName, args} as Parameters<typeof encodeFunctionData>[0]);
}

// ============================================================================
// The tests
// ============================================================================

describe('ported: Metronome Synth debt tokens (Safe-owned Upgrader, shared implementation, batched Safe calls)', () => {
	it('run 1: the deployer deploys both proxies behind the Safe-owned Upgrader, and the Safe-only calls are batched', async () => {
		/**
		 * The deployer can sign the proxy deployments (the Upgrader becomes their admin, the
		 * `initialize` call rides the constructor). Registering each debt token in Pool1 is a
		 * `governor`-only call, and the governor read on chain is the Safe, so both are caught,
		 * batched, and proposed ONCE by the `runAtTheEnd` script.
		 */
		const world = await afterEarlierScripts();
		const {env, provider, batch, proposals} = await deployRun(world);

		const msUSD = env.get('MsUSDDebt_Pool1').address.toLowerCase();
		const msETH = env.get('MsETHDebt_Pool1').address.toLowerCase();
		for (const proxy of [msUSD, msETH]) {
			expect(world.chain.readAddress(proxy, '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103')).toBe(
				ADDRESSES.DebtTokenUpgrader,
			);
		}
		expect(batch).toStrictEqual([
			{from: SAFE, to: ADDRESSES.Pool1, value: undefined, data: call(POOL_ABI, 'addDebtToken', [msUSD])},
			{from: SAFE, to: ADDRESSES.Pool1, value: undefined, data: call(POOL_ABI, 'addDebtToken', [msETH])},
		]);
		expect(proposals).toStrictEqual([batch]);
		expect(sent(provider).every((tx) => tx.from === DEPLOYER)).toBe(true);
		// the sender of `addDebtToken` came from Pool1's `governor()`, read on chain, as in v1
		const governorReads = provider
			.getRequests()
			.filter((r) => r.method === 'eth_call')
			.map((r) => r.params?.[0] as {to?: string; data?: string})
			.filter((c) => c.to?.toLowerCase() === ADDRESSES.Pool1 && c.data === toFunctionSelector('governor()'));
		expect(governorReads.length).toBeGreaterThan(0);
	});

	it("run 1: v1's `implementationName` sharing is kept: both debt tokens run ONE implementation", async () => {
		/**
		 * v1 recorded one `DebtToken` deployment for every debt-token proxy. rocketh records
		 * `MsUSDDebt_Pool1_Implementation` and `MsETHDebt_Pool1_Implementation`, but with
		 * `deterministicImplementation` both are the same create2 address, deployed once.
		 */
		const world = await afterEarlierScripts();
		const {env, provider} = await deployRun(world);

		const shared = env.get('MsUSDDebt_Pool1_Implementation').address;
		expect(env.get('MsETHDebt_Pool1_Implementation').address).toBe(shared);
		// and both proxy records say so, as v1's `get(alias).implementation` did
		expect(env.get('MsUSDDebt_Pool1').implementation).toBe(shared);
		expect(env.get('MsETHDebt_Pool1').implementation).toBe(shared);
		const implementationDeploys = sent(provider).filter((tx) => tx.to === '0x4e59b44847b379578588920ca78fbf26c0b4956c');
		expect(implementationDeploys).toHaveLength(1);
	});

	it('run 2, after the Safe executed the batch: nothing is sent and nothing is batched', async () => {
		const world = await afterEarlierScripts();
		const first = await deployRun(world);
		for (const tx of first.proposals[0]) world.chain.execute(tx);

		const second = await deployRun(world);

		expect(second.batch).toEqual([]);
		expect(second.proposals).toEqual([]);
		expect(sent(second.provider)).toEqual([]);
	});

	it('run 3, DebtToken recompiled and the msUSD cap raised: one new implementation, and an upgrade PER PROXY for the Safe', async () => {
		/**
		 * The case v1's `usesManyProxies` re-check exists for. rocketh deploys the new shared
		 * implementation once, then compares EACH proxy's implementation slot with it, so both
		 * proxies get their own `upgrade(proxy, implementation)` from the Safe to the Upgrader,
		 * in script order, next to the cap change the msUSD script asks for.
		 */
		const world = await afterEarlierScripts();
		const first = await deployRun(world);
		for (const tx of first.proposals[0]) world.chain.execute(tx);
		const msUSD = first.env.get('MsUSDDebt_Pool1').address.toLowerCase();
		const msETH = first.env.get('MsETHDebt_Pool1').address.toLowerCase();

		artifacts.DebtToken = DebtTokenV2;
		try {
			const third = await deployRun(world, {msUSDMaxTotalSupply: parseEther('10000000')});

			const v2 = third.env.get('MsUSDDebt_Pool1_Implementation').address.toLowerCase();
			expect(v2).not.toBe(first.env.get('MsUSDDebt_Pool1_Implementation').address.toLowerCase());
			expect(third.env.get('MsETHDebt_Pool1_Implementation').address.toLowerCase()).toBe(v2);
			expect(third.batch).toStrictEqual([
				{
					from: SAFE,
					to: ADDRESSES.DebtTokenUpgrader,
					value: undefined,
					data: call(UPGRADER_ABI, 'upgrade', [msUSD, v2]),
				},
				{
					from: SAFE,
					to: msUSD,
					value: undefined,
					data: call(DEBT_TOKEN_ABI, 'updateMaxTotalSupply', [parseEther('10000000')]),
				},
				{
					from: SAFE,
					to: ADDRESSES.DebtTokenUpgrader,
					value: undefined,
					data: call(UPGRADER_ABI, 'upgrade', [msETH, v2]),
				},
			]);
			expect(sent(third.provider).filter((tx) => tx.to === '0x4e59b44847b379578588920ca78fbf26c0b4956c')).toHaveLength(
				1,
			);
			// the upgrades were deferred, so each proxy record still describes the LIVE (old)
			//  implementation: a record asserts only what rocketh observed (ADR 0012)
			const v1Implementation = first.env.get('MsUSDDebt_Pool1_Implementation').address;
			expect(third.env.get('MsUSDDebt_Pool1').implementation).toBe(v1Implementation);
			expect(third.env.get('MsETHDebt_Pool1').implementation).toBe(v1Implementation);
		} finally {
			artifacts.DebtToken = withCode('DebtToken', DEBT_TOKEN_ABI, 'd1');
		}
	});

	it('impersonation, as a fork rehearsal gets it: with the Safe named and impersonated, the governor calls EXECUTE and nothing is batched', async () => {
		/**
		 * v1 on `localhost` executed the batch at the end from the impersonated Safe
		 * (`deploy/helpers/safe.ts:28-36`). A rocketh fork run impersonates the named Safe at
		 * setup, so the same calls execute in place, including the ones sent from the governor
		 * the script READ ON CHAIN, because that address is the named `governor`. The run keeps
		 * them as captured transactions marked `impersonated`: the list to propose for real.
		 */
		const world = await afterEarlierScripts();
		const {env, provider, batch} = await deployRun(world, {fork: true});

		expect(batch).toEqual([]);
		const fromSafe = sent(provider).filter((tx) => tx.from === SAFE);
		expect(fromSafe.map((tx) => tx.data?.slice(0, 10))).toEqual([
			toFunctionSelector('addDebtToken(address)'),
			toFunctionSelector('addDebtToken(address)'),
		]);
		const impersonated = env.capturedTransactions.filter(
			(entry) => entry.type === 'intent' && entry.signability === 'impersonated',
		);
		expect(impersonated).toHaveLength(2);
	});
});
