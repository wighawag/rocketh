import {describe, it, expect} from 'vitest';
import {readFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {createIgnoreFilter, parseGitignore} from '../src/utils/gitignore.js';

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

	/**
	 * A new project should tell an agent that the rocketh skills exist, without loading them:
	 * the agent informs the user, who decides whether to install. So the template ships an
	 * AGENTS.md carrying the same fragment the agent-skills documentation page offers for an
	 * existing project, and `init` must actually copy it (it walks the template through the
	 * template's own .gitignore, so a pattern there could silently drop the file).
	 */
	it('ships an AGENTS.md that tells an agent the rocketh skills exist, and init copies it', () => {
		const agents = templateFile('AGENTS.md');
		expect(agents).toContain('npx skills add wighawag/rocketh');
		expect(agents).toContain('https://rocketh.dev/documentation/agent-skills/');
		expect(agents).toContain('## Project notes');

		const isIgnored = createIgnoreFilter(parseGitignore(templateFile('.gitignore')));
		expect(isIgnored('AGENTS.md', false)).toBe(false);
	});

	/** One wording for the user: the template file is the fragment the docs page shows. */
	it('uses the same text as the fragment on the agent-skills documentation page', () => {
		const page = readFileSync(join(__dirname, '../../../documentation/agent-skills/index.md'), 'utf-8');
		const section = page.slice(page.indexOf("## A line for your project's AGENTS.md"));
		const fragment = section.match(/```md\n([\s\S]*?)```/)?.[1];
		expect(fragment).toBeDefined();
		expect(templateFile('AGENTS.md').trim()).toBe(fragment!.trim());
	});
});
