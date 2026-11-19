import {formatConsoleArguments, type LogSource, type LogStream} from './log-stream.js';

/**
 * A logger factory that writes rocketh's own transcript into a {@link LogStream}.
 *
 * WHY it exists: rocketh reports its progress (`- Executing <script>`, `reusing "<name>" at
 * <address>`, the deploy and proxy lines) through `named-logs`, not `console`, so
 * `captureConsole` never sees it. `named-logs` hands each library a logger from whatever factory
 * is installed WHEN the library's module is evaluated, and a logger created with no factory stays
 * a no-op for good, which is what makes logging free when nobody listens. So a host that wants
 * the transcript installs this factory BEFORE anything imports rocketh, in every realm that runs
 * rocketh (a worker has its own `globalThis` and does not see the page's factory):
 *
 * ```ts
 * // log-hook.ts, the FIRST import of the worker that runs the deploy scripts
 * import {createLogFactory, createLogStream} from '@rocketh/playground/log'; // loads no rocketh
 * import {hook} from 'named-logs'; // or: globalThis._logFactory = factory
 * export const logs = createLogStream();
 * hook(createLogFactory(logs));
 * ```
 *
 * The package installs nothing itself, and takes no `named-logs` dependency: the factory is
 * matched structurally, so it works with whichever copy of `named-logs` rocketh resolved.
 *
 * For a realm the host OWNS (typically the worker that runs the deploy scripts), where nothing
 * else installs a factory. Installing it on a page that already has one would REPLACE the page's
 * factory for every library loaded afterwards, which is why the `<rocketh-playground>` widget,
 * a guest on its host's page, does not use it.
 *
 * WHY not `named-logs-console`: it writes to `console`, and `captureConsole` would then label
 * rocketh's lines `'script'`, as if the reader's script had printed them.
 */
export type NamedLogsLogger = {
	readonly assert: (condition?: boolean, ...data: unknown[]) => void;
	readonly error: (...data: unknown[]) => void;
	readonly warn: (...data: unknown[]) => void;
	readonly info: (...data: unknown[]) => void;
	readonly log: (...data: unknown[]) => void;
	readonly debug: (...data: unknown[]) => void;
	readonly dir: (item?: unknown, options?: unknown) => void;
	readonly table: (tabularData?: unknown, properties?: string[]) => void;
	readonly trace: (...data: unknown[]) => void;
	readonly write: (msg: string) => void;
	readonly time: (label: string) => void;
	readonly timeEnd: (label: string) => void;
	readonly timeLog: (label?: string) => void;
};

/** The shape `named-logs`' `hook()` and `globalThis._logFactory` take. */
export type NamedLogsFactory = (namespace: string, options?: {decoration?: string}) => NamedLogsLogger;

/**
 * Where the lines go: a stream, or a function that names the stream for the current moment and
 * returns `undefined` to drop the line. The function form is for a host that installs ONE factory
 * for the life of the realm (it must: a logger keeps the factory it was created from) but has
 * several runs, or no run at all, over that life.
 */
export type LogFactoryTarget = LogStream | (() => LogStream | undefined);

export type CreateLogFactoryOptions = {
	/**
	 * Also keep `debug` and `trace` lines. Off by default: those are rocketh's diagnostics (RPC
	 * retries, resolution details), not the transcript a reader follows.
	 */
	debug?: boolean;
};

const noop = () => undefined;

/**
 * Build a `named-logs` factory whose loggers append to `target`: `info`, `log` and `write` as
 * `'rocketh'`, `warn` as `'warning'`, `error` (and a failed `assert`) as `'error'`, the same
 * severity mapping `captureConsole` uses for the console. `debug` and `trace` are `'rocketh'`
 * lines too when `options.debug` is set, and dropped otherwise. `dir` and `table` are formatted
 * like a console argument; the `time*` timers are not recorded.
 *
 * A line that is only whitespace is dropped: rocketh writes a bare newline after each script to
 * space out a CLI's output, which in a terminal of discrete lines is just an empty row.
 */
export function createLogFactory(target: LogFactoryTarget, options: CreateLogFactoryOptions = {}): NamedLogsFactory {
	const resolve = typeof target === 'function' ? target : () => target;

	function append(source: LogSource, data: readonly unknown[]): void {
		const stream = resolve();
		if (!stream) {
			return;
		}
		const text = formatConsoleArguments(data);
		if (text.trim() === '') {
			return;
		}
		stream.append(source, text);
	}

	const lines =
		(source: LogSource) =>
		(...data: unknown[]) =>
			append(source, data);
	const diagnostic = options.debug ? lines('rocketh') : noop;

	return () => ({
		assert: (condition?: boolean, ...data: unknown[]) => {
			if (!condition) {
				append('error', data.length > 0 ? data : ['Assertion failed']);
			}
		},
		error: lines('error'),
		warn: lines('warning'),
		info: lines('rocketh'),
		log: lines('rocketh'),
		debug: diagnostic,
		trace: diagnostic,
		dir: (item?: unknown) => append('rocketh', [item]),
		table: (tabularData?: unknown) => append('rocketh', [tabularData]),
		write: (msg: string) => append('rocketh', [msg]),
		time: noop,
		timeEnd: noop,
		timeLog: noop,
	});
}
