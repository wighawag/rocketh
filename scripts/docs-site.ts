#!/usr/bin/env npx tsx

/**
 * Build or serve rocketh.dev from THIS checkout: `pnpm docs:dev`, `pnpm docs:build`,
 * `pnpm docs:preview`.
 *
 * The site's code is not in this repository. It is github.com/wighawag/rocketh-website, made
 * from the template-svelte-docs template, and it renders the Markdown of a rocketh checkout:
 * `index.md`, `documentation/`, `hardhat-deploy/` and `public/` here. So the site needs both
 * checkouts, and this script is the glue: it finds the site checkout, installs it if it has
 * never been installed, and runs it with `ROCKETH_DIR` pointing at this repository, so a
 * worktree or a branch previews its own content.
 *
 * Where the site checkout is: `ROCKETH_WEBSITE_DIR` when set, else `../rocketh-website`, a
 * sibling of this repository. The deploy workflow lays the two out the same way, so CI runs
 * exactly this script.
 *
 * The playground (`<rocketh-playground>`) is built from this workspace by `pnpm docs:widgets`
 * before this runs (see package.json), and the site resolves it from here, never from npm.
 */

import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = process.env.ROCKETH_WEBSITE_DIR
	? resolve(process.cwd(), process.env.ROCKETH_WEBSITE_DIR)
	: resolve(root, '..', 'rocketh-website');

const commands = {
	dev: ['web:dev'],
	build: ['build'],
	preview: ['serve'],
} as const;

type Command = keyof typeof commands;

function run(args: readonly string[], env: NodeJS.ProcessEnv = process.env): void {
	const result = spawnSync('pnpm', args, {cwd: site, stdio: 'inherit', env, shell: process.platform === 'win32'});
	if (result.status !== 0) process.exit(result.status ?? 1);
}

/** The commit of rocketh-website the deploy workflow builds, for comparison. */
function pinnedRef(): string | null {
	const workflow = join(root, '.github', 'workflows', 'deploy.yml');
	if (!existsSync(workflow)) return null;
	const match = readFileSync(workflow, 'utf8').match(/ROCKETH_WEBSITE_REF:\s*([0-9a-f]{7,40})/);
	return match ? match[1] : null;
}

function siteHead(): string | null {
	const result = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: site, encoding: 'utf8'});
	return result.status === 0 ? result.stdout.trim() : null;
}

const command = process.argv[2] as Command | undefined;
if (!command || !(command in commands)) {
	console.error(`usage: docs-site.ts <${Object.keys(commands).join('|')}>`);
	process.exit(2);
}

if (!existsSync(join(site, 'web', 'docs.config.js'))) {
	console.error(
		[
			`docs-site: no rocketh-website checkout at ${site}.`,
			'The site is its own repository. Clone it next to this one:',
			'',
			`  git clone https://github.com/wighawag/rocketh-website ${site}`,
			'',
			'or point ROCKETH_WEBSITE_DIR at an existing checkout.',
		].join('\n'),
	);
	process.exit(1);
}

const head = siteHead();
const pinned = pinnedRef();
if (head && pinned && !head.startsWith(pinned) && !pinned.startsWith(head)) {
	console.warn(
		`docs-site: ${site} is at ${head.slice(0, 12)}, the deploy workflow builds ${pinned.slice(0, 12)}. ` +
			'Check out that commit to see exactly what deploys.',
	);
}

if (command !== 'preview' && !existsSync(join(site, 'node_modules'))) {
	run(['install', '--frozen-lockfile']);
}

run(commands[command], {...process.env, ROCKETH_DIR: root});

if (command === 'build') {
	console.log(`docs-site: built ${join(site, 'web', 'build')}`);
}
