/**
 * Shared harness for the three PORTED PROTOCOL SCRIPTS in this folder: real hardhat-deploy v1
 * deploy scripts, read from three public protocol repositories, ported to rocketh and run.
 * The finding they back is `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md`.
 *
 * Not a test file (vitest only collects `*.test.ts`): it is the stand-in for the node and for
 * `rocketh deploy`, exactly as `../ported-v1-script.integration.test.ts` has one inline.
 *
 * - `createTestEnvironment` builds a REAL rocketh environment (account resolution,
 *   signability, impersonation, the broadcast choke point) over a mock EIP-1193 provider.
 * - The mock executes no EVM code, so the CHAIN is kept here and outlives a run: contract
 *   storage (a proxy's EIP-1967 slots), which addresses hold code (so a create2 deploy can
 *   find its own earlier deployment), address allocation (so run 2 never reuses an address
 *   run 1 handed out), and the answers to the view calls each ported script makes, which
 *   each test file supplies through `call`.
 * - A transaction a Safe executes OUT OF BAND is applied with `chain.execute(tx)`, the same
 *   code path a broadcast takes, so "the Safe executed the deferred transaction" moves the
 *   chain exactly as the real transaction would.
 */

import {decodeFunctionData, getContractAddress, parseAbi} from 'viem';
import {vi} from 'vitest';
import {withEnvironment} from '@rocketh/core';
import type {CurriedFunctions, DeploymentStore, Environment, UnresolvedUnknownNamedAccounts} from '@rocketh/core/types';
import {createMapDeploymentStore, createTestEnvironment} from '@rocketh/test-utils';
import type {ExecutionParams} from '@rocketh/core/types';
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';
import * as readExecuteExtension from '@rocketh/read-execute';

import * as unknownSignerExtension from '../../src/index.js';

/** EIP-1967 implementation slot. */
export const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
/** EIP-1967 admin slot. */
export const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
/** rocketh's default create2 factory (`packages/rocketh/src/environment/chains.ts`). */
const CREATE2_FACTORY = '0x4e59b44847b379578588920ca78fbf26c0b4956c';

/** Every call that moves a proxy's slots, across the three protocols' admin contracts. */
const SLOT_MOVING_CALLS = parseAbi([
	'function upgradeTo(address newImplementation)',
	'function upgradeToAndCall(address newImplementation, bytes data)',
	'function upgrade(address proxy, address implementation)',
	'function upgradeAndCall(address proxy, address implementation, bytes data)',
	// Vesper's upgraders (`*Upgrader.safeUpgrade`)
	'function safeUpgrade(address proxy, address implementation)',
	'function changeProxyAdmin(address proxy, address newAdmin)',
]);

export type SentTransaction = {from: `0x${string}`; to?: `0x${string}`; data?: `0x${string}`};
/** What `onTransaction` sees: the transaction, plus the address it created when it is a deployment. */
export type AppliedTransaction = SentTransaction & {createdAddress?: `0x${string}`};

/**
 * The chain, which OUTLIVES a run. `call` answers `eth_call` for the view functions a ported
 * script reads (return `undefined` for "not mine"); `onTransaction` lets a test file apply the
 * state changes of its protocol's own calls (a registry's `addStrategy`, a `setter`).
 */
