/**
 * Every skill under `skills/`, checked by the harness (`harness.ts`): one `describe` per skill
 * folder, discovered from the disk, so a new skill is checked by being there. A failure names
 * the file and the rule; `harness.ts` says what each rule asks.
 *
 * The user skills' code samples are fixtures under `skill-fixtures/<skill>/`, compiled by
 * `pnpm typecheck` and run by the tests next to them; the migration skill keeps its own pair
 * checks in `migration-pairs/skill.test.ts`.
 */

import {describe, it, expect, beforeAll} from 'vitest';

import {
	checkSamples,
	checkSkill,
	discoverSkills,
	formatFailure,
	loadCommandSurfaces,
	type CommandSurfaces,
} from './harness.js';

const skills = discoverSkills();

let surfaces: CommandSurfaces;
beforeAll(async () => {
	surfaces = await loadCommandSurfaces();
});

describe('the skills under skills/', () => {
	it('include the migration skill, so the discovery is looking in the right place', () => {
		expect(skills.map((skill) => skill.name)).toContain('hardhat-deploy-migration');
	});

	it('every fixture folder belongs to a skill, and every sample in one is included or named', () => {
		expect(checkSamples(skills).map(formatFailure)).toEqual([]);
	});
});

describe.each(skills.map((skill) => [skill.name, skill] as const))('skill %s', (_name, skill) => {
	it(`passes every check of a ${skill.user ? 'user skill' : 'skill'}`, () => {
		expect(checkSkill(skill, {surfaces}).map(formatFailure)).toEqual([]);
	});
});
