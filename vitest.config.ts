import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		// Every package holding tests owns a `vitest.config.ts` declaring them, and is
		//  picked up here as a project. Running `pnpm test` from the root and running
		//  `pnpm test` from a package therefore run the exact same setup, instead of
		//  the root config being the only place where test files are declared (which
		//  made the per-package `test` scripts find no test file at all).
		//  `scripts/` holds the repository's own checks (the playground examples' equality
		//  check among them) and is a project the same way.
		projects: ['packages/*/vitest.config.ts', 'scripts/vitest.config.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.test.tsx', '**/*.d.ts', '**/dist/**'],
		},
	},
});
