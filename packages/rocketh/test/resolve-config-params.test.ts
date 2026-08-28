/**
 * Tests for resolveConfig, getEnvironmentName, getChainIdForEnvironment, and
 * resolveExecutionParams branch coverage.
 *
 * The executor tests in `executor-scripts.test.ts` cover the module-selection and
 * run-loop logic, but many branches in config resolution and parameter resolution
 * remain uncovered: `scripts` normalisation (string, empty array, absent), the
 * `overrides` merge, `getEnvironmentName` (legacy `network` key, fork object form),
 * `saveDeployments` defaulting with a provider, and `getChainIdForEnvironment` error
 * paths.
 */

import {describe, it, expect} from 'vitest';
import {
	resolveConfig,
	getEnvironmentName,
	getChainIdForEnvironment,
	resolveExecutionParams,
} from '../src/executor/index.js';
import {privateKey} from '@rocketh/signer';
import type {UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

function mockProvider(chainId: string = '0x7a69'): EIP1193ProviderWithoutEvents {
	return {
		request: async ({method}: {method: string; params?: unknown}) => {
			if (method === 'eth_chainId') return chainId;
			throw new Error(`unmocked: ${method}`);
		},
	} as EIP1193ProviderWithoutEvents;
}

const baseConfig: UserConfig = {
	accounts: {deployer: PRIVATE_KEY},
	signerProtocols: {privateKey},
	defaultPollingInterval: 0.001,
};

describe('resolveConfig - scripts normalisation', () => {
	it('defaults to ["deploy"] when scripts is absent', () => {
		const config = resolveConfig(baseConfig);
		expect(config.scripts).toEqual(['deploy']);
	});

	it('wraps a string into a single-element array', () => {
		const config = resolveConfig({...baseConfig, scripts: 'migrate' as any});
		expect(config.scripts).toEqual(['migrate']);
	});

	it('converts an empty array to ["deploy"]', () => {
		const config = resolveConfig({...baseConfig, scripts: [] as any});
		expect(config.scripts).toEqual(['deploy']);
	});

	it('passes a non-empty array through', () => {
		const config = resolveConfig({...baseConfig, scripts: ['deploy', 'migrate'] as any});
		expect(config.scripts).toEqual(['deploy', 'migrate']);
	});
});

describe('resolveConfig - overrides merge', () => {
	it('applies overrides for defined keys only', () => {
		const config = resolveConfig(baseConfig, {deployments: 'custom-deployments', defaultPollingInterval: 5} as any);
		expect(config.deployments).toBe('custom-deployments');
		expect(config.defaultPollingInterval).toBe(5);
	});

	it('skips undefined overrides', () => {
		const config = resolveConfig(baseConfig, {deployments: undefined});
		expect(config.deployments).toBe('deployments'); // the default
	});
});

describe('getEnvironmentName', () => {
	it('defaults to "memory" when no environment is provided, and that is NOT a fork', () => {
		const {name, fork} = getEnvironmentName({});
		expect(name).toBe('memory');
		// a run is a fork because it was TOLD which network it forks, never by omission
		expect(fork).toBeUndefined();
	});

	it('uses the string form directly', () => {
		const {name, fork} = getEnvironmentName({environment: 'sepolia'});
		expect(name).toBe('sepolia');
		expect(fork).toBeUndefined();
	});

	it('accepts the legacy "network" key', () => {
		const {name, fork} = getEnvironmentName({network: 'mainnet'} as any);
		expect(name).toBe('mainnet');
		expect(fork).toBeUndefined();
	});

	it('unwraps the fork object form {fork: "mainnet"} into a descriptor naming it', () => {
		const {name, fork} = getEnvironmentName({environment: {fork: 'mainnet'} as any});
		expect(name).toBe('mainnet');
		expect(fork).toEqual({networkName: 'mainnet'});
	});
});

describe('getChainIdForEnvironment', () => {
	it('returns the provider chainId when no config chain is set', async () => {
		const config = resolveConfig(baseConfig);
		const chainId = await getChainIdForEnvironment(config, 'memory', {provider: mockProvider('0x7a69')});
		expect(chainId).toBe(31337);
	});

	it('returns the config chain when no provider is given', async () => {
		const config = resolveConfig({
			...baseConfig,
			environments: {sepolia: {chain: 11155111}},
		});
		const chainId = await getChainIdForEnvironment(config, 'sepolia', {});
		expect(chainId).toBe(11155111);
	});

	it('throws when no chainId can be found and no provider', async () => {
		const config = resolveConfig(baseConfig);
		await expect(getChainIdForEnvironment(config, 'unknown', {})).rejects.toThrow(/no provider/);
	});

	it('throws when no chainId can be found with a provider', async () => {
		const config = resolveConfig(baseConfig);
		const badProvider = mockProvider('0x0');
		// eth_chainId returns 0 → Number('0x0') = 0 → falsy → chainIdToReturn = config chain (undefined)
		await expect(getChainIdForEnvironment(config, 'unknown', {provider: badProvider})).rejects.toThrow(
			/Could not find chainId/,
		);
	});
});

describe('resolveExecutionParams - saveDeployments defaulting', () => {
	it('defaults to false for "memory" environment with a provider', () => {
		const config = resolveConfig(baseConfig);
		const resolved = resolveExecutionParams(config, {provider: mockProvider(), environment: 'memory'}, 31337);
		expect(resolved.saveDeployments).toBe(false);
	});

	it('defaults to false for "hardhat" environment with a provider', () => {
		const config = resolveConfig(baseConfig);
		const resolved = resolveExecutionParams(config, {provider: mockProvider(), environment: 'hardhat'}, 31337);
		expect(resolved.saveDeployments).toBe(false);
	});

	it('defaults to true for a named environment with a provider', () => {
		const config = resolveConfig(baseConfig);
		const resolved = resolveExecutionParams(config, {provider: mockProvider(), environment: 'sepolia'}, 31337);
		expect(resolved.saveDeployments).toBe(true);
	});

	it('defaults to true when no provider is given', () => {
		const config = resolveConfig({...baseConfig, chains: {31337: {rpcUrl: 'http://localhost:8545'}} as any});
		const resolved = resolveExecutionParams(config, {environment: 'sepolia'}, 31337);
		expect(resolved.saveDeployments).toBe(true);
	});

	it('respects an explicit saveDeployments value over the default', () => {
		const config = resolveConfig(baseConfig);
		const resolved = resolveExecutionParams(
			config,
			{provider: mockProvider(), environment: 'sepolia', saveDeployments: false},
			31337,
		);
		expect(resolved.saveDeployments).toBe(false);
	});
});

describe('resolveExecutionParams - scripts override per environment', () => {
	it('uses per-environment scripts override (string)', () => {
		const config = resolveConfig({
			...baseConfig,
			chains: {31337: {rpcUrl: 'http://localhost:8545'}} as any,
			environments: {custom: {chain: 31337, scripts: 'migrate' as any}},
		});
		const resolved = resolveExecutionParams(config, {environment: 'custom'}, 31337);
		expect(resolved.scripts).toEqual(['migrate']);
	});

	it('uses per-environment scripts override (array)', () => {
		const config = resolveConfig({
			...baseConfig,
			chains: {31337: {rpcUrl: 'http://localhost:8545'}} as any,
			environments: {custom: {chain: 31337, scripts: ['deploy', 'test'] as any}},
		});
		const resolved = resolveExecutionParams(config, {environment: 'custom'}, 31337);
		expect(resolved.scripts).toEqual(['deploy', 'test']);
	});
});
