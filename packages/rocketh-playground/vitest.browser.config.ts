import {svelte} from '@sveltejs/vite-plugin-svelte';
import {playwright} from '@vitest/browser-playwright';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

/**
 * The browser suite, and OPT-IN by design.
 *
 * It lives in its own config rather than as a second project in `vitest.config.ts` because the
 * root runner collects `packages/*​/vitest.config.ts` by exact name, so a differently-named
 * config is automatically excluded from `pnpm test`. That matters: this suite needs a
 * playwright chromium that a fresh clone does not have, and a repo whose default test command
 * fails until you download a browser is a repo people stop running tests in.
 *
 * Run it with `pnpm --filter @rocketh/playground test:browser`, after
 * `pnpm exec playwright install chromium`.
 *
 * WHY it exists: every bug this widget has had was found by running it in a browser, and none
 * by the headless suite. Keyed-list state across a second run, and a console line rendered as
 * a failure, are simply not visible to a node test that asserts on a returned object.
 */
export default defineConfig({
	plugins: [svelte({compilerOptions: {customElement: true}})],
	resolve: {
		alias: {
			// The UI imports the core by package name (so the shipped bundle treats it as
			// external and the page holds one copy). Under test that would resolve to `dist`
			// and quietly test the last BUILD rather than the current source, so it is pointed
			// back at source here.
			'@rocketh/playground': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
		},
	},
	test: {
		include: ['test/**/*.browser.test.ts'],
		// A missing assertion in a browser test usually means the wait silently timed out into
		// a passing test, which is worse than a failure.
		expect: {requireAssertions: true},
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{browser: 'chromium', headless: true}],
			screenshotFailures: false,
		},
	},
});
