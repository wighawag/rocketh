import {describe, it, expect, vi} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Errors raised while resolving named accounts must never carry key material.
 *
 * An account definition routinely holds private keys: a bare `0x` + 64 hex, a
 * `privateKey:0x...` protocol string, or a per-network map of those. Error messages reach
 * terminals and CI logs, and GitHub's secret masking only hides the EXACT secret string, so a key
 * printed as part of a larger value (a JSON dump of the definition, a protocol string) is not
 * masked. These tests build a REAL environment through the same path the CLI takes, trigger each
 * account-resolution error, and assert the key is absent from the message while the parts a user
 * needs to find the offending line (the account name, the network keys, the protocol name) remain.
 */

const KEY_A = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const KEY_B = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

/** Any 16 consecutive hex digits is treated as leaked key material. */
const LONG_HEX = /[0-9a-fA-F]{16}/;

function mockProvider(): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: '0x' + '0'.repeat(62) + '42'};
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	} as EIP1193ProviderWithoutEvents;
}

function emptyStore(): DeploymentStore {
	return {
		listFiles: vi.fn(async () => []),
		deleteAll: vi.fn(async () => {}),
		hasFile: vi.fn(async () => false),
		writeFile: vi.fn(async () => {}),
		writeFileWithChainInfo: vi.fn(async () => {}),
		readFile: vi.fn(async () => ''),
		deleteFile: vi.fn(async () => {}),
	} as DeploymentStore;
}

async function environmentError(userConfig: UserConfig): Promise<string> {
	const config = resolveConfig({defaultPollingInterval: 0.001, ...userConfig});
	const executionParams = {provider: mockProvider(), environment: 'memory', saveDeployments: false};
	try {
		const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
		const resolved = resolveExecutionParams(config, executionParams, chainId);
		await createEnvironment(config, resolved, emptyStore());
	} catch (error) {
		return (error as Error).message;
	}
	throw new Error('expected environment construction to fail');
}

describe('named-account errors do not leak private keys', () => {
	/**
	 * The realistic case: keys configured per network, and a run on a network with no entry and no
	 * `default`. The old message was a JSON dump of the whole map, printing every OTHER network's key.
	 */
	it('describes a per-network map without printing the keys in it', async () => {
		const message = await environmentError({
			accounts: {deployer: {sepolia: `privateKey:${KEY_A}`, holesky: KEY_B} as any},
			signerProtocols: {privateKey},
		});

		expect(message).toMatch(/cannot get account for deployer/);
		expect(message).toContain('sepolia: "privateKey:<redacted>"');
		expect(message).toContain('holesky: <redacted>');
		expect(message).toMatch(/no entry for "memory"/);
		expect(message).not.toContain(KEY_A.slice(2));
		expect(message).not.toContain(KEY_B.slice(2));
		expect(message).not.toMatch(LONG_HEX);
	});

	/**
	 * A bare key with no `privateKey` protocol registered used to fall through to the same JSON
	 * dump, which for a string is the key itself. It now gets its own message, naming the fix.
	 */
	it('names the missing privateKey protocol without printing the key', async () => {
		const message = await environmentError({accounts: {deployer: KEY_A}});

		expect(message).toMatch(/named account "deployer" is configured as a private key/);
		expect(message).toMatch(/signerProtocols: \{privateKey\}/);
		expect(message).not.toContain(KEY_A.slice(2));
		expect(message).not.toMatch(LONG_HEX);
	});

	/**
	 * A key pasted WITHOUT its `0x` (the way wallets export it) is parsed as a reference to another
	 * account, and the "not an address, a private key, ..." message used to quote it verbatim.
	 */
	it('does not quote an unprefixed key mistaken for an account reference', async () => {
		const unprefixed = KEY_A.slice(2);
		const message = await environmentError({
			accounts: {deployer: unprefixed},
			signerProtocols: {privateKey},
		});

		expect(message).toMatch(/named account "deployer" is configured as <redacted>/);
		expect(message).not.toContain(unprefixed);
		expect(message).not.toMatch(LONG_HEX);
	});

	/** The redaction keeps what IS safe and useful: a genuine reference name is still quoted. */
	it('still quotes a genuine reference to a missing account', async () => {
		const message = await environmentError({
			accounts: {deployer: 'nosuchname'},
			signerProtocols: {privateKey},
		});

		expect(message).toContain('configured as "nosuchname"');
	});
});
