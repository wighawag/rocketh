/**
 * `@rocketh/playground` — Integration Tests
 *
 * These run the SAME code path the documentation tutorial runs, with the UI removed: real
 * rocketh deploy scripts, a real EVM, a real deployment store, one chain across four steps.
 * They run under node rather than in a browser, which is the point of the core being
 * framework-free: the logic is provable without a browser runner.
 */
import {describe, expect, it} from 'vitest';
import {createPlayground, greetingsRegistryPlayground, type Playground, type StepResult} from '../src/index.js';

const STEP_TIMEOUT = 120_000;

/** Run every step in order, returning each result. Fails loudly on the first failing step. */
async function runAll(playground: Playground): Promise<StepResult[]> {
	const results: StepResult[] = [];
	while (!playground.isFinished()) {
		const result = await playground.runNextStep();
		if (result.status === 'failure') {
			throw new Error(`step ${result.stepId} failed: ${result.error}`);
		}
		results.push(result);
	}
	return results;
}

const scriptLines = (result: StepResult) => result.logs.filter((e) => e.source === 'script').map((e) => e.text);

describe('@rocketh/playground - Integration Tests', () => {
	describe('Step 1: deploying behind a proxy', () => {
		it(
			'should deploy a real upgradeable contract with CODE at every recorded address',
			async () => {
				/**
				 * Example: the first step of the tutorial, which is the whole of level 1.
				 *
				 * A definition plus `createPlayground` executes a deploy script with no node, no
				 * wallet and no network.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				const result = await playground.runNextStep();

				expect(result.status).toBe('success');
				// A proxy over a MISSING implementation deploys "successfully" and then answers
				// `0x` to every call, so an address alone proves nothing. Only code does, and the
				// step fails when any recorded address has none.
				expect(result.deployments.length).toBeGreaterThan(0);
				for (const deployment of result.deployments) {
					expect(deployment.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
					expect(deployment.codeSize).toBeGreaterThan(0);
					expect(deployment.change).toBe('new');
				}
				expect(result.deployments.map((d) => d.name)).toContain('GreetingsRegistry');
			},
			STEP_TIMEOUT,
		);

		it(
			'should record the deployment files in the store, so a UI can render them appearing',
			async () => {
				/**
				 * Example: watching deployment files land. Subscribing to the store's file system is
				 * how the widget renders `deployments/<env>/<Name>.json` filling in mid-run.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);
				const observed: string[] = [];
				playground.vfs.subscribe((change) => {
					if (change.type === 'write') {
						observed.push(change.path);
					}
				});

				const result = await playground.runNextStep();

				// `.chain` is written BEFORE the first deployment, so a later load can tell which
				// chain these files belong to.
				expect(result.writes[0]).toBe('deployments/browser/.chain');
				expect(result.files).toContain('deployments/browser/GreetingsRegistry.json');
				expect(result.files).toContain('deployments/browser/GreetingsRegistry_Implementation.json');
				expect(observed).toEqual([...result.writes]);
			},
			STEP_TIMEOUT,
		);
	});

	describe('Step 2: the bug a constructor cannot avoid', () => {
		it(
			'should read the greeting back WITHOUT the prefix the constructor was given',
			async () => {
				/**
				 * Example: the mistake the tutorial exists to show.
				 *
				 * The deploy script passes `prefix` as a constructor argument. A constructor runs
				 * against the IMPLEMENTATION's storage, never the proxy's, so the proxy's own
				 * `_prefix` slot is never written and greetings come back bare.
				 *
				 * Pinned as an assertion so a well-meaning "fix" to the script has to argue with a
				 * test rather than quietly delete the lesson.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				await playground.runNextStep();
				const result = await playground.runNextStep();

				expect(result.status).toBe('success');
				// Asserted on the `read back` line specifically, not on the absence of the string
				// anywhere: the script also PRINTS what it expected, so a substring search over the
				// whole transcript matches the explanation and proves nothing.
				const readBack = scriptLines(result).find((line) => line.startsWith('read back'));
				expect(readBack).toBe('read back  -> "hello"');
			},
			STEP_TIMEOUT,
		);
	});

	describe('Step 3: upgrading the implementation', () => {
		it(
			'should keep the proxy address and replace the implementation address',
			async () => {
				/**
				 * Example: what an upgrade actually is.
				 *
				 * The address you hand out never changes; the code behind it does. That is the
				 * entire argument for a proxy, and the change markers make it visible.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				const afterDeploy = await playground.runNextStep();
				await playground.runNextStep();
				const afterUpgrade = await playground.runNextStep();

				const proxyBefore = afterDeploy.deployments.find((d) => d.name === 'GreetingsRegistry');
				const proxyAfter = afterUpgrade.deployments.find((d) => d.name === 'GreetingsRegistry');
				const implBefore = afterDeploy.deployments.find((d) => d.name === 'GreetingsRegistry_Implementation');
				const implAfter = afterUpgrade.deployments.find((d) => d.name === 'GreetingsRegistry_Implementation');

				expect(proxyAfter?.address).toBe(proxyBefore?.address);
				expect(proxyAfter?.change).toBe('unchanged');

				expect(implAfter?.address).not.toBe(implBefore?.address);
				expect(implAfter?.change).toBe('changed');
				expect(implAfter?.codeSize).toBeGreaterThan(0);

				// The proxy has held its address since step 1; the implementation only since step 3.
				expect(proxyAfter?.changedAtStep).toBe(1);
				expect(implAfter?.changedAtStep).toBe(3);
			},
			STEP_TIMEOUT,
		);

		it(
			'should still say WHEN each address last moved once the tutorial has moved on',
			async () => {
				/**
				 * `change` is relative to the PREVIOUS step only, so by step 4 everything reads
				 * `unchanged` and the upgrade becomes invisible in the panel. `changedAtStep` is
				 * what lets the UI keep saying the proxy has held its address since step 1 while
				 * the implementation only since step 3, at any point in the tutorial rather than
				 * during a single step of it.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				const results = await runAll(playground);
				const final = results[3]!;

				const proxy = final.deployments.find((d) => d.name === 'GreetingsRegistry');
				const implementation = final.deployments.find((d) => d.name === 'GreetingsRegistry_Implementation');

				expect(proxy?.change).toBe('unchanged');
				expect(proxy?.changedAtStep).toBe(1);
				expect(implementation?.change).toBe('unchanged');
				expect(implementation?.changedAtStep).toBe(3);
			},
			STEP_TIMEOUT * 2,
		);

		it(
			'should preserve storage written by the previous implementation',
			async () => {
				/**
				 * Example: an upgrade replaces CODE, not STORAGE.
				 *
				 * The greeting written in step 2, by the old implementation, is still readable
				 * through the new one. This is also why v2 may only APPEND storage variables.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				await playground.runNextStep();
				await playground.runNextStep();
				const afterUpgrade = await playground.runNextStep();

				expect(scriptLines(afterUpgrade)).toContain('old greeting still stored -> "hello"');
			},
			STEP_TIMEOUT,
		);

		it(
			'should set the prefix through the proxy, where the constructor could not',
			async () => {
				// `execute: {methodName: 'postUpgrade'}` is called THROUGH the proxy as part of the
				// upgrade, so it writes the storage the proxy really reads.
				const playground = createPlayground(greetingsRegistryPlayground);

				await playground.runNextStep();
				await playground.runNextStep();
				const afterUpgrade = await playground.runNextStep();

				expect(scriptLines(afterUpgrade).some((line) => line.startsWith('prefix     -> "proxy:"'))).toBe(true);
			},
			STEP_TIMEOUT,
		);
	});

	describe('Step 4: what an upgrade does and does not change', () => {
		it(
			'should prefix a NEW greeting while leaving the old one exactly as it was',
			async () => {
				/**
				 * Example: the asymmetry that makes upgrades subtle.
				 *
				 * New writes go through the new code and get the prefix. The value written in step
				 * 2 was produced by the old code and is not rewritten by the upgrade.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				const results = await runAll(playground);
				const lastStep = results[3];

				expect(lastStep).toBeDefined();
				expect(scriptLines(lastStep!)).toContain('read back  -> "proxy:hello again"   (prefixed, at last)');
			},
			STEP_TIMEOUT * 2,
		);

		it(
			'should finish the tutorial with every step done',
			async () => {
				const playground = createPlayground(greetingsRegistryPlayground);

				await runAll(playground);

				expect(playground.isFinished()).toBe(true);
				expect(playground.steps().map((s) => s.status)).toEqual(['done', 'done', 'done', 'done']);
				await expect(playground.runNextStep()).rejects.toThrow(/already run/);
			},
			STEP_TIMEOUT * 2,
		);
	});

	describe('One chain across every step', () => {
		it(
			'should never re-run an earlier step, so the log reads as one transcript',
			async () => {
				/**
				 * The steps share a chain and a store, which is the only reason step 3 can find the
				 * proxy step 1 deployed. It also means the log accumulates rather than resetting.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				const results = await runAll(playground);

				// Each step's log contains everything before it.
				expect(results[0]!.logs.length).toBeLessThan(results[3]!.logs.length);
				// One boot for the whole tutorial, not one per step.
				const boots = results[3]!.logs.filter((entry) => entry.text.includes('booting an in-browser EVM'));
				expect(boots).toHaveLength(1);
				// Every seq unique, so a keyed list can render the transcript.
				const seqs = results[3]!.logs.map((entry) => entry.seq);
				expect(new Set(seqs).size).toBe(seqs.length);
			},
			STEP_TIMEOUT * 2,
		);

		it(
			'should report each step in the log with its position',
			async () => {
				const playground = createPlayground(greetingsRegistryPlayground);

				const results = await runAll(playground);

				const stepLines = results[3]!.logs.filter((entry) => entry.source === 'step').map((entry) => entry.text);
				expect(stepLines).toEqual([
					'Step 1 of 4: Deploy behind a proxy',
					'Step 2 of 4: Write a greeting',
					'Step 3 of 4: Upgrade the implementation',
					'Step 4 of 4: Write another greeting',
				]);
			},
			STEP_TIMEOUT * 2,
		);

		it(
			'should not print an error line during steps that succeeded',
			async () => {
				/**
				 * A reader watching a red line scroll past a successful deploy learns the wrong
				 * thing. The specific line this guards against: `getChainConfigFromUserConfig`
				 * writes `chain with id <id> has no public info` to console.ERROR for a chain it
				 * does not recognise, which every local chain is. `buildUserConfig` declares the
				 * chain so rocketh has nothing to complain about, rather than the widget filtering
				 * the message out by matching its text.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);

				const results = await runAll(playground);

				expect(results[3]!.logs.filter((entry) => entry.source === 'error')).toEqual([]);
				expect(results[3]!.logs.filter((entry) => entry.source === 'warning')).toEqual([]);
			},
			STEP_TIMEOUT * 2,
		);

		it(
			'should restore the console once a step is over',
			async () => {
				// Capturing the console is process-global, so failing to restore it would silently
				// swallow every later log in the page (or in the rest of the test suite).
				const before = console.log;

				const playground = createPlayground(greetingsRegistryPlayground);
				await playground.runNextStep();

				expect(console.log).toBe(before);
			},
			STEP_TIMEOUT,
		);
	});

	describe('Starting over', () => {
		it(
			'should reset to step one on a fresh chain',
			async () => {
				/**
				 * Example: the Start again button.
				 *
				 * A reader who has finished must be able to run it again from scratch, which needs
				 * a NEW chain: replaying step 1 against the upgraded state would deploy nothing.
				 */
				const playground = createPlayground(greetingsRegistryPlayground);
				await runAll(playground);

				await playground.reset();

				expect(playground.isFinished()).toBe(false);
				expect(playground.nextStepIndex()).toBe(0);
				expect(playground.steps().map((s) => s.status)).toEqual(['pending', 'pending', 'pending', 'pending']);
				expect(playground.vfs.paths()).toEqual([]);
				expect(playground.logs.entries()).toEqual([]);

				const afterReset = await playground.runNextStep();
				expect(afterReset.status).toBe('success');
				// Everything is new again, which would be impossible on the old chain.
				expect(afterReset.deployments.every((d) => d.change === 'new')).toBe(true);
			},
			STEP_TIMEOUT * 3,
		);

		it(
			'should deploy the implementation to the same address after a reset',
			async () => {
				// CREATE2, so the implementation address is a property of the bytecode and the
				// salt, not of when it was deployed. The docs claim the addresses are the same for
				// every reader, and this is what makes that true.
				const playground = createPlayground(greetingsRegistryPlayground);

				const first = await playground.runNextStep();
				await playground.reset();
				const second = await playground.runNextStep();

				const implementation = (result: StepResult) =>
					result.deployments.find((d) => d.name === 'GreetingsRegistry_Implementation')?.address;
				expect(implementation(second)).toBe(implementation(first));
			},
			STEP_TIMEOUT * 2,
		);
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

		it('should refuse a playground with no steps', () => {
			expect(() => createPlayground({...greetingsRegistryPlayground, steps: []})).toThrow(/at least one step/);
		});
	});
});
