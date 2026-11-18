// The TypeScript language service for CodeMirror, in a worker. The lib files are bundled (no CDN).
import {createSystem, createVirtualTypeScriptEnvironment} from '@typescript/vfs';
import ts from 'typescript';
import * as Comlink from 'comlink';
import {createWorker} from '@valtown/codemirror-ts/worker';
import {TYPES} from './sample.js';

const libs = import.meta.glob(
	'/node_modules/typescript/lib/lib.{es5,es2015*,es2016*,es2017*,es2018*,es2019*,es2020*,es2021*,es2022*,decorators*}.d.ts',
	{query: '?raw', import: 'default', eager: true},
) as Record<string, string>;

Comlink.expose(
	createWorker(async function () {
		const fsMap = new Map<string, string>();
		for (const [path, text] of Object.entries(libs)) fsMap.set('/' + path.split('/').pop()!, text);
		fsMap.set('/node_modules/rocketh-sample/index.d.ts', TYPES);
		const system = createSystem(fsMap);
		return createVirtualTypeScriptEnvironment(system, ['/node_modules/rocketh-sample/index.d.ts'], ts, {
			target: ts.ScriptTarget.ES2022,
			lib: ['es2022'],
			module: ts.ModuleKind.ESNext,
			strict: true,
		});
	}),
);
