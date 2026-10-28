/**
 * The SKILL HARNESS: the checks that make an agent skill under `skills/` fail the build when it
 * stops being true (ADR 0017). A skill is a machine for repeating claims, so every claim this
 * file can check mechanically is checked here, per skill folder, discovered from the disk:
 *
 * - `fixture-marker`: in a user skill, every `<!-- fixture: <path> -->` is followed by a fenced
 *   block equal to that file under `skill-fixtures/` (compiled by `pnpm typecheck`, run by
 *   `pnpm test`).
 * - `unmarked-typescript`: in a user skill, every TypeScript block of `SKILL.md` and
 *   `references/*.md` carries such a marker.
 * - `unused-sample` / `fixture-folder`: every sample under `skill-fixtures/<skill>/` is included or
 *   named by some skill, and every fixture folder belongs to a skill.
 * - `link`: every `https://rocketh.dev/<path>/[#anchor]` resolves to `<path>/index.md` in this
 *   repository, and the anchor to an explicit `{#id}` or a heading slug of that page.
 * - `flag`: every `--flag` in a shell block is an option of the command on its line.
 * - `frontmatter`: it parses, `name` is the folder, `description` is 1 to 1024 characters; for a
 *   user skill, the body is under 500 lines and `metadata.rocketh` is a `>=` range no higher than
 *   `packages/rocketh/package.json`.
 * - `export-name`: each identifier a user skill attributes to a package, listed in its
 *   `skill-fixtures/<skill>/exports.json`, is exported by that package's root.
 *
 * Every check RETURNS failures rather than asserting, each naming the file and the rule, so the
 * test that runs them (`skills.test.ts`) reports all of them at once, and the harness's own tests
 * (`harness.test.ts`) can show a check failing on a sample of text.
 *
 * Nothing here runs a CLI or touches the network: commands are checked against their option
 * declarations in source, and the frontmatter is parsed by a small reader of the YAML subset a
 * skill uses.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {createHardhatRuntimeEnvironment} from 'hardhat/hre';
import hardhatDeployPlugin from '../../src/index.js';

/** The repository root. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
/** Where the skills live: one folder per skill. */
export const SKILLS_ROOT = path.join(REPO_ROOT, 'skills');
/** Where the user skills' fixtures live: one folder per skill, plus `_shared/`. */
export const FIXTURES_ROOT = path.join(REPO_ROOT, 'packages/hardhat-deploy/test/skill-fixtures');

/**
 * THE definition of a user skill, in one place: every folder under `skills/` except these. The
 * migration skill predates the fixtures: it teaches from `migration-pairs/` with its own
 * `<!-- migration-pair: -->` marker (`migration-pairs/skill.test.ts`), and it may carry
 * unmarked blocks. The link, flag and basic frontmatter checks apply to it all the same.
 */
export const NOT_USER_SKILLS: readonly string[] = ['hardhat-deploy-migration'];

export function isUserSkill(name: string): boolean {
	return !NOT_USER_SKILLS.includes(name);
}

export type Rule =
	| 'fixture-marker'
	| 'unmarked-typescript'
	| 'unused-sample'
	| 'fixture-folder'
	| 'link'
	| 'flag'
	| 'frontmatter'
	| 'export-name';

export type Failure = {rule: Rule; file: string; message: string};

/** `<file>: [<rule>] <message>`, the line a failing test prints. */
export function formatFailure(failure: Failure): string {
	return `${failure.file}: [${failure.rule}] ${failure.message}`;
}

/** One Markdown file of a skill: its `SKILL.md` or one of its `references/*.md`. */
export type SkillDoc = {
	/** The path shown in a failure, relative to the repository root. */
	file: string;
	text: string;
};

export type Skill = {
	/** The folder name. */
	name: string;
	user: boolean;
	/** `SKILL.md` first, then `references/*.md`. */
	docs: SkillDoc[];
};

function rel(file: string): string {
	return path.relative(REPO_ROOT, file).split(path.sep).join('/');
}

function readDoc(file: string): SkillDoc {
	return {file: rel(file), text: fs.readFileSync(file, 'utf8')};
}

/** Every folder under `skillsRoot` holding a `SKILL.md`, by name. */
export function discoverSkills(skillsRoot: string = SKILLS_ROOT): Skill[] {
	return fs
		.readdirSync(skillsRoot, {withFileTypes: true})
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort()
		.map((name) => {
			const dir = path.join(skillsRoot, name);
			const docs: SkillDoc[] = [];
			const skillFile = path.join(dir, 'SKILL.md');
			if (fs.existsSync(skillFile)) docs.push(readDoc(skillFile));
			const references = path.join(dir, 'references');
			if (fs.existsSync(references)) {
				for (const file of fs.readdirSync(references).sort()) {
					if (file.endsWith('.md')) docs.push(readDoc(path.join(references, file)));
				}
			}
			return {name, user: isUserSkill(name), docs};
		});
}

