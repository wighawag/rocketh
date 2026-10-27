import {describe, it, expect, vi, afterEach} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {
	UnresolvableAccountsError,
	formatUnresolvableAccountsMessage,
	redactEndpoint,
} from '../src/environment/unresolvableAccounts.js';
import * as rocketh from '../src/index.js';
import type {DeploymentStore, UserConfig} from '@rocketh/core/types';

/**
 * WHERE an unresolvable named account was asked for: the endpoint, which a user running several
 * networks needs in order to tell which one failed, and which must never be printed with the API
 * key RPC providers put in its path, its query string or its credentials.
 *
 * These go through the path the `rocketh` CLI takes: no provider is handed in, so rocketh opens the
 * connection itself from the environment's `rpcUrl`, and the network boundary (`fetch`) is the only
 * thing faked.
 */

const API_KEY = 'k3yThatMustNeverBePrinted0123456789';
const RPC_URL = `https://eth-sepolia.example.invalid/v2/${API_KEY}?apikey=${API_KEY}`;

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

/** A public endpoint: it answers, and holds no keys. `eth_accounts` can also be made to fail. */
function stubPublicNode(options: {accounts: 'empty' | 'transport-failure'}) {
	vi.stubGlobal('fetch', async (url: string | URL, init: {body: string}) => {
		const request = JSON.parse(init.body) as {id: number; method: string};
		let result: unknown;
		switch (request.method) {
			case 'eth_chainId':
				result = '0xaa36a7'; // 11155111
				break;
			case 'eth_getBlockByNumber':
				result = {number: '0x0', hash: '0x' + '1'.repeat(64)};
				break;
			case 'eth_accounts':
				if (options.accounts === 'transport-failure') {
					throw new TypeError(`fetch failed: ${String(url)}`);
				}
				result = [];
				break;
			default:
				throw new Error(`stub node: ${request.method}`);
		}
		return new Response(JSON.stringify({jsonrpc: '2.0', id: request.id, result}), {
			status: 200,
			headers: {'content-type': 'application/json'},
		});
	});
}

async function cliShapedRunError(userConfig: UserConfig): Promise<UnresolvableAccountsError> {
	const config = resolveConfig({
		defaultPollingInterval: 0.001,
		chains: {11155111: {rpcUrl: RPC_URL}},
		environments: {sepolia: {chain: 11155111}},
		...userConfig,
	});
	const executionParams = {environment: 'sepolia'};
	// a chain with no public `info` warns, and this test is not about that
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const chainId = await getChainIdForEnvironment(config, 'sepolia', executionParams);
		await createEnvironment(config, resolveExecutionParams(config, executionParams, chainId), emptyStore());
	} catch (error) {
		expect(error).toBeInstanceOf(UnresolvableAccountsError);
		return error as UnresolvableAccountsError;
	}
	throw new Error('expected environment construction to fail');
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('redactEndpoint', () => {
	it('keeps the scheme, host and port, which is what tells two networks apart', () => {
		expect(redactEndpoint('http://localhost:8545')).toBe('http://localhost:8545');
		expect(redactEndpoint('http://127.0.0.1:8545/')).toBe('http://127.0.0.1:8545');
		expect(redactEndpoint('wss://mainnet.example.invalid')).toBe('wss://mainnet.example.invalid');
	});

	it('withholds a path, a query string, a fragment and credentials as a whole', () => {
		expect(redactEndpoint(`https://sepolia.infura.io/v3/${API_KEY}`)).toBe('https://sepolia.infura.io/<redacted>');
		expect(redactEndpoint(`https://rpc.example.invalid?apikey=${API_KEY}`)).toBe(
			'https://rpc.example.invalid?<redacted>',
		);
		expect(redactEndpoint(`https://user:${API_KEY}@rpc.example.invalid:8443/x#${API_KEY}`)).toBe(
			'https://<redacted>@rpc.example.invalid:8443/<redacted>#<redacted>',
		);
	});

	it('withholds a value that is not a URL entirely', () => {
		expect(redactEndpoint(API_KEY)).toBe('<redacted endpoint>');
		expect(redactEndpoint('/var/run/geth.ipc')).toBe('<redacted endpoint>');
	});
});

describe('an unresolvable account, on an endpoint rocketh opened from `rpcUrl`', () => {
	it('names the endpoint it asked, without its key', async () => {
		stubPublicNode({accounts: 'empty'});
		const error = await cliShapedRunError({accounts: {deployer: 0}});

		expect(error.message).toMatch(
			/^cannot resolve the named account "deployer" for environment "sepolia" \(chain 11155111, endpoint https:\/\/eth-sepolia\.example\.invalid\/<redacted>\?<redacted>\):/,
		);
		expect(error.data.endpoint).toBe('https://eth-sepolia.example.invalid/<redacted>?<redacted>');
		expect(error.message + JSON.stringify(error.data)).not.toContain(API_KEY);
	});

	it("does not print the endpoint's key when 'eth_accounts' fails with an error quoting the url", async () => {
		stubPublicNode({accounts: 'transport-failure'});
		const error = await cliShapedRunError({accounts: {deployer: 0}});

		expect(error.data.accounts[0].reason).toBe('node-accounts-unavailable');
		expect(error.message).toContain("'eth_accounts' failed");
		expect(error.message + JSON.stringify(error.data)).not.toContain(API_KEY);
		// Nor through the cause, which a caller logging the error (`console.error(err)`) prints too.
		expect((error.cause as Error).message).toContain('https://eth-sepolia.example.invalid/<redacted>');
		expect((error.cause as Error).message).not.toContain(API_KEY);
	});
});

describe('the exported surface', () => {
	it('exports the error, its formatter and the redaction from the package root', () => {
		expect(rocketh.UnresolvableAccountsError).toBe(UnresolvableAccountsError);
		expect(rocketh.formatUnresolvableAccountsMessage).toBe(formatUnresolvableAccountsMessage);
		expect(rocketh.redactEndpoint).toBe(redactEndpoint);
	});

	it('lets an entry point replace the fix for accounts given by index, and only that', () => {
		const data = {
			environment: 'sepolia',
			chainId: '11155111',
			nodeAccountCount: 0,
			accounts: [
				{name: 'deployer', reason: 'node-has-no-accounts', definition: 'index 0', index: 0},
				{name: 'owner', reason: 'unknown-reference', definition: '"nosuchname"'},
			],
		} as const;
		const message = formatUnresolvableAccountsMessage(data, {nodeAccountsFix: 'FIX FROM THE ENTRY POINT'});
		expect(message.split('\n').at(-1)).toBe('FIX FROM THE ENTRY POINT');
		expect(message).not.toContain('rocketh/config.ts');
		expect(message).toContain('"owner" is configured as "nosuchname"');

		// With no account given by index, there is no fix of that kind to give.
		expect(
			formatUnresolvableAccountsMessage({...data, accounts: [data.accounts[1]]}, {nodeAccountsFix: 'FIX'}),
		).not.toContain('FIX');
	});
});
