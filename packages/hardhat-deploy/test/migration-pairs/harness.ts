/**
 * The harness that RUNS the rocketh half of every migration pair. Not part of the miniature
 * project: this is the test's stand-in for a node and for `rocketh deploy`.
 *
 * `createTestEnvironment` builds a REAL rocketh environment (config resolution, named-account
 * resolution, signability, the broadcast path) over a mock EIP-1193 provider. A script is then
 * run exactly as rocketh's executor runs it: `deployScript(...)` returns a function of the
 * environment, and the executor calls it with the environment (`deployScript.func(external)`).
 * The pairs that are about the EXECUTOR itself (tags, dependencies, the run-once `id`) go through
 * `rocketh/environment.ts` instead, which drives the real executor.
 *
 * The mock provider executes nothing, so the parts of chain state a script or an extension READS
 * back are kept here, in `createChain`: contract storage (a proxy's EIP-1967 slots), the answers
 * of the few view calls the pairs make, and address allocation, which must outlive a run so that
 * a second run never hands out an address the first one used.
 */

import {
	decodeAbiParameters,
	decodeFunctionData,
	encodeAbiParameters,
	parseAbi,
	toFunctionSelector,
	type AbiParameter,
} from 'viem';
import type {Abi, Deployment, DeploymentStore, Environment} from 'rocketh/types';
import {createMapDeploymentStore, createTestEnvironment, NODE_HELD_ACCOUNTS} from '@rocketh/test-utils';

import {config} from './rocketh/config.js';

/** The three node accounts `deployer: 0`, `tokenOwner: 1`, `faucetOwner: 2` resolve to. */
export const [DEPLOYER, TOKEN_OWNER, FAUCET_OWNER] = NODE_HELD_ACCOUNTS.map((a) => a.toLowerCase() as `0x${string}`);

/** EIP-1967 implementation slot. */
export const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
/** EIP-1967 admin slot (the ERC173 proxies keep their owner there too). */
export const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

const UPGRADE_CALLS = parseAbi([
	'function upgradeTo(address newImplementation)',
	'function upgradeToAndCall(address newImplementation, bytes data)',
	'function upgrade(address proxy, address implementation)',
	'function upgradeAndCall(address proxy, address implementation, bytes data)',
]);

type Facet = {facetAddress: `0x${string}`; functionSelectors: readonly `0x${string}`[]};

const FACETS_TYPE = [
	{
		type: 'tuple[]',
		components: [
			{name: 'facetAddress', type: 'address'},
			{name: 'functionSelectors', type: 'bytes4[]'},
		],
	},
] as const;

/**
 * The chain, which OUTLIVES a run. Pass the same chain (and the same deployment store) to two
 * runs and the second is a RE-RUN of the first.
 */
