/**
 * The harness's own tests: every check of `harness.ts` passing on a throwaway skill
 * (`example/skills/example-skill/`, whose fixtures are `example/skill-fixtures/example-skill/`),
 * and failing, with a message naming the file and the rule, on a sample of text that breaks it.
 * The throwaway skill exists only for these tests; the real skills are checked by
 * `skills.test.ts`.
 */

import {describe, it, expect, beforeAll} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {deploy} from '@rocketh/deploy';

import {
	anchorsOf,
	checkExportNames,
	checkFixtureMarkers,
	checkFlags,
	checkFrontmatter,
	checkLinks,
	checkSamples,
	checkSkill,
	compareVersions,
	discoverSkills,
	formatFailure,
	isUserSkill,
	loadCommandSurfaces,
	unknownFlags,
	type CommandSurfaces,
	type Skill,
} from './harness.js';
import {artifacts} from '../skill-fixtures/_shared/artifacts.js';
import {
	createNode,
	IMPERSONABLE_ADDRESS,
	LOCAL_PRIVATE_KEY,
	UNSIGNABLE_ADDRESS,
} from '../skill-fixtures/_shared/node.js';

const EXAMPLE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'example');
const EXAMPLE_SKILLS = path.join(EXAMPLE, 'skills');
const EXAMPLE_FIXTURES = path.join(EXAMPLE, 'skill-fixtures');

const [example] = discoverSkills(EXAMPLE_SKILLS);

/** The example skill with its `SKILL.md` replaced by `text`. */
function withSkillText(text: string, base: Skill = example): Skill {
	return {...base, docs: [{file: base.docs[0].file, text}, ...base.docs.slice(1)]};
}

/** A skill made of one `SKILL.md`. */
function skillOf(text: string, name = 'example-skill', user = true): Skill {
	return {name, user, docs: [{file: `skills/${name}/SKILL.md`, text}]};
}

const FRONTMATTER = `---\nname: example-skill\ndescription: An example.\nmetadata:\n  rocketh: '>=0.1.0'\n---\n`;

let surfaces: CommandSurfaces;
beforeAll(async () => {
	surfaces = await loadCommandSurfaces();
});

describe('the throwaway skill passes every check', () => {
	it('is discovered from its folder, with its references', () => {
		expect(example.name).toBe('example-skill');
		expect(example.user).toBe(true);
		expect(example.docs.map((doc) => path.basename(doc.file))).toEqual(['SKILL.md', 'run-once.md']);
	});

	it('passes the per-skill checks and the sample check', () => {
		expect(checkSkill(example, {surfaces, fixturesRoot: EXAMPLE_FIXTURES}).map(formatFailure)).toEqual([]);
		expect(checkSamples([example], EXAMPLE_FIXTURES).map(formatFailure)).toEqual([]);
	});
});

describe('which skills are user skills', () => {
	it('is every folder under skills/ except the migration skill', () => {
		expect(isUserSkill('hardhat-deploy-migration')).toBe(false);
		expect(isUserSkill('rocketh-deploy')).toBe(true);
		expect(isUserSkill('example-skill')).toBe(true);
	});
});

