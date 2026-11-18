// CodeMirror 6, TypeScript syntax only: what the playground needs if it does not check types.
import {EditorView, basicSetup} from 'codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {SOURCE, report} from './sample.js';

const t0 = performance.now();
new EditorView({
	doc: SOURCE,
	extensions: [basicSetup, javascript({typescript: true})],
	parent: document.getElementById('editor')!,
});
report('cm', {readyMs: performance.now() - t0});
