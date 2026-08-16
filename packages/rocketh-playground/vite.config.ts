import {svelte} from '@sveltejs/vite-plugin-svelte';
import {defineConfig} from 'vite';

/**
 * Builds ONLY the custom element (`src/ui`). The rest of the package is built by `tsc`, which
 * is what every other package here uses and what keeps the core plainly consumable as ESM.
 *
 * The rocketh packages and the EVM are EXTERNAL, deliberately. Bundling them would put a
 * second copy of rocketh's internals inside this file, and a page that also imported
 * `@rocketh/playground` directly would then hold two: the deploy script's extensions would
 * close over a different `Environment` than the executor builds. Same hazard that makes the
 * `GreetingsRegistry` artifact vendored rather than pulled from `template-ethereum-contracts`.
 * Svelte is NOT external: it is a devDependency and compiles away into this bundle.
 *
 * `@rocketh/playground` itself is external too, which is why the UI imports the core by
 * PACKAGE NAME rather than by relative path: the UI is then just another consumer of the
 * package's public entry, and the page holds one core no matter which entry point it came in
 * through. It also keeps the core out of this file so it stays lazily loaded on first Run.
 */
const EXTERNAL = [
	'rocketh',
	'@rocketh/playground',
	'viem',
	'eip-1193',
	'webevm',
	/^rocketh\//,
	/^@rocketh\//,
	/^viem\//,
	/^webevm\//,
];

export default defineConfig({
	plugins: [svelte({compilerOptions: {customElement: true}})],
	build: {
		outDir: 'dist/element',
		emptyOutDir: true,
		target: 'es2022',
		lib: {
			entry: 'src/ui/element.ts',
			formats: ['es'],
			fileName: () => 'rocketh-playground.js',
		},
		rollupOptions: {
			external: EXTERNAL,
			output: {
				// The core is dynamically imported on the first Run press, so it lands in its own
				// chunk with a stable name rather than a hashed one.
				chunkFileNames: '[name].js',
			},
		},
	},
});
