import {createNode, type SlimNode} from 'webevm';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * A private EVM for one playground run, and the EIP-1193 provider rocketh talks to.
 *
 * `webevm` is execution-only: no accounts, no signing, no mempool. It takes SIGNED
 * raw transactions and answers reads. That constraint is the reason accounts here are
 * configured as `privateKey:0x…` (see `buildUserConfig`) rather than by index: index-based
 * accounts resolve through `eth_accounts`, which this node deliberately does not implement.
 *
 * Requires webevm >= 0.5.0 (the package formerly published as `embedded-eth-node`, whose last
 * release under the old name was 0.4.0). Earlier versions answered `eth_estimateGas` with gas
 * CONSUMED rather than a usable limit, which silently reverted any inner CREATE2 and so broke
 * exactly the deterministic-implementation deploy this widget demonstrates.
 */
export type PlaygroundChain = {
	/** Hand this to rocketh as `provider`. */
	readonly provider: EIP1193ProviderWithoutEvents;
	/** Runtime code at `address`, `'0x'` when nothing is deployed there. */
	getCode(address: `0x${string}`): Promise<`0x${string}`>;
	/** Release timers and state. */
	dispose(): Promise<void>;
};

export type CreateChainOptions = {
	chainId: number;
	/** Address -> genesis balance in wei. */
	initialBalances: Record<string, bigint>;
};

export async function createPlaygroundChain(options: CreateChainOptions): Promise<PlaygroundChain> {
	const node: SlimNode = await createNode({
		chainId: options.chainId,
		// One block per raw transaction, so a deploy script's sequential sends behave the way
		// they do against a dev node with automining. A deploy script written for `anvil` must
		// not need a different shape here.
		miningConfig: {type: 'auto'},
		initialBalances: options.initialBalances,
	});

	// `SlimNode.request` is typed against the node's own request union; rocketh wants an
	// EIP-1193 provider. The two agree in practice (that is what the harness proved), and the
	// cast is confined to this one adapter rather than leaking into the run.
	const provider = {
		request: (args: {method: string; params?: unknown}) => node.request(args as never),
	} as unknown as EIP1193ProviderWithoutEvents;

	return {
		provider,
		async getCode(address) {
			return (await node.request({method: 'eth_getCode', params: [address, 'latest']} as never)) as `0x${string}`;
		},
		dispose() {
			return node.dispose();
		},
	};
}
