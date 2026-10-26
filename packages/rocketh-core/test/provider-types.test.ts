import {describe, it, expect} from 'vitest';
import type {
	EIP1193CoreProvider,
	EIP1193HttpNodeProvider,
	EIP1193NodeProvider,
	EIP1193Provider,
	EIP1193WalletProvider,
	ReadMethods,
	RequestRPC,
} from 'eip-1193';
import type {ChainConfig, Environment, ExecutionParams, Signer} from '../src/types.js';

/**
 * rocketh only calls methods that a browser wallet, a JSON-RPC node and a plain HTTP node all
 * serve, so every slot that takes a provider is typed `EIP1193CoreProvider` (eip-1193 >= 0.7.1).
 * Typing them as `EIP1193ProviderWithoutEvents`, which since eip-1193 0.7.0 is the WALLET surface,
 * rejected a node provider although rocketh never calls a wallet-only method.
 *
 * These are assignability checks: they fail `pnpm typecheck`, not the test run.
 */

// Typed placeholders: only their types matter, the checks happen at compile time.
const wallet = undefined as unknown as EIP1193WalletProvider;
const windowWallet = undefined as unknown as EIP1193Provider;
const node = undefined as unknown as EIP1193NodeProvider;
const httpNode = undefined as unknown as EIP1193HttpNodeProvider;
const readOnly = undefined as unknown as RequestRPC<ReadMethods>;

type ProviderSlot = NonNullable<ExecutionParams['provider']>;
type ChainProviderSlot = Extract<ChainConfig, {provider: unknown}>['provider'];
type RemoteSignerSlot = Extract<Signer, {type: 'remote'}>['signer'];

describe('provider slots accept every kind of provider', () => {
	it('accepts a wallet, a node and an HTTP node provider in ExecutionParams.provider', () => {
		const slots: ProviderSlot[] = [wallet, windowWallet, node, httpNode];
		expect(slots).toHaveLength(4);
	});

	it('accepts a wallet, a node and an HTTP node provider in a chain config', () => {
		const slots: ChainProviderSlot[] = [wallet, windowWallet, node, httpNode];
		expect(slots).toHaveLength(4);
	});

	it('accepts a node provider (unlocked accounts) or a wallet as a remote signer', () => {
		const slots: RemoteSignerSlot[] = [wallet, node, httpNode];
		expect(slots).toHaveLength(3);
	});

	it('still refuses a provider that cannot sign or broadcast', () => {
		// @ts-expect-error a read-only provider lacks eth_sendRawTransaction and the signer methods
		const slot: ProviderSlot = readOnly;
		expect(slot).toBeUndefined();
	});

	it('exposes the environment provider as the core surface, the most it can promise', () => {
		const exposed = undefined as unknown as Environment['network']['provider'];
		// it offers the core...
		const core: EIP1193CoreProvider = exposed;
		// ...and nothing beyond it: rocketh may be running against a node or over plain HTTP. These
		// closures are never called; the checks are the @ts-expect-error lines.
		const notPromised = [
			// @ts-expect-error eth_subscribe is not served over plain HTTP, so it is not promised
			() => exposed.request({method: 'eth_subscribe', params: ['newHeads']}),
			// @ts-expect-error wallet_* is not served by a node, so it is not promised
			() => exposed.request({method: 'wallet_switchEthereumChain', params: [{chainId: '0x1'}]}),
		];
		expect(core).toBeUndefined();
		expect(notPromised).toHaveLength(2);
	});
});
