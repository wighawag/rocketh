import {formatConsoleArguments, type LogSource, type LogStream} from './log-stream.js';

/**
 * Redirect `console` into a {@link LogStream} for the duration of a run.
 *
 * WHY this exists rather than a rocketh-side hook: a deploy script is ordinary user code and
 * reports progress the ordinary way, with `console.log`. Showing a reader "deployment
 * succeeded" instead of what the script actually printed would misrepresent what running a
 * deploy script is like, which is the whole point of the widget.
 *
 * WHY it patches the global rather than passing a logger down: it has to work for a script the
 * playground did not write and cannot modify, which is exactly the case that matters. The
 * blast radius is bounded by always restoring in a `finally`, and by capturing only while a
 * run is in flight.
 *
 * Known limit, and deliberate: this is process-global, so two runs in flight at once would
 * interleave into whichever stream patched last. Runs are serialised by `createPlayground`
 * for that reason.
 */
export type ConsoleCapture = {
	/** Put the original `console` methods back. Safe to call twice. */
	release(): void;
};

const CAPTURED: ReadonlyArray<readonly [method: 'log' | 'info' | 'debug' | 'warn' | 'error', source: LogSource]> = [
	['log', 'script'],
	['info', 'script'],
	['debug', 'script'],
	['warn', 'warning'],
	['error', 'error'],
];

export type CaptureConsoleOptions = {
	/**
	 * Also write through to the real console. Off by default so a docs page stays quiet, on in
	 * tests where swallowing output would hide a failure's own diagnostics.
	 */
	passThrough?: boolean;
	/** The console to patch. Injectable so a test can prove the patching without touching the real one. */
	target?: Partial<Console>;
};

export function captureConsole(logs: LogStream, options: CaptureConsoleOptions = {}): ConsoleCapture {
	const target = (options.target ?? globalThis.console) as Record<string, unknown>;
	const originals = new Map<string, unknown>();

	for (const [method, source] of CAPTURED) {
		const original = target[method];
		originals.set(method, original);
		target[method] = (...args: unknown[]) => {
			logs.append(source, formatConsoleArguments(args));
			if (options.passThrough && typeof original === 'function') {
				(original as (...a: unknown[]) => void).apply(target, args);
			}
		};
	}

	let released = false;
	return {
		release() {
			if (released) {
				return;
			}
			released = true;
			for (const [method, original] of originals) {
				target[method] = original;
			}
		},
	};
}
