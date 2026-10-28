/**
 * The Hardhat connection inside deploy scripts, and in a test fixture.
 *
 * `hardhat-deploy/extensions` is the extension: spread it into `extensions` in
 * `rocketh/config.ts` and a deploy script reads `env.hardhatConnection`, the Hardhat network
 * connection of the run, or `undefined` in a run that has none (the `rocketh` command, a
 * fixture that passes only a provider). `getHardhatConnection(env)` from the package root is
 * the throwing form, for a script that requires Hardhat, and is NOT an extension: the last
 * section shows what spreading it does.
 *
 * Everything here is real: a real Hardhat in-memory network (`hre.network.connect()`, as a
 * test does), real rocketh environments on its provider, and deploy scripts run by rocketh's
 * own executor, the path `loadAndExecuteDeploymentsFromFiles` takes once it has read the
 * config and the script files.
 */

import {readFileSync} from 'node:fs';
import {afterAll, beforeAll, describe, expect, expectTypeOf, it} from 'vitest';
import {createHardhatRuntimeEnvironment} from 'hardhat/hre';
import type {NetworkConnection} from 'hardhat/types/network';
import type {ModuleObject, UserConfig} from 'rocketh/types';
import {createExecutor, enhanceEnvIfNeeded, setupDeployScripts} from 'rocketh';
import {createMapDeploymentStore, createMockPromptExecutor} from '@rocketh/test-utils';

import * as hardhatExtension from '../src/extensions.js';
import {getHardhatConnection} from '../src/index.js';

/** A `rocketh/config.ts` would export this. */
const config = {accounts: {deployer: {default: 0}}} as const satisfies UserConfig;

let connection: NetworkConnection;

beforeAll(async () => {
	const hre = await createHardhatRuntimeEnvironment({});
	connection = await hre.network.connect();
});

afterAll(async () => {
	await connection?.close();
});

/**
 * Runs deploy scripts the way `loadAndExecuteDeploymentsFromFiles` does, with the execution
 * parameters given (`provider`, and `extra: {connection}` in a Hardhat run).
 */
function runScripts(scripts: ModuleObject[], executionParams: {extra?: {connection: NetworkConnection}}) {
	return createExecutor(
		createMapDeploymentStore(),
		createMockPromptExecutor(),
	).resolveConfigAndExecuteDeployScriptModules(scripts, config, {
		provider: connection.provider,
		promptExecutor: createMockPromptExecutor(),
		...executionParams,
	});
}

