/**
 * `@rocketh/playground` — Integration Tests
 *
 * These run the SAME code path the documentation widget runs, with the UI removed: a real
 * rocketh deploy script, a real EVM, a real deployment store. They run under node rather than
 * in a browser, which is the point of the core being framework-free: the logic is provable
 * without a browser runner, and the browser test that follows proves only the runtime.
 */
import {describe, expect, it} from 'vitest';
import {createPlayground, greetingsRegistryPlayground} from '../src/index.js';

describe('@rocketh/playground - Integration Tests', () => {
	describe('Running a deploy script against an in-browser EVM', () => {
		it('should deploy a real upgradeable contract and put CODE at every recorded address', async () => {
			/**
			 * Example: the whole widget, minus the button.
			 *
			 * A definition plus `createPlayground` is all it takes to execute a deploy script
			 * with no node, no wallet and no network.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);

			const result = await playground.run();

			expect(result.status).toBe('success');
			expect(result.error).toBeUndefined();

			// A proxy over a MISSING implementation deploys "successfully" and then answers
			// `0x` to every call, so an address on its own proves nothing. Only code at that
			// address does, and `run()` fails the run when any recorded address has none.
			expect(result.deployments.length).toBeGreaterThan(0);
			for (const deployment of result.deployments) {
				expect(deployment.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
				expect(deployment.codeSize).toBeGreaterThan(0);
			}

			// The proxy, its implementation, and the proxy record the deploy script names.
			const names = result.deployments.map((d) => d.name);
			expect(names).toContain('GreetingsRegistry');
			expect(names).toContain('GreetingsRegistry_Implementation');
		}, 120_000);

		it('should record the deployment files in the store, so a UI can render them appearing', async () => {
			/**
			 * Example: watching deployment files land.
			 *
			 * The store is backed by an observable in-memory file system. Subscribing to it is
			 * how the widget renders `deployments/<env>/<Name>.json` filling in mid-run,
			 * rather than only reporting a result at the end.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);

			const observed: string[] = [];
			playground.vfs.subscribe((change) => {
				if (change.type === 'write') {
					observed.push(change.path);
				}
			});

			const result = await playground.run();

			// `.chain` is written BEFORE the first deployment, so a later load can tell which
			// chain these files belong to.
			expect(result.writes[0]).toBe('deployments/browser/.chain');
			expect(result.files).toContain('deployments/browser/.chain');
			expect(result.files).toContain('deployments/browser/GreetingsRegistry.json');
			expect(result.files).toContain('deployments/browser/GreetingsRegistry_Implementation.json');

			// The subscriber saw the same writes the result reports: what a UI renders live and
			// what a test asserts afterwards cannot drift apart.
			expect(observed).toEqual([...result.writes]);
		}, 120_000);

		it('should store a deployment whose address and ABI are readable back', async () => {
			/**
			 * Example: what a stored deployment actually contains.
			 *
			 * The widget shows the JSON, so the JSON has to be the real deployment record and
			 * not a summary the playground invented.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);
			await playground.run();

			const stored = JSON.parse(playground.vfs.read('deployments/browser/GreetingsRegistry.json'));

			expect(stored.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(Array.isArray(stored.abi)).toBe(true);
			expect(stored.abi.length).toBeGreaterThan(0);
		}, 120_000);
	});

	describe('Streaming what the deploy script printed', () => {
		it("should capture the deploy script's own console output, not just a success message", async () => {
			/**
			 * Example: the log stream.
			 *
			 * A deploy script talks to its user with `console.log`. Reporting "deployment
			 * succeeded" instead would hide the thing the reader came to see, so the run
			 * captures the console and tags each line with where it came from.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);

			const streamed: string[] = [];
			playground.logs.subscribe((change) => {
				if (change.type === 'append') {
					streamed.push(`${change.entry.source}: ${change.entry.text}`);
				}
			});

			const result = await playground.run();

			const scriptLines = result.logs.filter((entry) => entry.source === 'script').map((entry) => entry.text);
			expect(scriptLines.some((line) => line.includes('GreetingsRegistry proxy deployed at 0x'))).toBe(true);

			// The message comes back WITHOUT the `proxy:` prefix the script passed as a
			// constructor argument. That is not a bug in the widget, and not a bug in the
			// script either: a constructor runs against the IMPLEMENTATION's storage, never the
			// proxy's, and this script passes no `execute: 'init'` to write the proxy's own
			// slot. It is pinned here so a future "fix" has to argue with a test.
			expect(scriptLines).toContain('Current message for deployer: ""');

			// A subscriber that attached before the run saw every line the result reports.
			expect(streamed.length).toBe(result.logs.length);
			expect(result.logs.at(-1)?.source).toBe('success');
		}, 120_000);

		it('should not print an error line during a run that succeeded', async () => {
			/**
			 * A reader watching a red line scroll past a successful deploy learns the wrong
			 * thing, so a successful run has to be quiet.
			 *
			 * The specific line this guards against: `getChainConfigFromUserConfig`
			 * (packages/rocketh/src/environment/chains.ts) writes `chain with id <id> has no
			 * public info` to console.ERROR for a chain it does not recognise, which every local
			 * chain is. `buildUserConfig` declares the chain so rocketh has nothing to complain
			 * about, rather than the widget filtering the message out by matching its text.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);

			const result = await playground.run();

			expect(result.status).toBe('success');
			expect(result.logs.filter((entry) => entry.source === 'error')).toEqual([]);
			expect(result.logs.filter((entry) => entry.source === 'warning')).toEqual([]);
		}, 120_000);

		it('should restore the console once the run is over', async () => {
			/**
			 * Capturing the console is process-global, so failing to restore it would silently
			 * swallow every later log in the page (or in the rest of the test suite).
			 */
			const before = console.log;

			const playground = createPlayground(greetingsRegistryPlayground);
			await playground.run();

			expect(console.log).toBe(before);
		}, 120_000);
	});

	describe('Running more than once', () => {
		it('should redeploy from scratch on a second run rather than reporting the first run as done', async () => {
			/**
			 * Example: pressing Run twice.
			 *
			 * rocketh skips a deployment it already has a record of. A widget whose second
			 * press did nothing would look broken, so each run starts from an empty store and
			 * a fresh chain.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);

			const first = await playground.run();
			const second = await playground.run();

			expect(first.status).toBe('success');
			expect(second.status).toBe('success');
			expect(second.writes[0]).toBe('deployments/browser/.chain');
			expect(second.deployments.map((d) => d.name)).toEqual(first.deployments.map((d) => d.name));

			// The implementation is deployed with CREATE2, so it lands at the same address on
			// every run. That determinism is what the script's `deterministicImplementation`
			// asks for, and it is worth pinning.
			const implementationOf = (r: typeof first) => r.deployments.find((d) => d.name.endsWith('_Implementation'));
			expect(implementationOf(second)?.address).toBe(implementationOf(first)?.address);
		}, 180_000);

		it('should report the previous run only, with logs cleared', async () => {
			const playground = createPlayground(greetingsRegistryPlayground);

			const first = await playground.run();
			const second = await playground.run();

			expect(second.logs[0]?.seq).toBe(0);
			expect(second.logs.length).toBeLessThanOrEqual(first.logs.length + 1);
			// Unique keys across the whole run. A view keying rows on `seq` breaks otherwise, and
			// only on the SECOND press. See the `each_key_duplicate` regression pinned in
			// `log-stream.test.ts`.
			expect(new Set(second.logs.map((entry) => entry.seq)).size).toBe(second.logs.length);
		}, 180_000);
	});

	describe('Refusing configurations that fail silently', () => {
		it('should refuse the environment names rocketh treats as ephemeral', () => {
			/**
			 * `resolveExecutionParams` (packages/rocketh/src/executor/index.ts) forces
			 * `saveDeployments` OFF for `memory`, `hardhat` and `default`. A playground named
			 * after one of them would run, succeed, and store NOTHING, leaving a blank widget
			 * and no error to explain it. Cheaper to refuse it at construction.
			 */
			for (const name of ['memory', 'hardhat', 'default']) {
				expect(() => createPlayground({...greetingsRegistryPlayground, environment: name})).toThrow(
					/must not be one of/,
				);
			}

			expect(() => createPlayground({...greetingsRegistryPlayground, environment: 'browser'})).not.toThrow();
		});
	});
});
