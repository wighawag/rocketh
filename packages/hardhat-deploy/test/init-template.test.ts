import {describe, it, expect} from 'vitest';
import {readFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateFile = (name: string) => readFileSync(join(__dirname, '../templates/basic', name), 'utf-8');

describe('hardhat-deploy init template', () => {
	/**
	 * pnpm 11 stops an install at ERR_PNPM_IGNORED_BUILDS until every dependency with a build
	 * script is allowed or denied in pnpm-workspace.yaml, and it reads that decision from no
	 * other file (not package.json, not .npmrc). So `hardhat-deploy init --install`, and a
	 * `pnpm install` run by hand, failed for every pnpm 11 user until the template shipped
	 * the decision itself. These two are the template's dependencies that have one.
	 */
	it('ships a pnpm-workspace.yaml that settles the build scripts pnpm 11 asks about', () => {
		const lines = templateFile('pnpm-workspace.yaml')
			.split('\n')
			.filter((line) => line.trim() !== '' && !line.trimStart().startsWith('#'));

		expect(lines).toEqual(['allowBuilds:', '  esbuild: false', "  '@parcel/watcher': false"]);
	});
});