describe('rule: fixture-marker and unmarked-typescript', () => {
	const marked = (code: string) =>
		`<!-- fixture: example-skill/deploy/01_registry.ts -->\n\n\`\`\`ts\n${code}\n\`\`\`\n`;
	const registry = fs
		.readFileSync(path.join(EXAMPLE_FIXTURES, 'example-skill/deploy/01_registry.ts'), 'utf8')
		.trimEnd();

	it('passes a marked block equal to its file', () => {
		expect(checkFixtureMarkers(withSkillText(FRONTMATTER + marked(registry)), EXAMPLE_FIXTURES)).toEqual([]);
	});

	it('fails a marked block that differs from its file, naming both', () => {
		const failures = checkFixtureMarkers(
			withSkillText(FRONTMATTER + marked(`${registry}\n// edited`)),
			EXAMPLE_FIXTURES,
		);
		expect(failures.map(formatFailure)).toEqual([
			expect.stringMatching(
				/^packages\/hardhat-deploy\/test\/skill-harness\/example\/skills\/example-skill\/SKILL\.md: \[fixture-marker\] line \d+: the block differs from packages\/hardhat-deploy\/test\/skill-harness\/example\/skill-fixtures\/example-skill\/deploy\/01_registry\.ts/,
			),
		]);
	});

	it('fails a marker naming no file, and a marker with no block after it', () => {
		const text = `${FRONTMATTER}<!-- fixture: example-skill/deploy/missing.ts -->\n\n\`\`\`ts\nx\n\`\`\`\n\n<!-- fixture: example-skill/deploy/01_registry.ts -->\n\nprose\n`;
		const messages = checkFixtureMarkers(withSkillText(text), EXAMPLE_FIXTURES).map((f) => `${f.rule}: ${f.message}`);
		expect(messages).toEqual([
			expect.stringMatching(
				/^fixture-marker: line 13: the marker for example-skill\/deploy\/01_registry\.ts must be followed/,
			),
			expect.stringMatching(/^fixture-marker: line 9: example-skill\/deploy\/missing\.ts is no file/),
		]);
	});

	it('fails an unmarked TypeScript block, in SKILL.md and in references/', () => {
		const skill: Skill = {
			name: 'example-skill',
			user: true,
			docs: [
				{file: 'skills/example-skill/SKILL.md', text: `${FRONTMATTER}\`\`\`typescript\nconst a = 1;\n\`\`\`\n`},
				{file: 'skills/example-skill/references/more.md', text: '```ts\nconst b = 2;\n```\n\n```json\n{}\n```\n'},
			],
		};
		expect(checkFixtureMarkers(skill, EXAMPLE_FIXTURES).map((f) => `${f.file}: ${f.rule}`)).toEqual([
			'skills/example-skill/SKILL.md: unmarked-typescript',
			'skills/example-skill/references/more.md: unmarked-typescript',
		]);
	});

	it('is not applied to the migration skill, which may carry unmarked blocks', () => {
		const migration = discoverSkills().find((skill) => skill.name === 'hardhat-deploy-migration');
		expect(migration?.user).toBe(false);
		expect(checkSkill(migration!, {surfaces}).filter((f) => f.rule === 'unmarked-typescript')).toEqual([]);
	});
});

describe('rule: unused-sample and fixture-folder', () => {
	it('fails a sample no skill includes or names; tests, exports.json and _shared/ are not samples', () => {
		const without = withSkillText(
			example.docs[0].text.replace(/example-skill\/rocketh\/deploy\.ts/g, 'the deploy file'),
		);
		expect(checkSamples([without], EXAMPLE_FIXTURES).map(formatFailure)).toEqual([
			expect.stringMatching(
				/example-skill\/rocketh\/deploy\.ts: \[unused-sample\] no skill includes or names example-skill\/rocketh\/deploy\.ts/,
			),
		]);
	});

	it('fails a fixture folder that belongs to no skill', () => {
		const other = {...example, name: 'other-skill'};
		const failures = checkSamples([other], EXAMPLE_FIXTURES);
		expect(failures.filter((f) => f.rule === 'fixture-folder').map(formatFailure)).toEqual([
			'packages/hardhat-deploy/test/skill-harness/example/skill-fixtures/example-skill: [fixture-folder] no skill is named example-skill: a fixture folder is named after the skill it serves',
		]);
	});
});

describe('rule: link', () => {
	const linking = (url: string) => skillOf(`${FRONTMATTER}See [the page](${url}).\n`);

	it('passes a page, a heading slug and an explicit {#id}', () => {
		expect(checkLinks(linking('https://rocketh.dev/documentation/unknown-signers/'))).toEqual([]);
		expect(
			checkLinks(
				linking(
					'https://rocketh.dev/documentation/script-lifecycle/#never-return-true-on-a-path-where-a-step-was-deferred',
				),
			),
		).toEqual([]);
		expect(checkLinks(linking('https://rocketh.dev/hardhat-deploy/migration/#catch-unknown-signer'))).toEqual([]);
		expect(checkLinks(linking('https://rocketh.dev/'))).toEqual([]);
	});

	it('exempts the skills the site serves and raw GitHub files', () => {
		expect(checkLinks(linking('https://rocketh.dev/skills/rocketh-deploy/SKILL.md'))).toEqual([]);
		expect(
			checkLinks(linking('https://raw.githubusercontent.com/wighawag/rocketh/main/skills/rocketh-deploy/SKILL.md')),
		).toEqual([]);
	});

	it('fails a path with no page, and an anchor with no heading', () => {
		expect(checkLinks(linking('https://rocketh.dev/documentation/no-such-page/')).map(formatFailure)).toEqual([
			'skills/example-skill/SKILL.md: [link] line 7: https://rocketh.dev/documentation/no-such-page/ is no page: documentation/no-such-page/index.md does not exist',
		]);
		expect(
			checkLinks(linking('https://rocketh.dev/documentation/unknown-signers/#no-such-heading')).map(formatFailure),
		).toEqual([
			'skills/example-skill/SKILL.md: [link] line 7: https://rocketh.dev/documentation/unknown-signers/#no-such-heading: documentation/unknown-signers/index.md has no heading with the anchor #no-such-heading',
		]);
	});

	it('slugs headings as GitHub does, skipping code blocks and numbering duplicates', () => {
		const anchors = anchorsOf(
			'# Title\n\n## Never `return true` here\n\n## Patterns & Examples\n\n## Named {#custom}\n\n```bash\n# not a heading\n```\n\n## Title\n',
		);
		expect([...anchors].sort()).toEqual(['custom', 'never-return-true-here', 'patterns--examples', 'title', 'title-1']);
	});
});

