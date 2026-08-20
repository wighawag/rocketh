#!/usr/bin/env npx tsx

/**
 * Point the `hardhat-deploy init` template at the versions of this release.
 *
 * WHY: `packages/hardhat-deploy/templates/basic/package.json` is what a user
 * gets from `npx hardhat-deploy init`, and it lists the rocketh packages with
 * hardcoded ranges (`"rocketh": "^0.19.4"`). Nothing kept those in step with the
 * packages actually being published, so they drifted many patch releases behind.
 *
 * Inside one 0.x minor the drift is invisible, because `^0.19.4` already resolves
 * to the newest `0.19.x` on the registry. It stops being invisible at the next
 * MINOR: once `0.20.0` (or `1.0.0`) ships, `^0.19.4` refuses it, and every newly
 * scaffolded project silently starts on the previous line. That is the failure
 * this script exists to prevent, and it is exactly the kind nobody notices,
 * because `init` keeps working and just produces a stale project.
 *
 * The template is NOT a workspace member (`pnpm-workspace.yaml` covers
 * `packages/*`, and the template is a level deeper), so pnpm and changesets do
 * not maintain it. Hence an explicit sync step.
 *
 * Ranges are written as `^<version>` from the workspace, NOT as `latest` or `*`.
 * The user's scaffolded `package.json` has to stay reproducible: a floating
 * specifier would be baked into their project forever and re-resolve differently
 * on every install. `^` of the just-released version means the user gets the
 * newest compatible package at scaffold time and a lockfile pins it thereafter.
 * Reading the workspace also means no network call during `init`, and the set is
 * one that was released and tested together.
 *
 * `"hardhat-deploy": "workspace:*"` in the template is deliberately left alone:
 * the `init` CLI substitutes that exact sentinel string for its own version when
 * it copies the template (see `generateProject` in `packages/hardhat-deploy/src/cli.ts`).
 *
 * Run this AFTER `changeset version` has bumped the workspace (see the
 * `changeset:version` script), so the template names the versions about to be
 * published rather than the previous ones.
 *
 * Usage:
 *   npx tsx scripts/sync-template-versions.ts         # rewrite in place
 *   npx tsx scripts/sync-template-versions.ts --check # fail if out of date (no write)
 */

import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');
const TEMPLATE_PKG = join(PACKAGES_DIR, 'hardhat-deploy', 'templates', 'basic', 'package.json');

/** The sentinel the `init` CLI rewrites to the hardhat-deploy version. Never touch it. */
const CLI_SENTINEL = 'workspace:*';

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies'] as const;

type PackageJson = {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

/**
 * Rewrite the template's ranges from `versions`, returning the new object and the
 * list of changes made.
 *
 * Deliberately only ever UPDATES a key the template already has: it never adds a
 * dependency. Which packages a scaffolded project should depend on is a curation
 * decision belonging to whoever edits the template, not something to be inferred
 * from whatever happens to exist in `packages/`.
 */
export function syncTemplateVersions(
	template: PackageJson,
	versions: Map<string, string>,
): {result: PackageJson; changes: string[]} {
	const result: PackageJson = {...template};
	const changes: string[] = [];

	for (const field of DEPENDENCY_FIELDS) {
		const deps = template[field];
		if (!deps) continue;

		const nextDeps: Record<string, string> = {...deps};
		for (const [name, current] of Object.entries(deps)) {
			if (current === CLI_SENTINEL) continue; // the init CLI owns this one
			const version = versions.get(name);
			if (!version) continue; // not a workspace package; an external dep we do not manage

			const wanted = `^${version}`;
			if (current !== wanted) {
				nextDeps[name] = wanted;
				changes.push(`${field}.${name}: ${current} -> ${wanted}`);
			}
		}
		result[field] = nextDeps;
	}

	return {result, changes};
}

async function readWorkspaceVersions(): Promise<Map<string, string>> {
	const versions = new Map<string, string>();
	const entries = await readdir(PACKAGES_DIR, {withFileTypes: true});

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		let pkg: PackageJson;
		try {
			pkg = JSON.parse(await readFile(join(PACKAGES_DIR, entry.name, 'package.json'), 'utf8'));
		} catch {
			continue; // no package.json in that directory
		}
		if (pkg.name && pkg.version) {
			versions.set(pkg.name, pkg.version);
		}
	}

	return versions;
}

async function main() {
	const check = process.argv.includes('--check');

	const versions = await readWorkspaceVersions();
	const raw = await readFile(TEMPLATE_PKG, 'utf8');
	const template: PackageJson = JSON.parse(raw);

	const {result, changes} = syncTemplateVersions(template, versions);

	if (changes.length === 0) {
		console.log('sync-template-versions: template already matches the workspace');
		return;
	}

	if (check) {
		console.error(
			`sync-template-versions: template is out of date:\n  - ${changes.join('\n  - ')}\n` + `Run "pnpm sync:template".`,
		);
		process.exit(1);
	}

	// The template is not covered by prettier (`format:check` only matches
	//  `packages/*/{src,test}/**/*.ts`), so preserve its existing 2-space JSON shape
	//  rather than reformatting it.
	await writeFile(TEMPLATE_PKG, `${JSON.stringify(result, null, 2)}\n`);
	console.log(`sync-template-versions: updated:\n  - ${changes.join('\n  - ')}`);
}

// Only run when executed directly, not when imported by a test.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
