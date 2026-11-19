import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

/**
 * The package's `sideEffects` declaration, pinned.
 *
 * A consumer that imports only `captureConsole` / `createLogStream` from the root must not pay
 * for the GreetingsRegistry fixtures (and everything they import) that the root also exports,
 * so the root modules are declared free of side effects. The `./element` entry is the exception:
 * importing it registers `<rocketh-playground>` through `customElements.define`, and a bundler
 * told that it has no side effects drops a bare `import '@rocketh/playground/element'` entirely
 * (measured: the bundle goes from 73 KB to 0 bytes). So it must stay listed.
 *
 * The SOURCE of that entry must be listed too, and that is the one that bit: this package's own
 * vite build of the element (`vite.config.ts`, entry `src/ui/element.ts`) reads the same field
 * for the files it bundles, and `src/ui/element.ts` registers the element only through a bare
 * `import './Playground.svelte'`. With `./src/ui/**` missing, vite dropped that import and
 * shipped a 64-byte `dist/element/rocketh-playground.js` that registers nothing. The last test
 * below checks the BUILT file, because the field can look right and still produce that.
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
	sideEffects?: unknown;
	exports: Record<string, {import: {default: string}}>;
};

describe('@rocketh/playground sideEffects', () => {
	it('lists only the custom-element bundle and its source', () => {
		expect(pkg.sideEffects).toEqual(['./dist/element/**', './src/ui/**']);
	});

	it('covers the file the ./element export resolves to', () => {
		expect(pkg.exports['./element'].import.default.startsWith('./dist/element/')).toBe(true);
	});

	it('does not cover the root entry', () => {
		expect(pkg.exports['.'].import.default.startsWith('./dist/element/')).toBe(false);
	});

	it('ships an element bundle that registers the element', () => {
		// Needs `pnpm build` first, like every test here that resolves a workspace package.
		const bundle = readFileSync(new URL('../dist/element/rocketh-playground.js', import.meta.url), 'utf8');
		expect(bundle.includes('customElements.define("rocketh-playground"')).toBe(true);
	});
});
