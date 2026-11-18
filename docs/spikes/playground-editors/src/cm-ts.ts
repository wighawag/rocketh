// CodeMirror 6 with the TypeScript language service in a worker (@valtown/codemirror-ts).
import {EditorView, basicSetup} from 'codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {autocompletion} from '@codemirror/autocomplete';
import * as Comlink from 'comlink';
import {tsFacetWorker, tsSyncWorker, tsLinterWorker, tsAutocompleteWorker, tsHoverWorker} from '@valtown/codemirror-ts';
import type {WorkerShape} from '@valtown/codemirror-ts/worker';
import {SOURCE, report} from './sample.js';

const t0 = performance.now();
const worker = Comlink.wrap<WorkerShape>(new Worker(new URL('./cm-ts.worker.ts', import.meta.url), {type: 'module'}));
await worker.initialize();
const tsReady = performance.now() - t0;
const path = '/index.ts';
new EditorView({
	doc: SOURCE,
	extensions: [
		basicSetup,
		javascript({typescript: true}),
		tsFacetWorker.of({worker, path}),
		tsSyncWorker(),
		tsLinterWorker(),
		autocompletion({override: [tsAutocompleteWorker()]}),
		tsHoverWorker(),
	],
	parent: document.getElementById('editor')!,
});
const readyMs = performance.now() - t0;
// poll the worker for diagnostics on the file the editor synced
for (let i = 0; i < 100; i++) {
	const lints = await worker.getLints({path, diagnosticCodesToIgnore: []});
	if (lints.length > 0) {
		report('cm-ts', {
			tsReadyMs: tsReady,
			readyMs,
			diagnosticsMs: performance.now() - t0,
			diagnostics: lints.map((l) => `${l.from}: ${l.message}`),
		});
		break;
	}
	await new Promise((r) => setTimeout(r, 100));
}
