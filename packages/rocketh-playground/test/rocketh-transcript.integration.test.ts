/**
 * `@rocketh/playground`: rocketh's own transcript in the log stream.
 *
 * rocketh logs through `named-logs`, which binds each module's logger when the module is
 * EVALUATED. So the factory has to be installed before rocketh loads, and this file is shaped
 * the way a host's worker would be:
 *
 * 1. Its static imports are `vitest` and `@rocketh/playground/log` (here `../src/log.js`) only.
 *    That entry must not import rocketh: if it did, rocketh's loggers would be bound to "no
 *    factory" before the next line ran, and every assertion on a `'rocketh'` line below would fail.
 * 2. The module body installs the factory.
 * 3. Only then is the rest of the package (and with it rocketh) imported, dynamically.
 *
 * Installed through `globalThis._logFactory`, which `named-logs` reads; a host with `named-logs`
 * as a dependency would call its `hook()` instead.
 */
import {describe, expect, it} from 'vitest';
import {createLogFactory, createLogStream, type LogEntry, type LogStream} from '../src/log.js';

let current: LogStream | undefined;
(globalThis as {_logFactory?: unknown})._logFactory = createLogFactory(() => current);

const {createPlayground, greetingsRegistryPlayground} = await import('../src/index.js');

const STEP_TIMEOUT = 120_000;

const lines = (entries: readonly LogEntry[], source: LogEntry['source']) =>
	entries.filter((e) => e.source === source).map((e) => e.text);

describe('@rocketh/playground: rocketh transcript', () => {
	it(
		"should show rocketh's own lines under 'rocketh', beside what the script printed",
		async () => {
			/**
			 * Example: routing rocketh's transcript into the playground's own stream.
			 *
			 * The factory is installed once, for the life of the realm, and pointed at the
			 * stream of the run in flight; outside a run it drops the line.
			 */
			const playground = createPlayground(greetingsRegistryPlayground);
			current = playground.logs;
			try {
				const result = await playground.runNextStep();
				expect(result.status).toBe('success');

				const rocketh = lines(result.logs, 'rocketh');
				expect(rocketh.some((text) => text.startsWith('- Executing'))).toBe(true);
				// The script's own console output is still the script's.
				expect(lines(result.logs, 'script').length).toBeGreaterThan(0);
				expect(lines(result.logs, 'script').some((text) => text.startsWith('- Executing'))).toBe(false);
				// rocketh's bare spacing newline after each script is not an empty row.
				expect(result.logs.every((e) => e.text.trim() !== '')).toBe(true);

				// In order: rocketh announces the script before the script prints anything.
				const firstExecuting = result.logs.findIndex((e) => e.source === 'rocketh' && e.text.startsWith('- Executing'));
				const firstScript = result.logs.findIndex((e) => e.source === 'script');
				expect(firstExecuting).toBeGreaterThanOrEqual(0);
				expect(firstExecuting).toBeLessThan(firstScript);
			} finally {
				current = undefined;
				await playground.dispose();
			}
		},
		STEP_TIMEOUT,
	);

	it(
		'should say "reusing" when a re-run finds the deployment already there',
		async () => {
			/**
			 * Example: the line that tells a reader rocketh skipped work.
			 *
			 * The same deploy script run twice against one chain: the second run finds what the
			 * first deployed, sends nothing for it, and rocketh says so.
			 */
			const [deployStep] = greetingsRegistryPlayground.steps;
			const playground = createPlayground({
				...greetingsRegistryPlayground,
				steps: [deployStep, {...deployStep, id: 'deploy_again', label: 'Deploy again'}],
			});
			current = playground.logs;
			try {
				expect((await playground.runNextStep()).status).toBe('success');
				const second = await playground.runNextStep();
				expect(second.status).toBe('success');
				expect(lines(second.logs, 'rocketh').some((text) => text.startsWith('reusing "'))).toBe(true);
			} finally {
				current = undefined;
				await playground.dispose();
			}
		},
		STEP_TIMEOUT,
	);
});

describe('createLogFactory', () => {
	it('should map severities, drop debug by default, and drop lines when no stream is current', () => {
		const logs = createLogStream();
		let target: LogStream | undefined = logs;
		const logger = createLogFactory(() => target)('rocketh');

		logger.info('- Executing', '01.ts');
		logger.warn('careful');
		logger.error(new Error('boom'));
		logger.debug('rpc detail');
		logger.info('\n');
		logger.assert(true, 'not shown');
		logger.assert(false, 'shown');
		target = undefined;
		logger.info('after the run');

		expect(logs.entries().map((e) => [e.source, e.text])).toEqual([
			['rocketh', '- Executing 01.ts'],
			['warning', 'careful'],
			['error', 'boom'],
			['error', 'shown'],
		]);
	});

	it('should keep debug lines when asked, and leave lines outside a run to the factory installed before', () => {
		const logs = createLogStream();
		let target: LogStream | undefined = logs;
		const seen: string[] = [];
		const previous = (namespace: string) =>
			new Proxy({} as never, {
				get:
					(_target, method) =>
					(...args: unknown[]) =>
						seen.push(`${namespace}.${String(method)}: ${args.join(' ')}`),
			});
		const logger = createLogFactory(() => target, {debug: true, fallbackTo: previous})('@rocketh/deploy');

		logger.debug('detail');
		logger.info('line');
		target = undefined;
		logger.info('outside');

		expect(logs.entries().map((e) => e.text)).toEqual(['detail', 'line']);
		expect(seen).toEqual(['@rocketh/deploy.info: outside']);
	});
});
