import {describe, expect, it} from 'vitest';
import {captureConsole, createLogStream, formatConsoleArguments} from '../src/index.js';

/** Invoke whatever is currently installed at `target[method]`, patched or original. */
function call(target: Record<string, unknown>, method: string, ...args: unknown[]): void {
	(target[method] as (...a: unknown[]) => void).apply(target, args);
}

describe('createLogStream', () => {
	it('numbers entries monotonically and hands them to subscribers', () => {
		const logs = createLogStream();
		const seen: string[] = [];
		logs.subscribe((change) => {
			if (change.type === 'append') {
				seen.push(`${change.entry.seq}:${change.entry.source}:${change.entry.text}`);
			}
		});

		logs.append('playground', 'booting');
		logs.append('script', 'hello');

		expect(seen).toEqual(['0:playground:booting', '1:script:hello']);
		expect(logs.entries().map((e) => e.text)).toEqual(['booting', 'hello']);
	});

	it('does not replay history to a late subscriber, so a UI must read entries() first', () => {
		const logs = createLogStream();
		logs.append('script', 'before');

		const seen: string[] = [];
		logs.subscribe((change) => change.type === 'append' && seen.push(change.entry.text));
		logs.append('script', 'after');

		expect(seen).toEqual(['after']);
		expect(logs.entries()).toHaveLength(2);
	});

	it('lets a listener unsubscribe itself while being notified', () => {
		// A UI teardown does exactly this, and iterating the live set would skip the next
		// listener or throw.
		const logs = createLogStream();
		const seen: string[] = [];
		const unsubscribe = logs.subscribe((change) => {
			if (change.type === 'append') {
				seen.push(change.entry.text);
			}
			unsubscribe();
		});
		logs.subscribe((change) => change.type === 'append' && seen.push(`second:${change.entry.text}`));

		logs.append('script', 'one');
		logs.append('script', 'two');

		expect(seen).toEqual(['one', 'second:one', 'second:two']);
	});

	it('restarts numbering after clear, so a re-run renders as a fresh terminal', () => {
		const logs = createLogStream();
		logs.append('script', 'first run');
		logs.clear();
		logs.append('script', 'second run');

		expect(logs.entries()).toHaveLength(1);
		expect(logs.entries()[0]?.seq).toBe(0);
	});

	it('tells subscribers it was cleared, not only that entries were appended', () => {
		/**
		 * Regression. A view that only heard about appends kept the previous run's lines and
		 * then appended the new run's on top. Because `clear` restarts `seq` at 0, the keyed
		 * `{#each}` in the terminal ended up with two entries keyed 0 and Svelte threw
		 * `each_key_duplicate` on the second Run press. Only reproducible on a SECOND run,
		 * which is why it survived the first browser check.
		 */
		const logs = createLogStream();
		const changes: string[] = [];
		logs.subscribe((change) => changes.push(change.type));

		logs.append('script', 'one');
		logs.clear();
		logs.append('script', 'two');

		expect(changes).toEqual(['append', 'clear', 'append']);
	});

	it('has unique seq across a clear, as seen by a subscriber that re-reads entries()', () => {
		// The pattern the terminal uses: never accumulate locally, always re-read the source.
		const logs = createLogStream();
		let rendered: {seq: number}[] = [];
		logs.subscribe(() => {
			rendered = [...logs.entries()];
		});

		logs.append('script', 'first run');
		logs.clear();
		logs.append('script', 'second run');

		expect(rendered).toHaveLength(1);
		expect(new Set(rendered.map((e) => e.seq)).size).toBe(rendered.length);
	});
});

describe('formatConsoleArguments', () => {
	it('joins mixed arguments the way a terminal line reads', () => {
		expect(formatConsoleArguments(['deployed', {address: '0xabc'}])).toBe('deployed {"address":"0xabc"}');
	});

	it('survives a bigint, which JSON.stringify throws on', () => {
		// A deploy script logging a balance, a gas figure or a chain id is the single most
		// likely way to hit this, and a widget must not die because a script logged one.
		expect(formatConsoleArguments([{balance: 10n ** 21n}])).toBe('{"balance":"1000000000000000000000n"}');
		expect(formatConsoleArguments([42n])).toBe('42n');
	});

	it('survives a circular object', () => {
		const circular: Record<string, unknown> = {name: 'env'};
		circular.self = circular;

		expect(formatConsoleArguments([circular])).toBe('[object Object]');
	});

	it('reports an Error by its message rather than as an empty object', () => {
		expect(formatConsoleArguments([new Error('nope')])).toBe('nope');
	});
});

describe('captureConsole', () => {
	it('routes each console method to the source a terminal colours on', () => {
		const logs = createLogStream();
		const target: Record<string, unknown> = {log() {}, info() {}, debug() {}, warn() {}, error() {}};

		const capture = captureConsole(logs, {target: target as Partial<Console>});
		call(target, 'log', 'plain');
		call(target, 'warn', 'careful');
		call(target, 'error', 'broken');
		capture.release();

		expect(logs.entries().map((e) => [e.source, e.text])).toEqual([
			['script', 'plain'],
			['warning', 'careful'],
			['error', 'broken'],
		]);
	});

	it('puts the original methods back, and tolerates a second release', () => {
		const logs = createLogStream();
		const original = () => {};
		const target: Record<string, unknown> = {log: original, info() {}, debug() {}, warn() {}, error() {}};

		const capture = captureConsole(logs, {target: target as Partial<Console>});
		expect(target.log).not.toBe(original);

		capture.release();
		capture.release();

		expect(target.log).toBe(original);
	});

	it('stops capturing once released', () => {
		const logs = createLogStream();
		const target: Record<string, unknown> = {log() {}, info() {}, debug() {}, warn() {}, error() {}};

		const capture = captureConsole(logs, {target: target as Partial<Console>});
		capture.release();
		call(target, 'log', 'after');

		expect(logs.entries()).toHaveLength(0);
	});
});
