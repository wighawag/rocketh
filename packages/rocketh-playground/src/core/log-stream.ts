/**
 * The append-only log a playground run produces, and the reason it exists at all.
 *
 * A deploy script is a user-authored module: it talks to the reader by calling `console.log`.
 * rocketh has no hook for that, and cannot grow one without dictating how scripts report
 * progress. So the only faithful way to show a reader what the script SAID, rather than a
 * synthetic "deployment succeeded", is to capture the console for the duration of the run.
 * That capture lives in `runPlayground`; this module is just the sink it writes into.
 *
 * It is deliberately push-based (`subscribe`) AND pull-based (`entries`), because a UI that
 * mounts mid-run must be able to render what it missed before the next line arrives.
 */

/** Where a line came from, so a terminal can colour it without parsing text. */
export type LogSource =
	/** The playground itself: "booting an EVM", "running 1 deploy script". */
	| 'playground'
	/** Written by the deploy script via `console.log` / `console.info` / `console.debug`. */
	| 'script'
	/** Written by the deploy script via `console.warn`. */
	| 'warning'
	/** A failure, either thrown out of the run or written via `console.error`. */
	| 'error'
	/** The run finished and everything asserted held. */
	| 'success';

export type LogEntry = {
	/** Monotonic, starting at 0. A UI keys rows on this rather than array index. */
	readonly seq: number;
	readonly source: LogSource;
	readonly text: string;
	/** `Date.now()` when appended. */
	readonly at: number;
};

/**
 * What happened to the stream. A union rather than just an entry, because `clear` has to be
 * observable too: a view that only heard about appends would keep the previous run's lines,
 * and `seq` restarts at 0 on clear, so it would then hold two entries with the same key.
 *
 * Shaped like `@rocketh/web`'s `VFSChange` (`{type: 'write'}` / `{type: 'restore'}`) on
 * purpose: the two are subscribed to side by side by the same UI, so they should read alike.
 */
export type LogChange = {type: 'append'; entry: LogEntry} | {type: 'clear'};

export type LogListener = (change: LogChange) => void;

export type LogStream = {
	append(source: LogSource, text: string): LogEntry;
	/** Everything appended so far, oldest first. */
	entries(): readonly LogEntry[];
	/**
	 * Call `listener` for every change from now on. Returns an unsubscribe function.
	 *
	 * Does NOT replay history: a caller that needs it should read `entries()` first, which is
	 * race-free because this module is synchronous and single-threaded.
	 */
	subscribe(listener: LogListener): () => void;
	/** Drop every entry and restart numbering, so a re-run renders as a fresh terminal. */
	clear(): void;
};

export function createLogStream(): LogStream {
	const entries: LogEntry[] = [];
	const listeners = new Set<LogListener>();
	let seq = 0;

	function emit(change: LogChange): void {
		// Copied before iterating: a listener is allowed to unsubscribe itself on the change it
		// receives, which a UI teardown does routinely.
		for (const listener of [...listeners]) {
			listener(change);
		}
	}

	function append(source: LogSource, text: string): LogEntry {
		const entry: LogEntry = {seq: seq++, source, text, at: Date.now()};
		entries.push(entry);
		emit({type: 'append', entry});
		return entry;
	}

	return {
		append,
		entries() {
			return entries;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		clear() {
			entries.length = 0;
			seq = 0;
			emit({type: 'clear'});
		},
	};
}

/** How `console.log('a', {b: 1})` becomes one terminal line. */
export function formatConsoleArguments(args: readonly unknown[]): string {
	return args
		.map((arg) => {
			if (typeof arg === 'string') {
				return arg;
			}
			if (typeof arg === 'bigint') {
				// `JSON.stringify` throws on bigint, and a deploy script logging a balance or a
				// chain id is the single most likely way to hit that.
				return `${arg}n`;
			}
			if (arg instanceof Error) {
				return arg.message;
			}
			try {
				return JSON.stringify(arg, (_key, value) => (typeof value === 'bigint' ? `${value}n` : value));
			} catch {
				return String(arg);
			}
		})
		.join(' ');
}