export function createChain() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	let txCount = 0;
	const contractAddressForHash = new Map<string, `0x${string}`>();
	const state = {
		/** What `greet()` answers. */
		greeting: 'hi',
		/** What the diamond loupe's `facets()` answers. */
		facets: [] as Facet[],
		/** What `owner()` answers on any contract (a ProxyAdmin, a diamond). */
		owner: DEPLOYER,
	};

	function setAddress(address: string, slot: string, value: string) {
		slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
	}
	function getSlot(address: string, slot: string): `0x${string}` {
		return slots.get(keyOf(address, slot)) ?? (`0x${'0'.repeat(64)}` as `0x${string}`);
	}

	return {
		state,
		setAddress,
		/** The address an EIP-1967 slot holds. */
		readAddress(address: string, slot: string): `0x${string}` {
			return `0x${getSlot(address, slot).slice(-40)}`;
		},
		/**
		 * What the constructor of every proxy deployed in `env` wrote: its implementation, and its
		 * admin when it takes one. Read back from the proxy record's own constructor arguments, so it
		 * holds for every proxy kind (`(implementation, admin, data)` or UUPS' `(implementation, data)`).
		 */
		constructProxies(env: Environment) {
			for (const [name, deployment] of Object.entries(env.deployments)) {
				if (!name.endsWith('_Proxy')) continue;
				const ctor = deployment.abi.find((item) => item.type === 'constructor');
				if (!ctor || ctor.type !== 'constructor') continue;
				const args = decodeAbiParameters(ctor.inputs as readonly AbiParameter[], deployment.argsData);
				const addresses = ctor.inputs
					.map((input, i) => (input.type === 'address' ? (args[i] as string) : undefined))
					.filter((a): a is string => a !== undefined);
				if (getSlot(deployment.address, IMPLEMENTATION_SLOT) === `0x${'0'.repeat(64)}`) {
					setAddress(deployment.address, IMPLEMENTATION_SLOT, addresses[0]);
					if (addresses[1]) setAddress(deployment.address, ADMIN_SLOT, addresses[1]);
				}
			}
		},
		responses: {
			eth_getStorageAt(params?: unknown[]) {
				const [address, slot] = params as [string, string];
				return getSlot(address, slot);
			},
			eth_call(params?: unknown[]) {
				const data = ((params?.[0] as {data?: string}) ?? {}).data ?? '';
				const selector = data.slice(0, 10);
				if (selector === toFunctionSelector('owner()')) {
					return encodeAbiParameters([{type: 'address'}], [state.owner]);
				}
				if (selector === toFunctionSelector('facets()')) {
					return encodeAbiParameters(FACETS_TYPE, [state.facets]);
				}
				if (selector === toFunctionSelector('greet()')) {
					return encodeAbiParameters([{type: 'string'}], [state.greeting]);
				}
				return '0x';
			},
			eth_sendTransaction(params?: unknown[]) {
				const tx = (params?.[0] ?? {}) as {to?: `0x${string}`; data?: `0x${string}`};
				// an upgrade the chain would have applied: move the proxy's implementation slot
				if (tx.to && tx.data) {
					try {
						const call = decodeFunctionData({abi: UPGRADE_CALLS, data: tx.data});
						if (call.functionName === 'upgradeTo' || call.functionName === 'upgradeToAndCall') {
							setAddress(tx.to, IMPLEMENTATION_SLOT, call.args[0]);
						} else {
							setAddress(call.args[0], IMPLEMENTATION_SLOT, call.args[1]);
						}
					} catch {
						// not an upgrade call
					}
				}
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

export type Chain = ReturnType<typeof createChain>;
export type World = {chain: Chain; deploymentStore: DeploymentStore};

/** A fresh chain and an empty deployment folder. */
export function createWorld(): World {
	return {chain: createChain(), deploymentStore: createMapDeploymentStore()};
}

/**
 * One `rocketh deploy` invocation over `world`, with the project's `rocketh/config.ts` accounts:
 * a fresh environment that reloads the deployments saved by earlier runs, as the executor does.
 */
export async function run(world: World, options: {environmentName?: string; chainId?: number} = {}) {
	const result = await createTestEnvironment({
		accounts: config.accounts,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		environmentName: options.environmentName,
		chainId: options.chainId,
		deploymentStore: world.deploymentStore,
		providerConfig: {responses: world.chain.responses},
	});
	await result.internal.loadDeployments();
	return result;
}

/**
 * Run one deploy script against `env`, as the executor does. The cast is only because a script
 * is typed for THIS project's accounts while the harness hands it the generic environment type.
 */
export function runScript(script: unknown, env: Environment): Promise<void | boolean> {
	return (script as (env: Environment) => Promise<void | boolean>)(env);
}

/** Every transaction a run broadcast, in order. */
export function sent(provider: {getRequests: () => {method: string; params?: unknown[]}[]}) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => {
			const tx = r.params?.[0] as {from: string; to?: string; data?: `0x${string}`};
			return {from: tx.from.toLowerCase(), to: tx.to?.toLowerCase(), data: tx.data};
		});
}

/**
 * WHICH contract a deployment record holds, by the compilation target in its metadata: the
 * source-level contract name the bundled artifact was compiled from. For a proxy this is what
 * tells `ERC173Proxy` from `TransparentUpgradeableProxy`, whatever option picked it.
 */
export function compiledContractName(deployment: Deployment<Abi>): string {
	const metadata = JSON.parse(deployment.metadata) as {settings: {compilationTarget: Record<string, string>}};
	return Object.values(metadata.settings.compilationTarget)[0];
}
