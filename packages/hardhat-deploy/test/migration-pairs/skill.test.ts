/**
 * The migration skill (`skills/hardhat-deploy-migration/SKILL.md`) teaches FROM these pairs, and
 * this test is what keeps it doing so.
 *
 * The skill is read on its own (it is fetched as a single file), so it carries the code rather
 * than linking to it. A copied example drifts the moment either side changes, and a drifted
 * example is how the skill came to teach a proxy option that does not exist. So every code block
 * the skill takes from a pair is preceded by a marker naming its file:
 *
 *     <!-- migration-pair: deploy/04d_proxy_transparent.ts -->
 *     ```ts
 *     ...the file, verbatim...
 *     ```
 *
 * and this test fails when the block and the file differ. It also fails when a pair file is
 * neither included nor named by the skill, so a new pair cannot be forgotten there.
 */

import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const PAIRS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.join(PAIRS_ROOT, '../../../../skills/hardhat-deploy-migration/SKILL.md');

/**
 * Every pair: the hardhat-deploy v1 half (reference text, never compiled) and the rocketh half
 * (compiled by `pnpm typecheck`, run by the `*.pairs.test.ts` next to this file).
 */
const PAIRS: {topic: string; v1: string; v2: string}[] = [
	{topic: 'plain deploy', v1: 'deploy/01_token.v1.ts', v2: 'deploy/01_token.ts'},
	{topic: 'linked libraries', v1: 'deploy/02_calculator.v1.ts', v2: 'deploy/02_calculator.ts'},
	{topic: 'deterministic deploy', v1: 'deploy/03_registry.v1.ts', v2: 'deploy/03_registry.ts'},
	{topic: 'proxy: EIP173Proxy', v1: 'deploy/04a_proxy_erc173.v1.ts', v2: 'deploy/04a_proxy_erc173.ts'},
	{
		topic: 'proxy: EIP173ProxyWithReceive',
		v1: 'deploy/04b_proxy_erc173_with_receive.v1.ts',
		v2: 'deploy/04b_proxy_erc173_with_receive.ts',
	},
	{topic: 'proxy: UUPS', v1: 'deploy/04c_proxy_uups.v1.ts', v2: 'deploy/04c_proxy_uups.ts'},
	{
		topic: 'proxy: OpenZeppelinTransparentProxy',
		v1: 'deploy/04d_proxy_transparent.v1.ts',
		v2: 'deploy/04d_proxy_transparent.ts',
	},
	{
		topic: 'proxy: OptimizedTransparentProxy',
		v1: 'deploy/04e_proxy_optimized_transparent.v1.ts',
		v2: 'deploy/04e_proxy_optimized_transparent.ts',
	},
	{topic: 'proxy execute {init, onUpgrade}', v1: 'deploy/05_vault.v1.ts', v2: 'deploy/05_vault.ts'},
	{topic: 'upgradeIndex, step 0', v1: 'deploy/06a_treasury.v1.ts', v2: 'deploy/06a_treasury.ts'},
	{topic: 'upgradeIndex, step 1', v1: 'deploy/06b_treasury_upgrade.v1.ts', v2: 'deploy/06b_treasury_upgrade.ts'},
	{topic: 'diamond deploy', v1: 'deploy/07a_diamond.v1.ts', v2: 'deploy/07a_diamond.ts'},
	{
		topic: 'diamond cut',
		v1: 'deploy/07b_diamond_with_new_facet.v1.ts',
		v2: 'deploy/07b_diamond_with_new_facet.ts',
	},
	{topic: 'execute and read by name', v1: 'deploy/08_greeter.v1.ts', v2: 'deploy/08_greeter.ts'},
	{
		topic: 'run-once script',
		v1: 'deploy/09_seed_deployer_balance.v1.ts',
		v2: 'deploy/09_seed_deployer_balance.ts',
	},
	{topic: 'skip, as an early return', v1: 'deploy/10_faucet.v1.ts', v2: 'deploy/10_faucet.ts'},
	{topic: 'named accounts per network', v1: 'hardhat.config.v1.ts', v2: 'rocketh/config.ts'},
	{topic: 'tagged fixture in a test', v1: 'test/Token.v1.ts', v2: 'test/fixtures.ts'},
];

const skill = fs.readFileSync(SKILL_PATH, 'utf8');

/** Every `<!-- migration-pair: <file> -->` marker and the fenced block right after it. */
function includedBlocks(): {file: string; code: string | undefined}[] {
	const blocks: {file: string; code: string | undefined}[] = [];
	const marker = /<!-- migration-pair: (\S+) -->\n+(?:```\w*\n([\s\S]*?)\n```)?/g;
	for (const match of skill.matchAll(marker)) {
		blocks.push({file: match[1], code: match[2]});
	}
	return blocks;
}

function read(file: string): string {
	return fs.readFileSync(path.join(PAIRS_ROOT, file), 'utf8').trimEnd();
}

function listFiles(dir: string): string[] {
	return fs
		.readdirSync(path.join(PAIRS_ROOT, dir), {withFileTypes: true})
		.flatMap((entry) => (entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}

describe('the migration skill teaches from the executed pairs', () => {
	it('every pair has both halves on disk, and every v1 file belongs to a pair', () => {
		for (const pair of PAIRS) {
			expect(fs.existsSync(path.join(PAIRS_ROOT, pair.v1)), pair.v1).toBe(true);
			expect(fs.existsSync(path.join(PAIRS_ROOT, pair.v2)), pair.v2).toBe(true);
		}
		const v1Files = listFiles('.').filter((file) => file.endsWith('.v1.ts'));
		expect(v1Files.sort()).toEqual(PAIRS.map((pair) => pair.v1).sort());
	});

	it('every code block the skill marks as a pair is that file, verbatim', () => {
		const blocks = includedBlocks();
		expect(blocks.length).toBeGreaterThan(0);
		for (const {file, code} of blocks) {
			expect(code, `the marker for ${file} must be followed by a fenced code block`).toBeDefined();
			expect(code, `SKILL.md's copy of ${file} differs from the file: copy the file over`).toBe(read(file));
		}
	});

	it('every half of every pair is included in the skill, or named by it', () => {
		const included = new Set(includedBlocks().map((block) => block.file));
		for (const pair of PAIRS) {
			for (const file of [pair.v1, pair.v2]) {
				expect(included.has(file) || skill.includes(file), `${file} is neither included nor named in SKILL.md`).toBe(
					true,
				);
			}
		}
	});

	it('does not teach `proxyKind`, which is not an option', () => {
		expect(skill).not.toMatch(/proxyKind:/);
	});
});
