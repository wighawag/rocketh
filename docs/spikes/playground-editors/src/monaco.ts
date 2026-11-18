// Monaco with only the TypeScript and Solidity languages (not the whole bundle of languages).
import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/languages/definitions/typescript/register.js';
import 'monaco-editor/languages/definitions/solidity/register.js';
import * as ts from 'monaco-editor/languages/features/typescript/register.js';
import EditorWorker from 'monaco-editor/editor/editor.worker.start.js?worker';
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker.js?worker';
import {SOURCE, TYPES, report} from './sample.js';

(self as unknown as {MonacoEnvironment: unknown}).MonacoEnvironment = {
	getWorker: (_: string, label: string) =>
		label === 'typescript' || label === 'javascript' ? new TsWorker() : new EditorWorker(),
};
const t0 = performance.now();
ts.typescriptDefaults.setCompilerOptions({
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.NodeJs,
	strict: true,
});
ts.typescriptDefaults.addExtraLib(TYPES, 'file:///node_modules/rocketh-sample/index.d.ts');
const model = monaco.editor.createModel(SOURCE, 'typescript', monaco.Uri.parse('file:///index.ts'));
monaco.editor.create(document.getElementById('editor')!, {model, automaticLayout: true});
const readyMs = performance.now() - t0;
for (let i = 0; i < 200; i++) {
	const markers = monaco.editor.getModelMarkers({resource: model.uri});
	if (markers.length > 0) {
		report('monaco', {
			readyMs,
			diagnosticsMs: performance.now() - t0,
			diagnostics: markers.map((m) => `${m.startLineNumber}: ${m.message}`),
		});
		break;
	}
	await new Promise((r) => setTimeout(r, 100));
}
