/**
 * The Hardhat connection inside deploy scripts, and in a test fixture.
 *
 * `hardhat-deploy/extensions` is the extension: spread it into `extensions` in
 * `rocketh/config.ts` and a deploy script gets two things:
 * - `env.hardhatConnection`, the Hardhat network connection of the run, or `undefined` in a run
 *   that has none (the `rocketh` command, a fixture that passes only a provider);
 * - `env.getHardhatConnection()`, the same connection, throwing when there is none, for a
 *   script that requires Hardhat.
 * `getHardhatConnection(env)` from the package ROOT is the throwing form without the extension,
 * and is NOT itself an extension: the last section shows what spreading it does.
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
		// The module and the internal helper it imports: any import of a PACKAGE is types only.
		for (const file of ['../src/extensions.ts', '../src/connection.ts']) {
			const source = readFileSync(new URL(file, import.meta.url), 'utf8');
			const imports = source.split('\n').filter((line) => /^\s*import\s/.test(line));
			expect(imports.length, file).toBeGreaterThan(0);
			for (const line of imports) {
				if (/from '\.\/[^']+'/.test(line)) continue;
				expect(line, file).toMatch(/^\s*import type\s/);
			}
		}
	});
});

describe('hardhat-deploy/extensions: env.getHardhatConnection()', () => {
	it('returns the connection to a script that requires Hardhat', async () => {
		/**
		 * The method form: for a script that is meaningless without Hardhat. Same extension,
		 * same spread, called as `env.getHardhatConnection()`.
		 */
		const {deployScript} = setupDeployScripts({...hardhatExtension});
		let seen: NetworkConnection | undefined;
		const script = deployScript(
			async (env) => {
				seen = env.getHardhatConnection();
			},
			{tags: ['HardhatOnly']},
		);

		await runScripts([{id: 'hardhat-only', module: script}], {extra: {connection}});

		expect(seen).toBe(connection);
	});

	it('throws only when CALLED in a run without a connection, so other scripts still run', async () => {
		/**
		 * The check happens when the script calls the method, not while the environment is set
		 * up: a script that never calls it runs in the `rocketh` command too, and the one that
		 * does fails with a message saying where the connection comes from.
		 */
		const {deployScript} = setupDeployScripts({...hardhatExtension});
		let otherRan = false;
		const other = deployScript(
			async () => {
				otherRan = true;
			},
			{tags: ['Other']},
		);
		const hardhatOnly = deployScript(
			async (env) => {
				env.getHardhatConnection();
			},
			{tags: ['HardhatOnly']},
		);

		await expect(
			runScripts(
				[
					{id: 'other', module: other},
					{id: 'hardhat-only', module: hardhatOnly},
				],
				{},
			),
		).rejects.toThrow(/^Hardhat deploy connection not found in the environment\. .*env\.hardhatConnection/);
		expect(otherRan).toBe(true);
	});

	it('is typed as a method returning the connection', () => {
		const {deployScript} = setupDeployScripts({...hardhatExtension});
		deployScript(
			async (env) => {
				expectTypeOf(env.getHardhatConnection).toEqualTypeOf<() => NetworkConnection>();
			},
			{tags: []},
		);
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
		 * What `{...extensions, getHardhatConnection}` with the ROOT import does: `withEnvironment`
		 * calls each entry with the environment before the script body runs, so a run without a
		 * connection fails on a script that never even asked for it (rocketh names the entry). Use
		 * `hardhat-deploy/extensions` instead, whose `getHardhatConnection` checks when called.
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
			/^extension entry "getHardhatConnection" threw while the environment was being set up .*: Hardhat deploy connection not found in the environment/,
		);
		expect(ran).toBe(false);
	});
});
