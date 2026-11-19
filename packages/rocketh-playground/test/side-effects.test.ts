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
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
	sideEffects?: unknown;
	exports: Record<string, {import: {default: string}}>;
};

describe('@rocketh/playground sideEffects', () => {
	it('lists only the custom-element bundle', () => {
		expect(pkg.sideEffects).toEqual(['./dist/element/**']);
	});

	it('covers the file the ./element export resolves to', () => {
		expect(pkg.exports['./element'].import.default.startsWith('./dist/element/')).toBe(true);
	});

	it('does not cover the root entry', () => {
		expect(pkg.exports['.'].import.default.startsWith('./dist/element/')).toBe(false);
	});
});
