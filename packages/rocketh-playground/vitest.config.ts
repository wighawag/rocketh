import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.test.ts'],
		// `*.browser.test.ts` needs a real browser and the svelte plugin, and lives in
		// `vitest.browser.config.ts`. Excluding it here is not optional: the include glob above
		// matches it (it does end in `.test.ts`), so without this the default `pnpm test` tries
		// to import a `.svelte` file in node and fails.
		exclude: ['test/**/*.browser.test.ts'],
	},
});
