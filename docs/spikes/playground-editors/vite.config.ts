import {defineConfig} from 'vite';
export default defineConfig({
	build: {target: 'es2022', rollupOptions: {input: {cm: 'cm.html', 'cm-ts': 'cm-ts.html', monaco: 'monaco.html'}}},
	worker: {format: 'es'},
});
