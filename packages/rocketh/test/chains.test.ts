import {describe, it, expect, vi, afterEach} from 'vitest';

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

/**
 * A chain with no `info` is a HANDLED condition: `info` is optional in `ChainUserConfig`, and the
 * function substitutes a labelled placeholder and carries on. It must therefore not be reported as
 * an error: anything that classifies rocketh's output by severity (a docs widget capturing the
 * console, a CI log scraper, an editor plugin colouring stderr) would show a failure on a healthy
 * run. It is still worth SAYING, because the placeholder reaches serialized chain info
 * (`@rocketh/export` writes `chainConfig.info` into frontend builds).
 */
describe('getChainConfigFromUserConfig - a chain with no public info', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	function captureConsole() {
		return {
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {}),
		};
	}

	/** No chain config at all: the common case, e.g. an undeclared local/dev chain. */
	it('warns instead of erroring when the chain is not described at all', () => {
		const {warn, error} = captureConsole();

		getChainConfigFromUserConfig(makeConfig({}), 31337, {} as any);

		expect(error).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]![0])).toContain('has no public info');
	});

	/**
	 * The message is what a user pastes into a search box, so its spacing is part of it. The
	 * conditional clause used to be interpolated between two spaces, leaving a double space
	 * (`chain with id 31337  has no public info`) whenever there was no chain config.
	 */
	it('leaves no double space where the optional clause is omitted', () => {
		const {warn} = captureConsole();

		getChainConfigFromUserConfig(makeConfig({}), 31337, {} as any);

		const message = String(warn.mock.calls[0]![0]);
		expect(message).toContain('chain with id 31337 has no public info');
		expect(message).not.toContain('  ');
	});

	/** A chain config that exists but carries no `info` says so, since that is a different mistake. */
	it('distinguishes a chain config that exists but has no info', () => {
		const {warn, error} = captureConsole();

		getChainConfigFromUserConfig(makeConfig({31337: {rpcUrl: 'http://localhost:8545'}}), 31337);

		expect(error).not.toHaveBeenCalled();
		const message = String(warn.mock.calls[0]![0]);
		expect(message).toContain('has a chain config but has no public info');
		expect(message).not.toContain('  ');
	});

	/** The condition is recoverable, which is the whole justification for warn over error. */
	it('substitutes labelled placeholder info and carries on', () => {
		captureConsole();

		const cfg = getChainConfigFromUserConfig(makeConfig({}), 31337, {} as any);

		expect(cfg.info.id).toBe(31337);
		expect(cfg.info.name).toBe('unknown');
		expect(cfg.info.nativeCurrency.symbol).toBe('UNKNOWN');
	});

	it('says nothing at all when the chain is fully described', () => {
		const {warn, error} = captureConsole();

		getChainConfigFromUserConfig(makeConfig({31337: chainConfig(31337)}), 31337);

		expect(warn).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
	});
});