describe('hardhat-deploy/extensions: env.hardhatConnection', () => {
	it('gives a deploy script the Hardhat connection of the run', async () => {
		/**
		 * rocketh/config.ts:
		 *
		 *   import * as hardhatExtension from 'hardhat-deploy/extensions';
		 *   const extensions = {...deployExtension, ...hardhatExtension};
		 *
		 * The `deploy` task passes the connection (`extra: {connection}`), and so does
		 * `loadEnvironmentFromHardhat`. A script then uses it as a property, not a method.
		 */
		const {deployScript} = setupDeployScripts({...hardhatExtension});

		let seen: NetworkConnection | undefined;
		let chainId: unknown;
		const script = deployScript(
			async (env) => {
				seen = env.hardhatConnection;
				if (env.hardhatConnection) {
					chainId = await env.hardhatConnection.provider.request({method: 'eth_chainId'});
				}
			},
			{tags: ['Debug']},
		);

		await runScripts([{id: 'debug', module: script}], {extra: {connection}});

		expect(seen).toBe(connection);
		expect(seen?.networkName).toBe(connection.networkName);
		expect(chainId).toBe('0x7a69');
	});

	it('is undefined, and the script still runs, when the run has no connection', async () => {
		/**
		 * The `rocketh` command, or a test fixture that passes only `{provider}`, gives no
		 * connection. The extension never throws, so every script still runs; one that wants the
		 * connection decides what to do without it.
		 */
		const {deployScript} = setupDeployScripts({...hardhatExtension});

		let ran = false;
		let seen: NetworkConnection | undefined = connection;
		const script = deployScript(
			async (env) => {
				ran = true;
				seen = env.hardhatConnection;
			},
			{tags: ['Debug']},
		);

		await runScripts([{id: 'debug', module: script}], {});

		expect(ran).toBe(true);
		expect(seen).toBeUndefined();
	});

	it('reaches a test fixture that passes the connection', async () => {
		/**
		 * test/utils/index.ts:
		 *
		 *   const connection = await network.connect();
		 *   const env = await loadAndExecuteDeploymentsFromFiles({
		 *     provider: connection.provider,
		 *     extra: {connection},
		 *   });
		 *
		 * `loadAndExecuteDeploymentsFromFiles` (and `loadEnvironmentFromHardhat`) return the
		 * environment with the extensions applied by `enhanceEnvIfNeeded`, so the test reads
		 * `env.hardhatConnection` too, and the deploy scripts it ran saw the same connection.
		 */
		const {deployScript} = setupDeployScripts({...hardhatExtension});
		let seenByScript: NetworkConnection | undefined;
		const script = deployScript(
			async (env) => {
				seenByScript = env.hardhatConnection;
			},
			{tags: ['Debug']},
		);

		const env = enhanceEnvIfNeeded(await runScripts([{id: 'debug', module: script}], {extra: {connection}}), {
			...hardhatExtension,
		});

		expect(seenByScript).toBe(connection);
		expect(env.hardhatConnection).toBe(connection);
		expectTypeOf(env.hardhatConnection).toEqualTypeOf<NetworkConnection | undefined>();
	});

	it('is typed as the connection or undefined', () => {
		const {deployScript} = setupDeployScripts({...hardhatExtension});
		deployScript(
			async (env) => {
				expectTypeOf(env.hardhatConnection).toEqualTypeOf<NetworkConnection | undefined>();
				// A property, not a method: calling it does not compile.
				// @ts-expect-error `hardhatConnection` is not callable
				env.hardhatConnection();
			},
			{tags: []},
		);
	});

	it('holds only curried functions, and loads without loading Hardhat', () => {
		/**
		 * `withEnvironment` calls every entry of a spread namespace with the environment, so the
		 * subpath may export nothing else (AGENTS.md). And it only imports types, so a
		 * `rocketh/config.ts` that spreads it still loads where Hardhat is not (a browser).
		 */
		for (const [name, value] of Object.entries(hardhatExtension)) {
			expect(typeof value, name).toBe('function');
		}
		const source = readFileSync(new URL('../src/extensions.ts', import.meta.url), 'utf8');
		const imports = source.split('\n').filter((line) => /^\s*import\s/.test(line));
		expect(imports.length).toBeGreaterThan(0);
		for (const line of imports) {
			expect(line).toMatch(/^\s*import type\s/);
		}
	});
});

describe('getHardhatConnection(env): the throwing form, not an extension', () => {
	it('returns the connection when the run has one', async () => {
		const {deployScript} = setupDeployScripts({});
		let seen: NetworkConnection | undefined;
		const script = deployScript(
			async (env) => {
				seen = getHardhatConnection(env);
			},
			{tags: []},
		);

		await runScripts([{id: 'requires-hardhat', module: script}], {extra: {connection}});

		expect(seen).toBe(connection);
	});

	it('breaks every run without a connection when spread into extensions', async () => {
		/**
		 * What `{...extensions, getHardhatConnection}` does: `withEnvironment` calls each entry
		 * with the environment before the script body runs, so a run without a connection fails
		 * on a script that never even asked for it. Use `hardhat-deploy/extensions` instead.
		 */
		const {deployScript} = setupDeployScripts({getHardhatConnection});
		let ran = false;
		const script = deployScript(
			async () => {
				ran = true;
			},
			{tags: []},
		);

		await expect(runScripts([{id: 'unrelated', module: script}], {})).rejects.toThrow(
			'Hardhat deploy connection not found in the environment',
		);
		expect(ran).toBe(false);
	});
});
