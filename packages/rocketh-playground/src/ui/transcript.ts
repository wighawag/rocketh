/**
 * rocketh's own transcript in the widget's terminal, on a page the widget does not own.
 *
 * rocketh logs through `named-logs`, and each of its loggers keeps the factory that existed when
 * its module was evaluated. The widget loads rocketh LAZILY (the core's `import()` on the first
 * Run), so it can install a factory first, which is why this works here at all. It is installed
 * ONCE for the page (a logger never sees a second one), and it writes to the stream of the run in
 * flight and drops everything else, so rocketh logging outside a run (another widget's page
 * code, say) never lands in a widget's terminal.
 *
 * It sets `globalThis._logFactory`, which `named-logs` reads, instead of calling its `hook()`, so
 * the package needs no `named-logs` dependency. A factory the page installed there before (for
 * example `named-logs-console` in a script tag) is kept for every line logged outside a run.
 *
 * Known limit, shared with `captureConsole`: the factory is page-global, so two widgets running
 * at the same moment send rocketh's lines to whichever started last, until it finishes. Each
 * widget already serialises its own runs.
 *
 * Imported by RELATIVE path, so vite bundles this small module into the element. Not from the
 * root (that would evaluate rocketh before the factory exists, and defeat the lazy load), and
 * not from `@rocketh/playground/log` either: a host that resolves the element's externals by
 * hand (rocketh.dev aliases exactly `@rocketh/playground` and `/element`) would then need a
 * third alias. The copy is harmless: a `LogStream` is matched structurally.
 */
import {createLogFactory, type NamedLogsFactory} from '../core/log-factory.js';
import type {LogStream} from '../core/log-stream.js';

/** Streams of the runs in flight, oldest first. The newest one receives the lines. */
const runs: LogStream[] = [];
let installed = false;

/** Route rocketh's lines to `logs` until the returned function is called. */
export function routeTranscriptTo(logs: LogStream): () => void {
	runs.push(logs);
	return () => {
		const index = runs.lastIndexOf(logs);
		if (index >= 0) {
			runs.splice(index, 1);
		}
	};
}

export function installTranscriptFactory(): void {
	if (installed) {
		return;
	}
	installed = true;
	const scope = globalThis as {_logFactory?: NamedLogsFactory};
	scope._logFactory = createLogFactory(() => runs[runs.length - 1], {fallbackTo: scope._logFactory});
}