describe('rule: flag', () => {
	const fails = (command: string) => unknownFlags(command, surfaces);

	it('fails a flag the hardhat deploy task does not take', () => {
		expect(fails('npx hardhat deploy --write-transactions out.json')).toEqual(['--write-transactions']);
		expect(fails('npx hardhat deploy --gasprice 1')).toEqual(['--gasprice']);
	});

	it("accepts Hardhat's globals before or after the task name, and the task's own options", () => {
		expect(fails('npx hardhat --network sepolia deploy')).toEqual([]);
		expect(fails('npx hardhat deploy --network sepolia')).toEqual([]);
		expect(fails('pnpm hardhat --build-profile production deploy --tags A,B --reset --gas-price 1')).toEqual([]);
		expect(fails('npx hardhat --config other.config.ts --show-stack-traces deploy --skip-prompts')).toEqual([]);
		expect(fails('npx hardhat --no-such-global deploy')).toEqual(['--no-such-global']);
	});

	it("leaves another hardhat task's options alone", () => {
		expect(fails('npx hardhat compile --build-profile production --quiet')).toEqual([]);
		expect(fails('HARDHAT_FORK=mainnet npx hardhat test --grep foo')).toEqual([]);
	});

	it('checks rocketh, rocketh-export, rocketh-verify and rocketh-doc against their declarations', () => {
		expect(fails('pnpm rocketh -e sepolia --write-transactions batch.json --is-fork --gasprice 1')).toEqual([]);
		expect(fails('npx rocketh -e sepolia --write-transaction batch.json')).toEqual(['--write-transaction']);
		expect(fails('pnpm exec rocketh-export -e sepolia --ts out.ts --verify')).toEqual([]);
		expect(fails('npx rocketh-doc -e sepolia --except-suffix _Proxy --nope')).toEqual(['--nope']);
		expect(fails('npx rocketh-verify -e sepolia etherscan --license MIT --force-license')).toEqual([]);
		// an option of one explorer is not an option of another
		expect(fails('npx rocketh-verify -e sepolia sourcify --license MIT')).toEqual(['--license']);
	});

	it("fails the migration skill's old verification line: rocketh-verify has no --contract", () => {
		expect(fails('pnpm rocketh-verify -e sepolia --contract MyContract')).toEqual(['--contract']);
		expect(fails('ETHERSCAN_API_KEY=<your key> pnpm rocketh-verify -e sepolia --contract MyContract')).toEqual([
			'--contract',
		]);
	});

	it("skips npx's and pnpm's own flags, and exempts commands rocketh does not own", () => {
		expect(fails('npx -y rocketh -e sepolia --nope')).toEqual(['--nope']);
		expect(fails('anvil --fork-url https://example.invalid --block-time 2')).toEqual([]);
		expect(fails('pnpm install --frozen-lockfile')).toEqual([]);
		expect(fails('pnpm deploy:watch sepolia --whatever')).toEqual([]);
	});

	it('reads every command of a shell block, naming the line', () => {
		const skill = skillOf(
			`${FRONTMATTER}\n\`\`\`bash\n# a comment --ignored\npnpm compile && npx hardhat deploy \\\n  --write-transactions out.json\n\`\`\`\n`,
		);
		expect(checkFlags(skill, surfaces).map(formatFailure)).toEqual([
			'skills/example-skill/SKILL.md: [flag] line 10: `npx hardhat deploy --write-transactions out.json` passes --write-transactions, which the command does not take',
		]);
	});
});

