import {describe, it, expect} from 'vitest';

import {getChainConfigFromUserConfig} from '../src/environment/chains.js';
import type {ChainInfo, ChainUserConfig, ResolvedUserConfig} from '@rocketh/core/types';

/** Minimal chain info for tests. */
function chainInfo(id: number, testnet = false): ChainInfo {
	return {
		id,
		name: 'test',
		nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
		rpcUrls: {default: {http: []}},
		chainType: 'default',
		testnet,
	};
}

/** Minimal resolved user config carrying only a `chains` map (enough for getChainConfigFromUserConfig). */
function makeConfig(chains: Record<number, ChainUserConfig>): ResolvedUserConfig {
	return {
		retry: {maxRetries: 3, delay: 1000},
		deployments: 'deployments',
		scripts: ['deploy'],
		defaultPollingInterval: 1000,
		chains,
	};
}

function chainConfig(id: number, overrides: Partial<ChainUserConfig> = {}): ChainUserConfig {
	return {rpcUrl: 'http://localhost:8545', info: chainInfo(id), ...overrides};
}

describe('getChainConfigFromUserConfig - deleteDeploymentsIfDifferentGenesisHash', () => {
	/**
	 * Dev chain ids (hardhat/anvil/foundry = 31337, localhost/tempoLocalnet = 1337) default to
	 * `true` so reset detection (auto-delete stale deployments) works out of the box.
	 */
	it('defaults to true for dev chain id 31337', () => {
		const cfg = getChainConfigFromUserConfig(makeConfig({31337: chainConfig(31337)}), 31337);
		expect(cfg.deleteDeploymentsIfDifferentGenesisHash).toBe(true);
	});

	it('defaults to true for dev chain id 1337', () => {
		const cfg = getChainConfigFromUserConfig(makeConfig({1337: chainConfig(1337)}), 1337);
		expect(cfg.deleteDeploymentsIfDifferentGenesisHash).toBe(true);
	});

	/**
	 * Real chains (e.g. mainnet = 1) default to `false`: a genesis mismatch there is treated as an
	 * error (throw), never a silent wipe.
	 */
	it('defaults to false for a non-dev chain id (1)', () => {
		const cfg = getChainConfigFromUserConfig(makeConfig({1: chainConfig(1)}), 1);
		expect(cfg.deleteDeploymentsIfDifferentGenesisHash).toBe(false);
	});

	/**
	 * The default is `true` for dev chains, so the field MUST be resolved with `??` (not `||`).
	 * With `||`, an explicit `false` on a 31337 chain would be `false || true === true` and the
	 * opt-out would be silently ignored. This test pins the `??` behaviour.
	 */
	it('allows opting out (false) on a 31337 chain (uses ??, not ||)', () => {
		const cfg = getChainConfigFromUserConfig(
			makeConfig({31337: chainConfig(31337, {deleteDeploymentsIfDifferentGenesisHash: false})}),
			31337,
		);
		expect(cfg.deleteDeploymentsIfDifferentGenesisHash).toBe(false);
	});

	it('allows opting in (true) on a non-dev chain', () => {
		const cfg = getChainConfigFromUserConfig(
			makeConfig({1: chainConfig(1, {deleteDeploymentsIfDifferentGenesisHash: true})}),
			1,
		);
		expect(cfg.deleteDeploymentsIfDifferentGenesisHash).toBe(true);
	});

	/**
	 * The mechanism is a chain config option, not a tag. Confirm no `ephemeral` tag is injected
	 * for dev chains (regression guard against the earlier tag-based design).
	 */
	it('does NOT add an "ephemeral" tag for dev chains', () => {
		const cfg = getChainConfigFromUserConfig(makeConfig({31337: chainConfig(31337)}), 31337);
		expect([...cfg.tags]).not.toContain('ephemeral');
		expect([...cfg.tags]).toEqual([]);
	});
});