// ---------------------------------------------------------------------------------------------
// Markdown: fenced blocks
// ---------------------------------------------------------------------------------------------

export type FencedBlock = {
	/** The info string's first word (`ts`, `bash`), lowercased; empty when there is none. */
	lang: string;
	code: string;
	/** 1-based line of the opening fence. */
	line: number;
	/** The `<!-- <kind>: <path> -->` marker on the last non-blank line before the fence, if any. */
	marker?: {kind: string; path: string};
};

const MARKER = /^<!--\s*([\w-]+):\s*(\S+)\s*-->\s*$/;
const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;

/** A line closing a block opened by `fence`: the same character, at least as many, nothing after. */
function closesFence(line: string, fence: string): boolean {
	const match = line.trim().match(/^(`{3,}|~{3,})$/);
	return match !== null && match[1][0] === fence[0] && match[1].length >= fence.length;
}

/** Every fenced code block of a Markdown text, with the marker that precedes it. */
export function fencedBlocks(text: string): FencedBlock[] {
	const lines = text.split('\n');
	const blocks: FencedBlock[] = [];
	for (let i = 0; i < lines.length; i++) {
		const open = lines[i].match(/^(\s*)(`{3,}|~{3,})\s*([^\s`]*)/);
		if (!open) continue;
		const fence = open[2];
		const start = i;
		const body: string[] = [];
		i++;
		while (i < lines.length && !closesFence(lines[i], fence)) {
			body.push(lines[i]);
			i++;
		}
		let previous = start - 1;
		while (previous >= 0 && lines[previous].trim() === '') previous--;
		const markerMatch = previous >= 0 ? lines[previous].trim().match(MARKER) : null;
		blocks.push({
			lang: open[3].toLowerCase(),
			code: body.join('\n'),
			line: start + 1,
			marker: markerMatch ? {kind: markerMatch[1], path: markerMatch[2]} : undefined,
		});
	}
	return blocks;
}

const TYPESCRIPT_LANGS = new Set(['ts', 'typescript', 'tsx', 'mts', 'cts']);
const SHELL_LANGS = new Set(['bash', 'sh', 'shell', 'zsh', 'console']);

// ---------------------------------------------------------------------------------------------
// Rule: fixture markers, unmarked TypeScript, samples
// ---------------------------------------------------------------------------------------------

/** The kind of marker a user skill uses: `<!-- fixture: <path under skill-fixtures/> -->`. */
export const FIXTURE_MARKER = 'fixture';

/**
 * In a user skill: every fixture marker is followed by a fenced block equal to its file, and
 * every TypeScript block is marked. Not applied to the migration skill (see `NOT_USER_SKILLS`).
 */
export function checkFixtureMarkers(skill: Skill, fixturesRoot: string = FIXTURES_ROOT): Failure[] {
	const failures: Failure[] = [];
	for (const doc of skill.docs) {
		const lines = doc.text.split('\n');
		const blocks = fencedBlocks(doc.text);
		// a marker must be directly followed (blank lines aside) by a fenced block
		lines.forEach((line, index) => {
			const match = line.trim().match(MARKER);
			if (!match || match[1] !== FIXTURE_MARKER) return;
			const next = lines.slice(index + 1).find((l) => l.trim() !== '');
			if (next === undefined || !FENCE_OPEN.test(next)) {
				failures.push({
					rule: 'fixture-marker',
					file: doc.file,
					message: `line ${index + 1}: the marker for ${match[2]} must be followed by a fenced code block`,
				});
			}
		});
		for (const block of blocks) {
			if (block.marker?.kind !== FIXTURE_MARKER) continue;
			const file = path.join(fixturesRoot, block.marker.path);
			if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
				failures.push({
					rule: 'fixture-marker',
					file: doc.file,
					message: `line ${block.line}: ${block.marker.path} is no file under ${rel(fixturesRoot)}/`,
				});
			} else if (block.code !== fs.readFileSync(file, 'utf8').trimEnd()) {
				failures.push({
					rule: 'fixture-marker',
					file: doc.file,
					message: `line ${block.line}: the block differs from ${rel(file)}: copy the file over`,
				});
			}
		}
		for (const block of blocks) {
			if (TYPESCRIPT_LANGS.has(block.lang) && block.marker?.kind !== FIXTURE_MARKER) {
				failures.push({
					rule: 'unmarked-typescript',
					file: doc.file,
					message: `line ${block.line}: a TypeScript block must be preceded by <!-- ${FIXTURE_MARKER}: <path> --> and be that file under ${rel(fixturesRoot)}/`,
				});
			}
		}
	}
	return failures;
}

/** The folders of `fixturesRoot` that belong to a skill (`_shared/` and the like do not). */
export function fixtureFolders(fixturesRoot: string = FIXTURES_ROOT): string[] {
	if (!fs.existsSync(fixturesRoot)) return [];
	return fs
		.readdirSync(fixturesRoot, {withFileTypes: true})
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
		.map((entry) => entry.name)
		.sort();
}

function listFiles(dir: string): string[] {
	return fs
		.readdirSync(dir, {withFileTypes: true})
		.flatMap((entry) => (entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}

/**
 * The SAMPLES of a fixture folder, as paths relative to `fixturesRoot`: every TypeScript file
 * that is not a test. A fixture folder holds only what a skill shows plus its tests (and
 * `exports.json`, baseline prompts in Markdown); a helper no skill shows belongs in `_shared/`.
 */
export function samples(skillName: string, fixturesRoot: string = FIXTURES_ROOT): string[] {
	const dir = path.join(fixturesRoot, skillName);
	if (!fs.existsSync(dir)) return [];
	return listFiles(dir)
		.filter((file) => /\.(ts|tsx|mts|cts)$/.test(file) && !/\.test\.(ts|tsx|mts|cts)$/.test(file))
		.map((file) => path.relative(fixturesRoot, file).split(path.sep).join('/'))
		.sort();
}

/** Every fixture folder belongs to a skill, and every sample in it is included or named by some skill. */
export function checkSamples(skills: Skill[], fixturesRoot: string = FIXTURES_ROOT): Failure[] {
	const failures: Failure[] = [];
	const names = new Set(skills.map((skill) => skill.name));
	const allText = skills.flatMap((skill) => skill.docs.map((doc) => doc.text)).join('\n');
	for (const folder of fixtureFolders(fixturesRoot)) {
		if (!names.has(folder)) {
			failures.push({
				rule: 'fixture-folder',
				file: rel(path.join(fixturesRoot, folder)),
				message: `no skill is named ${folder}: a fixture folder is named after the skill it serves`,
			});
		}
		for (const sample of samples(folder, fixturesRoot)) {
			if (!allText.includes(sample)) {
				failures.push({
					rule: 'unused-sample',
					file: rel(path.join(fixturesRoot, sample)),
					message: `no skill includes or names ${sample}: include it with <!-- ${FIXTURE_MARKER}: ${sample} -->, name it, or move a helper to _shared/`,
				});
			}
		}
	}
	return failures;
}

// ---------------------------------------------------------------------------------------------
// Rule: links to rocketh.dev
// ---------------------------------------------------------------------------------------------

/**
 * GitHub's slug of a heading, which is what the site uses (`github-slugger`, in the
 * template-svelte-docs engine rocketh-website renders with): lowercased, punctuation removed,
 * spaces turned into hyphens.
 */
export function slug(heading: string): string {
	return heading
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
		.replace(/ /g, '-');
}

/** The text of a heading as rendered: inline code, emphasis and link targets dropped. */
function headingText(raw: string): string {
	return raw
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/`([^`]*)`/g, '$1')
		.replace(/(\*\*|__)(.+?)\1/g, '$2')
		.replace(/(^|\W)[*_](.+?)[*_](?=\W|$)/g, '$1$2')
		.trim();
}

/** Every anchor a page has: its explicit `{#id}`s, then the slugs of the other headings. */
export function anchorsOf(markdown: string): Set<string> {
	const lines = markdown.split('\n');
	const headings: string[] = [];
	let fence: string | undefined;
	for (const line of lines) {
		const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
		if (fenceMatch) {
			if (fence === undefined) fence = fenceMatch[1];
			else if (fenceMatch[1].startsWith(fence[0]) && fenceMatch[1].length >= fence.length) fence = undefined;
			continue;
		}
		if (fence !== undefined) continue;
		const heading = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
		if (heading) headings.push(heading[1]);
	}
	const anchors = new Set<string>();
	const counts = new Map<string, number>();
	const take = (base: string) => {
		let candidate = base;
		let n = counts.get(base) ?? 0;
		while (anchors.has(candidate)) candidate = `${base}-${++n}`;
		counts.set(base, n);
		anchors.add(candidate);
	};
	const explicit = /\s*\{#([^}\s]+)\}\s*$/;
	for (const heading of headings) {
		const match = heading.match(explicit);
		if (match) take(match[1]);
	}
	for (const heading of headings) {
		if (explicit.test(heading)) continue;
		take(slug(headingText(heading)));
	}
	return anchors;
}

const ROCKETH_DEV = /https:\/\/rocketh\.dev(\/[^\s)\]>"'`]*)?/g;

/** Every `https://rocketh.dev/...` link resolves to a page of this repository, and its anchor to a heading. */
export function checkLinks(skill: Skill, repoRoot: string = REPO_ROOT): Failure[] {
	const failures: Failure[] = [];
	for (const doc of skill.docs) {
		for (const match of doc.text.matchAll(ROCKETH_DEV)) {
			const url = match[0].replace(/[.,;:]+$/, '');
			const [pathPart, anchor] = (match[1] ?? '/').replace(/[.,;:]+$/, '').split('#');
			// the skills themselves are served by the site from `skills/`, not as pages
			if (pathPart.startsWith('/skills/')) continue;
			const page = path.join(repoRoot, pathPart.replace(/^\/+|\/+$/g, ''), 'index.md');
			const line = doc.text.slice(0, match.index).split('\n').length;
			if (!fs.existsSync(page)) {
				failures.push({
					rule: 'link',
					file: doc.file,
					message: `line ${line}: ${url} is no page: ${rel(page)} does not exist`,
				});
				continue;
			}
			if (anchor !== undefined && anchor !== '' && !anchorsOf(fs.readFileSync(page, 'utf8')).has(anchor)) {
				failures.push({
					rule: 'link',
					file: doc.file,
					message: `line ${line}: ${url}: ${rel(page)} has no heading with the anchor #${anchor}`,
				});
			}
		}
	}
	return failures;
}

// ---------------------------------------------------------------------------------------------
// Rule: command-line flags
// ---------------------------------------------------------------------------------------------

/** A command's options: its own, and each subcommand's. Long flags only, without the dashes. */
export type CommandSurface = {
	options: Set<string>;
	subcommands: Map<string, Set<string>>;
};

/** What the hardhat line is checked against: the deploy task's options and Hardhat's globals. */
export type HardhatSurface = {
	deployOptions: Set<string>;
	/** Global option name (kebab-cased) to whether it takes a value. */
	globals: Map<string, boolean>;
};

export type CommandSurfaces = {
	/** The commander CLIs rocketh owns, by command name. */
	commands: Map<string, CommandSurface>;
	hardhat: HardhatSurface;
};

/** The source declaring each commander CLI rocketh owns: `rocketh`'s lives apart from its bin script. */
export const COMMAND_SOURCES: Readonly<Record<string, string>> = {
	rocketh: 'packages/rocketh-node/src/cli-options.ts',
	'rocketh-export': 'packages/rocketh-export/src/cli.ts',
	'rocketh-verify': 'packages/rocketh-verifier/src/cli.ts',
	'rocketh-doc': 'packages/rocketh-doc/src/cli.ts',
	'hardhat-deploy': 'packages/hardhat-deploy/src/cli.ts',
};

function longFlags(flags: string): string[] {
	return flags
		.split(/[\s,|]+/)
		.filter((token) => token.startsWith('--'))
		.map((token) => token.slice(2));
}

/**
 * The options a commander program declares, read from its SOURCE (a bin script runs on import):
 * `.option(...)`, `.requiredOption(...)` and `new Option(...)`, split at each `.command(...)`
 * into the program's own and each subcommand's. `--help` always exists, `--version` when the
 * program calls `.version(...)`.
 */
export function commanderSurface(source: string): CommandSurface {
	const parts = source.split(/\.command\(\s*/);
	const optionsIn = (part: string) => {
		const found = new Set<string>(['help']);
		const declaration = /(?:\.(?:option|requiredOption)\(|new Option\()\s*(?:\/\/[^\n]*\n\s*)*(['"`])(.*?)\1/g;
		for (const match of part.matchAll(declaration)) {
			for (const flag of longFlags(match[2])) found.add(flag);
		}
		if (/\.version\(/.test(part)) found.add('version');
		return found;
	};
	const surface: CommandSurface = {options: optionsIn(parts[0]), subcommands: new Map()};
	for (const part of parts.slice(1)) {
		const name = part.match(/^(['"`])([^'"`\s]+)/);
		if (name) surface.subcommands.set(name[2], optionsIn(part));
	}
	return surface;
}

/** `gasPrice` -> `gas-price`: how Hardhat spells a task option on the command line. */
export function kebab(name: string): string {
	return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Every command surface, read once: the commander CLIs from their source, the deploy task from
 * the plugin itself (`packages/hardhat-deploy/src/index.ts`), and Hardhat 3's global options from
 * an empty Hardhat runtime environment, so a new global in the installed Hardhat is known.
 */
export async function loadCommandSurfaces(repoRoot: string = REPO_ROOT): Promise<CommandSurfaces> {
	const commands = new Map<string, CommandSurface>();
	for (const [command, file] of Object.entries(COMMAND_SOURCES)) {
		commands.set(command, commanderSurface(fs.readFileSync(path.join(repoRoot, file), 'utf8')));
	}
	const deployTask = hardhatDeployPlugin.tasks?.find((task) => task.id.join(' ') === 'deploy');
	if (!deployTask || !('options' in deployTask)) throw new Error('hardhat-deploy declares no `deploy` task');
	const deployOptions = new Set(['help', ...Object.keys(deployTask.options).map(kebab)]);
	const hre = await createHardhatRuntimeEnvironment({});
	const globals = new Map<string, boolean>();
	for (const [name, defaultValue] of Object.entries(hre.globalOptions)) {
		// a flag defaults to `false`; anything else (a string, a level) takes a value
		globals.set(kebab(name), typeof defaultValue !== 'boolean');
	}
	return {commands, hardhat: {deployOptions, globals}};
}

/** The words of a shell command, quotes respected, and a `<placeholder>` one word even with spaces in it. */
function words(command: string): string[] {
	return [
		...command
			.replace(/<[^<>]*>/g, (placeholder) => placeholder.replace(/\s+/g, '_'))
			.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g),
	].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** `--name=value` -> `name`. */
function flagName(token: string): string {
	return token.slice(2).split('=')[0];
}

/**
 * The flags of one shell command that its command does not take, or `[]`. `VAR=value` prefixes
 * are skipped, then a leading `npx`, `pnpm` or `pnpm exec` (their own flags are not checked).
 * Commands rocketh does not own (`anvil`, `node`, a `pnpm` script name) are not checked.
 */
export function unknownFlags(command: string, surfaces: CommandSurfaces): string[] {
	const tokens = words(command);
	let i = 0;
	while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++;
	if (tokens[i] === 'npx' || tokens[i] === 'pnpm') {
		const runner = tokens[i];
		i++;
		while (i < tokens.length && tokens[i].startsWith('-')) i++;
		if (runner === 'pnpm' && tokens[i] === 'exec') {
			i++;
			while (i < tokens.length && tokens[i].startsWith('-')) i++;
		}
	}
	const name = tokens[i];
	const rest = tokens.slice(i + 1);
	if (name === 'hardhat') return unknownHardhatFlags(rest, surfaces.hardhat);
	const surface = name === undefined ? undefined : surfaces.commands.get(name);
	if (!surface) return [];
	const accepted = new Set(surface.options);
	for (const token of rest) {
		const sub = surface.subcommands.get(token);
		if (sub) for (const option of sub) accepted.add(option);
	}
	return rest.filter((token) => token.startsWith('--') && token !== '--' && !accepted.has(flagName(token)));
}

/**
 * A hardhat line: Hardhat's globals are accepted before or after the task name; the task's own
 * options are checked when the task is `deploy` (or when there is no task); another task is
 * Hardhat's or another plugin's, and only the globals before it are checked.
 */
function unknownHardhatFlags(tokens: string[], hardhat: HardhatSurface): string[] {
	const unknown: string[] = [];
	let task: string | undefined;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token.startsWith('--') || token === '--') {
			if (task === undefined && !token.startsWith('-')) {
				task = token;
				if (task !== 'deploy') return unknown;
			}
			continue;
		}
		const name = flagName(token);
		const takesValue = hardhat.globals.get(name);
		if (takesValue !== undefined) {
			if (takesValue && !token.includes('=')) i++;
			continue;
		}
		if (task === 'deploy' && hardhat.deployOptions.has(name)) continue;
		unknown.push(token);
	}
	return unknown;
}

/** The commands of a shell block: continuations joined, comments dropped, split at `&&`, `||`, `;` and `|`. */
export function shellCommands(code: string): {command: string; line: number}[] {
	const commands: {command: string; line: number}[] = [];
	const lines = code.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const start = i;
		let line = lines[i];
		while (line.trimEnd().endsWith('\\') && i + 1 < lines.length) {
			line = `${line.trimEnd().slice(0, -1)} ${lines[++i]}`;
		}
		const text = line.replace(/^\s*\$\s+/, '').trim();
		if (text === '' || text.startsWith('#')) continue;
		for (const part of text.split(/&&|\|\||;|\|/)) {
			if (part.trim() !== '') commands.push({command: part.trim().replace(/\s+/g, ' '), line: start});
		}
	}
	return commands;
}

/** Every `--flag` in a shell block is an option of the command on its line. */
export function checkFlags(skill: Skill, surfaces: CommandSurfaces): Failure[] {
	const failures: Failure[] = [];
	for (const doc of skill.docs) {
		for (const block of fencedBlocks(doc.text)) {
			if (!SHELL_LANGS.has(block.lang)) continue;
			for (const {command, line} of shellCommands(block.code)) {
				const unknown = unknownFlags(command, surfaces);
				if (unknown.length > 0) {
					failures.push({
						rule: 'flag',
						file: doc.file,
						message: `line ${block.line + 1 + line}: \`${command}\` passes ${unknown.join(', ')}, which the command does not take`,
					});
				}
			}
		}
	}
	return failures;
}

// ---------------------------------------------------------------------------------------------
// Rule: frontmatter
// ---------------------------------------------------------------------------------------------

export type FrontmatterValue = string | {[key: string]: FrontmatterValue};
export type Frontmatter = {data: {[key: string]: FrontmatterValue}; bodyLines: number};

function unquote(raw: string, lineNumber: number): string {
	if (raw.startsWith("'")) {
		if (!/^'(?:[^']|'')*'$/.test(raw)) throw new Error(`line ${lineNumber}: unterminated single-quoted string`);
		return raw.slice(1, -1).replace(/''/g, "'");
	}
	if (raw.startsWith('"')) {
		if (!/^"(?:[^"\\]|\\.)*"$/.test(raw)) throw new Error(`line ${lineNumber}: unterminated double-quoted string`);
		return JSON.parse(raw) as string;
	}
	if (/^[[{&*!|>%@`]/.test(raw)) throw new Error(`line ${lineNumber}: unsupported YAML value \`${raw}\``);
	return raw;
}

/**
 * The frontmatter of a skill, read by a small reader of the YAML a skill uses: `key: value`
 * scalars (plain, single- or double-quoted, or a `>` / `|` block), and nested maps by
 * indentation. Anything else throws, naming the line.
 */
export function parseFrontmatter(text: string): Frontmatter {
	const lines = text.split('\n');
	if (lines[0].trim() !== '---') throw new Error('line 1: a skill starts with a `---` frontmatter block');
	const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	if (end < 0) throw new Error('the frontmatter block is not closed by `---`');
	const yaml = lines.slice(1, end);
	let index = 0;

	function parseMap(indent: number): {[key: string]: FrontmatterValue} {
		const map: {[key: string]: FrontmatterValue} = {};
		while (index < yaml.length) {
			const line = yaml[index];
			const lineNumber = index + 2;
			if (line.trim() === '' || line.trim().startsWith('#')) {
				index++;
				continue;
			}
			const lineIndent = line.length - line.trimStart().length;
			if (lineIndent < indent) return map;
			if (lineIndent > indent) throw new Error(`line ${lineNumber}: unexpected indentation`);
			const entry = line.trim().match(/^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/);
			if (!entry) throw new Error(`line ${lineNumber}: expected \`key: value\`, got \`${line.trim()}\``);
			const [, key, rawValue = ''] = entry;
			if (key in map) throw new Error(`line ${lineNumber}: duplicate key \`${key}\``);
			index++;
			const value = rawValue.replace(/\s+#.*$/, '').trim();
			if (value === '') {
				const next = yaml.slice(index).find((l) => l.trim() !== '');
				const nextIndent = next === undefined ? 0 : next.length - next.trimStart().length;
				if (next === undefined || nextIndent <= indent) throw new Error(`line ${lineNumber}: \`${key}\` has no value`);
				map[key] = parseMap(nextIndent);
			} else if (/^[>|][-+]?$/.test(value)) {
				const block: string[] = [];
				let blockIndent: number | undefined;
				while (index < yaml.length) {
					const l = yaml[index];
					const lIndent = l.length - l.trimStart().length;
					if (l.trim() !== '' && lIndent <= indent) break;
					if (l.trim() !== '') blockIndent ??= lIndent;
					block.push(l.slice(blockIndent ?? 0));
					index++;
				}
				while (block.length > 0 && block[block.length - 1].trim() === '') block.pop();
				map[key] = value.startsWith('>') ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n');
			} else {
				map[key] = unquote(value, lineNumber);
			}
		}
		return map;
	}

	const data = parseMap(0);
	const body = lines.slice(end + 1);
	while (body.length > 0 && body[body.length - 1].trim() === '') body.pop();
	return {data, bodyLines: body.length};
}

/** A version `X.Y.Z[-pre]`, comparable. */
type Version = {core: [number, number, number]; pre?: string};

function parseVersion(text: string): Version | undefined {
	const match = text.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
	if (!match) return undefined;
	return {core: [Number(match[1]), Number(match[2]), Number(match[3])], pre: match[4]};
}

/** Negative, zero or positive, as `a` is below, equal to or above `b` (semver precedence). */
export function compareVersions(a: string, b: string): number {
	const va = parseVersion(a);
	const vb = parseVersion(b);
	if (!va || !vb) throw new Error(`not a version: ${!va ? a : b}`);
	for (let i = 0; i < 3; i++) {
		if (va.core[i] !== vb.core[i]) return va.core[i] - vb.core[i];
	}
	if (va.pre === vb.pre) return 0;
	if (va.pre === undefined) return 1;
	if (vb.pre === undefined) return -1;
	const pa = va.pre.split('.');
	const pb = vb.pre.split('.');
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		if (pa[i] === undefined) return -1;
		if (pb[i] === undefined) return 1;
		const na = /^\d+$/.test(pa[i]) ? Number(pa[i]) : undefined;
		const nb = /^\d+$/.test(pb[i]) ? Number(pb[i]) : undefined;
		if (na !== undefined && nb !== undefined) {
			if (na !== nb) return na - nb;
		} else if (na !== undefined) return -1;
		else if (nb !== undefined) return 1;
		else if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
	}
	return 0;
}

/** The version of `rocketh` in this repository, which `metadata.rocketh` may not exceed. */
export function rockethVersion(repoRoot: string = REPO_ROOT): string {
	const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'packages/rocketh/package.json'), 'utf8')) as {
		version: string;
	};
	return pkg.version;
}

/** The longest a user skill's `SKILL.md` body may be, exclusive. */
export const MAX_BODY_LINES = 500;

/** The frontmatter of `SKILL.md` parses and says what it must. */
export function checkFrontmatter(skill: Skill, currentRockethVersion: string = rockethVersion()): Failure[] {
	const doc = skill.docs.find((d) => d.file.endsWith('/SKILL.md'));
	if (!doc) return [{rule: 'frontmatter', file: `skills/${skill.name}`, message: 'the skill has no SKILL.md'}];
	const fail = (message: string): Failure => ({rule: 'frontmatter', file: doc.file, message});
	let frontmatter: Frontmatter;
	try {
		frontmatter = parseFrontmatter(doc.text);
	} catch (error) {
		return [fail(`the frontmatter does not parse: ${(error as Error).message}`)];
	}
	const failures: Failure[] = [];
	const {name, description, metadata} = frontmatter.data;
	if (name !== skill.name)
		failures.push(fail(`\`name\` is ${JSON.stringify(name)}, not the folder name "${skill.name}"`));
	if (typeof description !== 'string' || description.length < 1 || description.length > 1024) {
		failures.push(
			fail(
				`\`description\` must be 1 to 1024 characters, it is ${typeof description === 'string' ? `${description.length}` : 'missing or not text'}`,
			),
		);
	}
	if (!skill.user) return failures;
	if (frontmatter.bodyLines >= MAX_BODY_LINES) {
		failures.push(
			fail(
				`the body is ${frontmatter.bodyLines} lines; keep it under ${MAX_BODY_LINES} and move detail to references/`,
			),
		);
	}
	const range = typeof metadata === 'object' ? metadata.rocketh : undefined;
	const lowerBound = typeof range === 'string' ? range.match(/^>=\s*(\S+)$/)?.[1] : undefined;
	if (lowerBound === undefined || parseVersion(lowerBound) === undefined) {
		failures.push(fail(`\`metadata.rocketh\` must be a \`>=<version>\` range, it is ${JSON.stringify(range)}`));
	} else if (compareVersions(lowerBound, currentRockethVersion) > 0) {
		failures.push(
			fail(`\`metadata.rocketh\` is ${range}, above rocketh ${currentRockethVersion} in packages/rocketh/package.json`),
		);
	}
	return failures;
}

// ---------------------------------------------------------------------------------------------
// Rule: export names
// ---------------------------------------------------------------------------------------------

/** The file a skill declares its package attributions in, inside its fixture folder. */
export const EXPORTS_FILE = 'exports.json';

/** `{"@rocketh/proxy": ["deployViaProxy"]}` from `skill-fixtures/<skill>/exports.json`; `{}` when there is none. */
export function declaredExports(skillName: string, fixturesRoot: string = FIXTURES_ROOT): Record<string, string[]> {
	const file = path.join(fixturesRoot, skillName, EXPORTS_FILE);
	if (!fs.existsSync(file)) return {};
	return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string[]>;
}

/** Each workspace package's name and folder. */
function workspacePackages(repoRoot: string): Map<string, string> {
	const packages = new Map<string, string>();
	const root = path.join(repoRoot, 'packages');
	for (const dir of fs.readdirSync(root)) {
		const manifest = path.join(root, dir, 'package.json');
		if (!fs.existsSync(manifest)) continue;
		packages.set((JSON.parse(fs.readFileSync(manifest, 'utf8')) as {name: string}).name, path.join(root, dir));
	}
	return packages;
}

/** Each package's `src/index.ts` entry, and ONE program over all of them, per repository root. */
type ExportIndex = {entries: Map<string, string>; program: ts.Program; names: Map<string, Set<string>>};
const exportIndexes = new Map<string, ExportIndex>();

/**
 * Built lazily once per repository root: one TypeScript program over every workspace package's
 * entry, so a skill naming several packages pays for one program, not one per package.
 */
function exportIndex(repoRoot: string): ExportIndex {
	const cached = exportIndexes.get(repoRoot);
	if (cached) return cached;
	const entries = new Map<string, string>();
	for (const [name, dir] of workspacePackages(repoRoot)) {
		const entry = path.join(dir, 'src/index.ts');
		if (fs.existsSync(entry)) entries.set(name, entry);
	}
	const program = ts.createProgram([...entries.values()], {
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		target: ts.ScriptTarget.ESNext,
		noEmit: true,
		skipLibCheck: true,
		types: [],
	});
	const index = {entries, program, names: new Map<string, Set<string>>()};
	exportIndexes.set(repoRoot, index);
	return index;
}

/**
 * The names a workspace package's ROOT (`.`) exports, values and types alike, read by the
 * TypeScript compiler from its `src/index.ts`, so nothing has to be built and a re-export
 * (`export * from`) counts.
 */
export function rootExports(packageName: string, repoRoot: string = REPO_ROOT): Set<string> | undefined {
	const index = exportIndex(repoRoot);
	const cached = index.names.get(packageName);
	if (cached) return cached;
	const entry = index.entries.get(packageName);
	if (!entry) return undefined;
	const checker = index.program.getTypeChecker();
	const source = index.program.getSourceFile(entry);
	const symbol = source && checker.getSymbolAtLocation(source);
	const names = new Set(symbol ? checker.getExportsOfModule(symbol).map((s) => s.getName()) : []);
	index.names.set(packageName, names);
	return names;
}

/** Each identifier a user skill attributes to a package (its `exports.json`) is exported by that package's root. */
export function checkExportNames(
	skill: Skill,
	fixturesRoot: string = FIXTURES_ROOT,
	repoRoot: string = REPO_ROOT,
): Failure[] {
	const file = rel(path.join(fixturesRoot, skill.name, EXPORTS_FILE));
	let declared: Record<string, string[]>;
	try {
		declared = declaredExports(skill.name, fixturesRoot);
	} catch (error) {
		return [{rule: 'export-name', file, message: `does not parse: ${(error as Error).message}`}];
	}
	const failures: Failure[] = [];
	for (const [packageName, names] of Object.entries(declared)) {
		if (!Array.isArray(names) || names.some((n) => typeof n !== 'string')) {
			failures.push({rule: 'export-name', file, message: `${packageName} must map to a list of names`});
			continue;
		}
		const exported = rootExports(packageName, repoRoot);
		if (!exported) {
			failures.push({rule: 'export-name', file, message: `${packageName} is not a package of this repository`});
			continue;
		}
		for (const name of names) {
			if (!exported.has(name)) {
				failures.push({rule: 'export-name', file, message: `${packageName} does not export \`${name}\` from its root`});
			}
		}
	}
	return failures;
}

// ---------------------------------------------------------------------------------------------
// Everything, for one skill
// ---------------------------------------------------------------------------------------------

/** Every per-skill check that applies to `skill`. */
export function checkSkill(
	skill: Skill,
	options: {surfaces: CommandSurfaces; fixturesRoot?: string; repoRoot?: string; rockethVersion?: string},
): Failure[] {
	const fixturesRoot = options.fixturesRoot ?? FIXTURES_ROOT;
	const repoRoot = options.repoRoot ?? REPO_ROOT;
	return [
		...checkFrontmatter(skill, options.rockethVersion ?? rockethVersion(repoRoot)),
		...checkLinks(skill, repoRoot),
		...checkFlags(skill, options.surfaces),
		...(skill.user ? checkFixtureMarkers(skill, fixturesRoot) : []),
		...(skill.user ? checkExportNames(skill, fixturesRoot, repoRoot) : []),
	];
}
