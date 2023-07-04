import {defineConfig} from 'tsup';
export default defineConfig({
	outDir: 'dist',
	sourcemap: true,
	shims: true, // allow __dirname to work in esm
});