describe('rule: frontmatter', () => {
	const messages = (text: string, user = true, version = '0.26.2') =>
		checkFrontmatter(skillOf(text, 'example-skill', user), version).map((f) => f.message);

	it('passes a user skill with a name, a description and a `>=` range not above rocketh', () => {
		expect(messages(FRONTMATTER)).toEqual([]);
		expect(messages(FRONTMATTER.replace("'>=0.1.0'", "'>=0.26.2'"))).toEqual([]);
		expect(
			messages(
				`---\nname: example-skill\ndescription: >-\n  Folded\n  text.\nmetadata:\n  rocketh: ">=0.26.2-next.1"\n---\n`,
			),
		).toEqual([]);
	});

	it('fails what does not parse, a wrong name, and a description out of bounds', () => {
		expect(messages('no frontmatter')).toEqual([expect.stringMatching(/^the frontmatter does not parse: line 1/)]);
		expect(messages('---\nname: [a, b]\n---\n')).toEqual([
			expect.stringMatching(/^the frontmatter does not parse: line 2/),
		]);
		expect(messages(FRONTMATTER.replace('name: example-skill', 'name: other'))).toEqual([
			'`name` is "other", not the folder name "example-skill"',
		]);
		expect(messages(FRONTMATTER.replace('An example.', 'x'.repeat(1025)))).toEqual([
			'`description` must be 1 to 1024 characters, it is 1025',
		]);
		expect(messages(FRONTMATTER.replace('description: An example.\n', ''))).toEqual([
			'`description` must be 1 to 1024 characters, it is missing or not text',
		]);
	});

	it('fails a user skill whose metadata.rocketh is missing, not a `>=` range, or above rocketh', () => {
		expect(messages(FRONTMATTER.replace("metadata:\n  rocketh: '>=0.1.0'\n", ''))).toEqual([
			'`metadata.rocketh` must be a `>=<version>` range, it is undefined',
		]);
		expect(messages(FRONTMATTER.replace("'>=0.1.0'", "'^0.1.0'"))).toEqual([
			'`metadata.rocketh` must be a `>=<version>` range, it is "^0.1.0"',
		]);
		expect(messages(FRONTMATTER.replace("'>=0.1.0'", "'>=0.27.0'"))).toEqual([
			'`metadata.rocketh` is >=0.27.0, above rocketh 0.26.2 in packages/rocketh/package.json',
		]);
	});

	it('fails a user skill whose body is 500 lines or more, and asks neither of the migration skill', () => {
		const long = `${FRONTMATTER}${'line\n'.repeat(500)}`;
		expect(messages(long)).toEqual([expect.stringMatching(/^the body is 500 lines; keep it under 500/)]);
		expect(messages(`---\nname: example-skill\ndescription: d\n---\n${'line\n'.repeat(500)}`, false)).toEqual([]);
	});

	it('compares versions by semver precedence', () => {
		expect(compareVersions('0.26.2', '0.26.10')).toBeLessThan(0);
		expect(compareVersions('1.0.0-next.2', '1.0.0')).toBeLessThan(0);
		expect(compareVersions('1.0.0-next.10', '1.0.0-next.2')).toBeGreaterThan(0);
		expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
	});
});

describe('rule: export-name', () => {
	it("passes the throwaway skill's exports.json, and a skill without one has an empty table", () => {
		expect(checkExportNames(example, EXAMPLE_FIXTURES)).toEqual([]);
		expect(checkExportNames({...example, name: 'no-fixtures'}, EXAMPLE_FIXTURES)).toEqual([]);
	});

	it('fails a name the package root does not export, and a package that is not here', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-harness-exports-'));
		try {
			fs.mkdirSync(path.join(dir, 'example-skill'));
			fs.writeFileSync(
				path.join(dir, 'example-skill/exports.json'),
				JSON.stringify({'@rocketh/proxy': ['deployViaProxy', 'deployProxy'], '@rocketh/nope': ['x']}),
			);
			expect(checkExportNames(example, dir).map((f) => `${f.rule}: ${f.message}`)).toEqual([
				'export-name: @rocketh/proxy does not export `deployProxy` from its root',
				'export-name: @rocketh/nope is not a package of this repository',
			]);
		} finally {
			fs.rmSync(dir, {recursive: true, force: true});
		}
	});
});

describe('the shared node declares a named account of each signability', () => {
	it('node, impersonated, unsignable and local, as the broadcast path classifies them', async () => {
		const {env} = await createNode({
			accounts: {
				deployer: 0,
				impersonated: IMPERSONABLE_ADDRESS,
				unsignable: UNSIGNABLE_ADDRESS,
				local: `privateKey:${LOCAL_PRIVATE_KEY}`,
			},
		});
		const send = (account: string) =>
			deploy(env)(`From_${account}`, {account, artifact: artifacts.Registry, args: [UNSIGNABLE_ADDRESS]});

		for (const account of ['deployer', 'impersonated', 'local']) await send(account);
		await expect(send('unsignable')).rejects.toMatchObject({name: 'UnknownSignerError'});

		expect(env.capturedTransactions.map((tx) => (tx.type === 'intent' ? tx.signability : tx.type))).toEqual([
			'node',
			'impersonated',
			'local',
		]);
	});
});
