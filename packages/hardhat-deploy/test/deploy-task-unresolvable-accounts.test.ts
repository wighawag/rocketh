/**
 * `pnpm hardhat --network sepolia deploy` with named accounts given by index and no keys
 * configured for that hardhat network: what hardhat-deploy reports.
 *
 * Under hardhat the accounts at an index are the ones the HARDHAT NETWORK's `accounts` configure,
 * so the fix is in the hardhat config (or, for a network added by hardhat-deploy's helpers, the
 * `MNEMONIC_<network>` environment variable), not in `rocketh/config.ts`. And it is a configuration
 * mistake, not a crash, so it is raised as a `HardhatPluginError`: hardhat prints a plugin error as
 * its message alone, without the stack trace and the "report a bug in Hardhat" text it adds to an
 * unexpected error.
 *
 * The error itself is the REAL one, from a real environment (`createTestEnvironment`); only the
 * hardhat connection and `loadAndExecuteDeploymentsFromFiles` are stood in for, the latter so that
 * it raises that error.
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {HardhatPluginError} from 'hardhat/plugins';
import {createTestEnvironment} from '@rocketh/test-utils';
import {UnresolvableAccountsError} from 'rocketh';

const API_KEY = 'hArdhatUrlKeyThatMustNotBePrinted0123';
const SEPOLIA_URL = `https://eth-sepolia.example.invalid/v2/${API_KEY}`;
const OTHER_NETWORK_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const state = vi.hoisted(() => ({
	error: undefined as unknown,
	connection: undefined as unknown,
}));

vi.mock('@rocketh/node', async (importOriginal) => {
	const original = await importOriginal<typeof import('@rocketh/node')>();
	return {
		...original,
		loadAndExecuteDeploymentsFromFiles: vi.fn(async () => {
			throw state.error;
		}),
	};
});

vi.mock('../src/helpers.js', () => ({
	generateForkConfig: vi.fn(async () => ({
		connection: state.connection,
		environment: 'sepolia',
		isFork: false,
		provider: {},
	})),
}));

const {default: runDeployTask} = await import('../src/tasks/deploy.js');
const {toHardhatAccountsError} = await import('../src/account-errors.js');

const BASE_ARGS = {skipPrompts: true, reportGasUsed: false, noCompile: true};

/** A configuration value as hardhat resolves it (`ResolvedConfigurationVariable`). */
function resolved(value: string) {
	return {
		_type: 'ResolvedConfigurationVariable',
		format: '{variable}',
		get: async () => value,
		getUrl: async () => value,
	};
}

/** The real error a sepolia run raises: `deployer: 0` and `admin: 1`, on a node with no keys. */
async function sepoliaNoKeysError(): Promise<UnresolvableAccountsError> {
	try {
		await createTestEnvironment({
			accounts: {deployer: {default: 0, mainnet: `privateKey:${OTHER_NETWORK_KEY}`}, admin: 1},
			nodeAccounts: [],
			chainId: 11155111,
			environmentName: 'sepolia',
		});
	} catch (error) {
		if (error instanceof UnresolvableAccountsError) return error;
		throw error;
	}
	throw new Error('expected the environment to refuse its named accounts');
}

async function runTask(): Promise<unknown> {
	try {
		await (runDeployTask as unknown as (args: unknown, hre: unknown) => Promise<void>)(BASE_ARGS, {});
	} catch (error) {
		return error;
	}
	throw new Error('expected the deploy task to fail');
}

