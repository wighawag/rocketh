import {defineConfig} from 'vitest/config';

// The repository's own scripts, tested by `pnpm test` from the root like a package is: the
// root config lists this file as a project.
export default defineConfig({
	test: {
		name: 'scripts',
		environment: 'node',
		include: ['test/**/*.test.ts'],
	},
});
