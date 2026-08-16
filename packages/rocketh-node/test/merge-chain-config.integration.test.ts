import {describe, it, expect} from 'vitest';
import {mergeChainConfig} from '../src/index.js';
import type {ChainInfo, ChainUserConfig} from '@rocketh/core/types';

/**
 * `mergeChainConfig` combines viem's default chain info with the user's config
 * for a single chain. It is the seam that decides whether viem's public default
 * RPC (e.g. `https://<id>.rpc.thirdweb.com`) ends up in the serialized
 * `info.rpcUrls` (frontend exports, wallet "add network" data) or is kept as a
 * deploy-only fallback.
 */
describe('@rocketh/node - mergeChainConfig', () => {
	// Stand-in for what viem provides for a well-known chain.
	const viemSepolia: ChainInfo = {
		id: 11155111,
		name: 'Sepolia',
		nativeCurrency: {name: 'Sepolia Ether', symbol: 'ETH', decimals: 18},
		rpcUrls: {default: {http: ['https://11155111.rpc.thirdweb.com']}},
		testnet: true,
	};

	describe('default (includeDefaultRPCUrls = false)', () => {
		it('does not put viem default rpc into info.rpcUrls', () => {
			const merged = mergeChainConfig(viemSepolia, undefined, false);
			expect(merged.info?.rpcUrls).toEqual({default: {http: []}});
		});

		it('still exposes viem default rpc to the deploy path via rpcUrl', () => {
			// option (i): deploy keeps working with zero config.
			const merged = mergeChainConfig(viemSepolia, undefined, false);
			expect(merged.rpcUrl).toBe('https://11155111.rpc.thirdweb.com');
		});

		it('always keeps viem chain metadata (name, currency, testnet)', () => {
			const merged = mergeChainConfig(viemSepolia, undefined, false);
			expect(merged.info?.name).toBe('Sepolia');
			expect(merged.info?.nativeCurrency).toEqual(viemSepolia.nativeCurrency);
			expect(merged.info?.testnet).toBe(true);
		});

		it('keeps an rpc url the user set explicitly in info.rpcUrls', () => {
			const userConfig: ChainUserConfig = {
				info: {
					...viemSepolia,
					rpcUrls: {default: {http: ['https://my-node.example/rpc']}},
				},
			};
			const merged = mergeChainConfig(viemSepolia, userConfig, false);
			expect(merged.info?.rpcUrls.default.http).toEqual(['https://my-node.example/rpc']);
		});

		it("does not override the user's explicit top-level rpcUrl with viem's default", () => {
			const userConfig: ChainUserConfig = {rpcUrl: 'https://my-node.example/rpc'};
			const merged = mergeChainConfig(viemSepolia, userConfig, false);
			expect(merged.rpcUrl).toBe('https://my-node.example/rpc');
			// and it is still kept out of the serialized info by default
			expect(merged.info?.rpcUrls).toEqual({default: {http: []}});
		});
	});

	describe('opt-in (includeDefaultRPCUrls = true)', () => {
		it("restores viem's default rpc inside info.rpcUrls", () => {
			const merged = mergeChainConfig(viemSepolia, undefined, true);
			expect(merged.info?.rpcUrls.default.http).toEqual(['https://11155111.rpc.thirdweb.com']);
		});

		it('still lets the user override the rpc in info.rpcUrls', () => {
			const userConfig: ChainUserConfig = {
				info: {
					...viemSepolia,
					rpcUrls: {default: {http: ['https://my-node.example/rpc']}},
				},
			};
			const merged = mergeChainConfig(viemSepolia, userConfig, true);
			expect(merged.info?.rpcUrls.default.http).toEqual(['https://my-node.example/rpc']);
		});
	});

	/**
	 * A chain id viem has never heard of: a private network, an in-house devnet, a fresh
	 * rollup. There is no default to layer under, so the user's config is the whole truth and
	 * must survive intact. Before this was handled, the caller dropped such an id from
	 * `config.chains` altogether and the user's settings vanished silently.
	 */
	describe('a chain id viem does not know (defaultInfo === undefined)', () => {
		const userDeclared: ChainUserConfig = {
			rpcUrl: 'http://localhost:9999',
			tags: ['private'],
			onUnknownSigner: 'throw',
			confirmationsRequired: 3,
			info: {
				id: 424242,
				name: 'My Private Chain',
				nativeCurrency: {name: 'Custom', symbol: 'CUS', decimals: 18},
				rpcUrls: {default: {http: ['http://localhost:9999']}},
			},
		};

		it("keeps the user's info verbatim", () => {
			const merged = mergeChainConfig(undefined, userDeclared, false);
			expect(merged.info).toEqual(userDeclared.info);
		});

		it('keeps every other chain-level setting the user declared', () => {
			const merged = mergeChainConfig(undefined, userDeclared, false);
			expect(merged.rpcUrl).toBe('http://localhost:9999');
			expect(merged.tags).toEqual(['private']);
			expect(merged.onUnknownSigner).toBe('throw');
			expect(merged.confirmationsRequired).toBe(3);
		});

		/**
		 * The important negative case. `info` must stay ABSENT rather than become `{}`, because
		 * `getChainConfigFromUserConfig` branches on `!chainConfig?.info` to build its labelled
		 * 'unknown' placeholder. An empty object is truthy and would sail past that check,
		 * producing chain info with no id, name or nativeCurrency at all.
		 */
		it('leaves info absent (not {}) when the user supplied none', () => {
			const merged = mergeChainConfig(undefined, {rpcUrl: 'http://localhost:9999'}, false);
			expect(merged.info).toBeUndefined();
			expect(merged.rpcUrl).toBe('http://localhost:9999');
		});

		it('does not invent an rpcUrl (there is no viem default to fall back to)', () => {
			const merged = mergeChainConfig(undefined, {tags: ['private']}, false);
			expect(merged.rpcUrl).toBeUndefined();
		});
	});

	it('handles a chain viem does know but has no default rpc for (no rpcUrl, empty info)', () => {
		const custom: ChainInfo = {
			id: 987654321,
			name: 'Custom',
			nativeCurrency: {name: 'Custom', symbol: 'CUS', decimals: 18},
			rpcUrls: {default: {http: []}},
		};
		const merged = mergeChainConfig(custom, undefined, false);
		expect(merged.info?.rpcUrls).toEqual({default: {http: []}});
		expect(merged.rpcUrl).toBeUndefined();
	});
});