export function createChain(hooks: {
	call?: (to: `0x${string}`, data: `0x${string}`) => `0x${string}` | undefined;
	onTransaction?: (tx: AppliedTransaction) => void;
}) {
	const slots = new Map<string, `0x${string}`>();
	const code = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	let txCount = 0;
	const contractAddressForHash = new Map<string, `0x${string}`>();

	function setAddress(address: string, slot: string, value: string) {
		slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
	}
	function readAddress(address: string, slot: string): `0x${string}` {
		const value = slots.get(keyOf(address, slot)) ?? `0x${'0'.repeat(64)}`;
		return `0x${value.slice(-40)}`;
	}

	/** What a transaction does to the parts of the chain this harness models. */
	function apply(tx: AppliedTransaction) {
		const to = tx.to?.toLowerCase();
		if (to === CREATE2_FACTORY && tx.data && tx.data.length >= 66) {
			// the create2 factory: `salt ++ creationCode`, landing at the CREATE2 address
			const salt = tx.data.slice(0, 66) as `0x${string}`;
			const bytecode = `0x${tx.data.slice(66)}` as `0x${string}`;
			const address = getContractAddress({opcode: 'CREATE2', from: CREATE2_FACTORY, salt, bytecode});
			code.set(address.toLowerCase(), '0x60016000');
		}
		if (to && tx.data) {
			try {
				const call = decodeFunctionData({abi: SLOT_MOVING_CALLS, data: tx.data});
				if (call.functionName === 'upgradeTo' || call.functionName === 'upgradeToAndCall') {
					setAddress(to, IMPLEMENTATION_SLOT, call.args[0]);
				} else if (call.functionName === 'changeProxyAdmin') {
					setAddress(call.args[0], ADMIN_SLOT, call.args[1]);
				} else {
					setAddress(call.args[0], IMPLEMENTATION_SLOT, call.args[1]);
				}
			} catch {
				// not a slot-moving call
			}
		}
		hooks.onTransaction?.(tx);
	}

	return {
		setAddress,
		readAddress,
		/** Mark an address as holding code (a contract deployed some other way). */
		setCode(address: string) {
			code.set(address.toLowerCase(), '0x60016000');
		},
		/** A transaction executed OUTSIDE rocketh: the Safe acting on a deferred transaction. */
		execute(tx: {from: string; to?: string; data?: string}) {
			apply(tx as SentTransaction);
		},
		/**
		 * What each proxy constructor wrote: its implementation and its admin, read back from
		 * the `<name>_Proxy` records' constructor arguments `(implementation, admin, data)`.
		 * The mock runs no constructor, so a test calls this after a run that deployed proxies.
		 */
		constructProxies(env: Environment, names: string[]) {
			for (const name of names) {
				const proxy = env.get(`${name}_Proxy`);
				const implementation = `0x${proxy.argsData.slice(2 + 24, 2 + 64)}`;
				const admin = `0x${proxy.argsData.slice(2 + 64 + 24, 2 + 128)}`;
				if (readAddress(proxy.address, IMPLEMENTATION_SLOT) === `0x${'0'.repeat(40)}`) {
					setAddress(proxy.address, IMPLEMENTATION_SLOT, implementation);
					setAddress(proxy.address, ADMIN_SLOT, admin);
				}
			}
		},
		responses: {
			eth_getStorageAt(params?: unknown[]) {
				const [address, slot] = params as [string, string];
				return slots.get(keyOf(address, slot)) ?? (`0x${'0'.repeat(64)}` as `0x${string}`);
			},
			eth_getCode(params?: unknown[]) {
				const [address] = params as [string];
				return code.get(address.toLowerCase()) ?? ('0x' as `0x${string}`);
			},
			eth_call(params?: unknown[]) {
				const {to, data} = (params?.[0] ?? {}) as {to?: `0x${string}`; data?: `0x${string}`};
				if (!to || !data) return '0x';
				return hooks.call?.(to.toLowerCase() as `0x${string}`, data) ?? '0x';
			},
			eth_sendTransaction(params?: unknown[]) {
				const tx = (params?.[0] ?? {}) as SentTransaction;
				const hex = (++txCount).toString(16);
				const hash = `0x${'c'.repeat(64 - hex.length)}${hex}` as `0x${string}`;
				const createdAddress = `0x${'c'.repeat(40 - hex.length)}${hex}` as `0x${string}`;
				contractAddressForHash.set(hash, createdAddress);
				apply(tx.to ? tx : {...tx, createdAddress});
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
					from: `0x${'0'.repeat(40)}` as `0x${string}`,
				};
			},
		},
	};
}

export type Chain = ReturnType<typeof createChain>;
export type World = {chain: Chain; deploymentStore: DeploymentStore};

export function createWorld(chain: Chain): World {
	return {chain, deploymentStore: createMapDeploymentStore()};
}

/** What `rocketh/config.ts` would spread into `extensions`: the same four for every port. */
export const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...proxyExtension,
	...unknownSignerExtension,
};

export type ScriptEnvironment = Environment & CurriedFunctions<typeof extensions>;

/**
 * What `rocketh/deploy.ts` exports, reduced to what a test needs: rocketh's
 * `setupDeployScripts(extensions).deployScript` layers the curried extensions over the
 * environment and hands the result to the script. Inline so this package does not take a
 * dependency on `rocketh` for a two-line helper (the same choice as
 * `../ported-v1-script.integration.test.ts`).
 */
export function deployScript(callback: (env: ScriptEnvironment) => Promise<void | boolean>) {
	return (env: Environment) =>
		callback(Object.assign(Object.create(Object.getPrototypeOf(env)), env, withEnvironment(env, extensions)));
}

/**
 * One `rocketh deploy` invocation over `world`: a fresh environment that reloads the
 * deployments earlier runs saved. The same world twice is a RE-RUN.
 */
export async function run(
	world: World,
	options: {
		accounts: UnresolvedUnknownNamedAccounts;
		nodeAccounts: `0x${string}`[];
		environmentName?: string;
		chainId?: number;
		executionParams?: Partial<Omit<ExecutionParams, 'provider'>>;
	},
) {
	const result = await createTestEnvironment({
		accounts: options.accounts,
		nodeAccounts: options.nodeAccounts,
		environmentName: options.environmentName,
		chainId: options.chainId,
		executionParams: {autoImpersonate: false, ...options.executionParams},
		deploymentStore: world.deploymentStore,
		providerConfig: {responses: world.chain.responses},
	});
	await result.internal.loadDeployments();
	const printed: string[] = [];
	vi.spyOn(result.env, 'showMessage').mockImplementation((message: string) => {
		printed.push(message);
	});
	return {...result, printed: () => printed.join('\n')};
}

/** Every transaction a run broadcast through `eth_sendTransaction`, lowercased. */
export function sent(provider: {getRequests: () => {method: string; params?: unknown[]}[]}): SentTransaction[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => {
			const tx = r.params?.[0] as {from: string; to?: string; data?: `0x${string}`};
			return {
				from: tx.from.toLowerCase() as `0x${string}`,
				to: tx.to?.toLowerCase() as `0x${string}` | undefined,
				data: tx.data,
			};
		});
}