describe('hardhat-deploy `deploy` task: named accounts that cannot be resolved', () => {
	beforeEach(() => {
		state.error = undefined;
		state.connection = undefined;
	});

	it('reports a network with no keys configured as a plugin error, with the hardhat fix', async () => {
		/**
		 * Example: `sepolia` added by hardhat-deploy's `addNetworksFromKnownList`, with no
		 * `MNEMONIC_sepolia` (nor `MNEMONIC`) set, so its `accounts` resolve to 'remote'.
		 */
		state.error = await sepoliaNoKeysError();
		state.connection = {
			networkName: 'sepolia',
			networkConfig: {type: 'http', url: resolved(SEPOLIA_URL), accounts: 'remote'},
		};

		const error = await runTask();

		expect(HardhatPluginError.isHardhatPluginError(error)).toBe(true);
		expect((error as HardhatPluginError).pluginId).toBe('hardhat-deploy');
		expect((error as Error).message).toBe(
			[
				`cannot resolve 2 named accounts ("deployer", "admin") for environment "sepolia" (chain 11155111, endpoint https://eth-sepolia.example.invalid/<redacted>):`,
				`  - "deployer" is configured as index 0, but the node lists no accounts.`,
				`  - "admin" is configured as index 1, but the node lists no accounts.`,
				`The hardhat network "sepolia" configures no accounts (its \`accounts\` is 'remote'), so hardhat asks the node for its own, and this node holds none.`,
				`To fix it, configure accounts for "sepolia" in your hardhat config, for example \`accounts: {mnemonic: configVariable('MNEMONIC_sepolia')}\` or \`accounts: [configVariable('DEPLOYER_PRIVATE_KEY')]\`. If "sepolia" is added by hardhat-deploy's \`addNetworksFromEnv\` or \`addNetworksFromKnownList\`, set the environment variable MNEMONIC_sepolia to the mnemonic (or MNEMONIC, which every network without its own falls back to); the value SECRET reads it from the configuration variable SECRET_MNEMONIC_sepolia instead.`,
				`Alternatively, in the \`accounts\` of rocketh/config.ts, give the account a signer protocol (for example 'privateKey:...', read from the environment) or an address for "sepolia".`,
			].join('\n'),
		);
		// No parent error is attached: it is what `--show-stack-traces` would print.
		expect((error as {parent?: unknown}).parent).toBeUndefined();
		expect((error as Error).message).not.toContain(API_KEY);
		expect((error as Error).message).not.toContain(OTHER_NETWORK_KEY.slice(2));
	});

	it('maps a dashed network name to the variable the helpers read', async () => {
		const error = await toHardhatAccountsError(await sepoliaNoKeysError(), {
			networkName: 'arbitrum-sepolia',
			networkConfig: {type: 'http', url: resolved(SEPOLIA_URL), accounts: 'remote'} as never,
		});
		expect(error.message).toContain('set the environment variable MNEMONIC_arbitrum_sepolia to the mnemonic');
		expect(error.message).toContain('configuration variable SECRET_MNEMONIC_arbitrum_sepolia');
	});

	it('reports an index beyond what the hardhat network derives, naming `accounts.count`', async () => {
		let raised: UnresolvableAccountsError | undefined;
		try {
			await createTestEnvironment({
				accounts: {deployer: 0, admin: 2},
				nodeAccounts: ['0x70997970c51812dc3a010c7d01b50e0d17dc79c8', '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'],
				environmentName: 'localhost',
			});
		} catch (error) {
			raised = error as UnresolvableAccountsError;
		}
		const error = await toHardhatAccountsError(raised!, {
			networkName: 'localhost',
			networkConfig: {
				type: 'http',
				url: resolved('http://127.0.0.1:8545'),
				accounts: {mnemonic: resolved('test test test'), count: 2, initialIndex: 0, passphrase: resolved(''), path: ''},
			} as never,
		});

		expect(error.message).toContain('endpoint http://127.0.0.1:8545)');
		expect(error.message).toContain(
			'"admin" is configured as index 2, but the node lists 2 accounts (indexes 0 to 1).',
		);
		expect(error.message).toContain(
			'The hardhat network "localhost" derives 2 account(s) from its mnemonic (`accounts.count`), so only indexes 0 to 1 exist.',
		);
		expect(error.message).not.toContain('MNEMONIC_');
	});

	it('names the in-process network, and the url it forks, redacted', async () => {
		const error = await toHardhatAccountsError(await sepoliaNoKeysError(), {
			networkName: 'fork',
			networkConfig: {
				type: 'edr-simulated',
				accounts: [{privateKey: resolved(OTHER_NETWORK_KEY), balance: 1n}],
				forking: {enabled: true, url: resolved(SEPOLIA_URL), cacheDir: ''},
			} as never,
		});
		expect(error.message).toContain(
			"(chain 11155111, endpoint hardhat's in-process network, forking https://eth-sepolia.example.invalid/<redacted>):",
		);
		expect(error.message).toContain('is configured with 1 private key(s) in its `accounts`');
		expect(error.message).not.toContain(API_KEY);
		expect(error.message).not.toContain(OTHER_NETWORK_KEY.slice(2));
	});

	it('leaves any other error untouched', async () => {
		state.error = new TypeError('a genuine bug');
		state.connection = {networkName: 'sepolia', networkConfig: {type: 'http', accounts: 'remote'}};
		expect(await runTask()).toBe(state.error);
	});
});
