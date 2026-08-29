#!/usr/bin/env npx tsx

/**
 * Refuse to let a pre-1.0 package graduate to `1.x` by accident.
 *
 * WHY THIS EXISTS, and why it replaced the previous policy. This repo used to
 * force EVERY pending changeset down to `patch`
 * (`scripts/force-patch-changesets.ts`), on the stated grounds that a 0.x
 * `minor` makes changesets bump any package that PEER-depends on the bumped one
 * straight to `1.0.0`, and that no config option disables that peer rule.
 *
 * That premise no longer holds here, and it was checked rather than assumed:
 * running `changeset version` on this repo with `minor` changesets present
 * bumps `rocketh`, `@rocketh/core`, `@rocketh/node` and `@rocketh/read-execute`
 * to `0.20.0` and leaves every peer-dependent (`@rocketh/doc`,
 * `@rocketh/export`, `@rocketh/verifier`, ...) on a plain `patch`. The reason is
 * that the internal peer ranges are the literal string `workspace:^` (see any
 * package manifest), which changesets never evaluates as a semver
 * range, so the "peer dependent is now out of range, bump it major" rule cannot
 * fire.
 *
 * Forcing everything to `patch` therefore cost real information: a breaking 0.x
 * change shipped as a patch and reached every `^0.19.x` consumer with no signal.
 * So `minor` is expressible again, and the protection it provided is kept as
 * this GUARD instead: if the peer rule (or anything else) ever does push a 0.x
 * package to `1.x`, the release stops loudly instead of publishing a version
 * nobody chose. A version number can be un-chosen before publish and never
 * after.
 *
 * Run this AFTER `changeset version` (see the `changeset:version` script). It
 * compares the working tree against `HEAD`, so it must run before those bumps
 * are committed, which is exactly where the release workflow calls it.
 *
 * A package that is ALREADY >= 1.0.0 (`hardhat-deploy`) is free to move; this
 * only guards the 0.x line.
 *
 * Usage:
 *   npx tsx scripts/check-no-major-graduation.ts
 */

import {execFileSync} from 'node:child_process';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

const PACKAGES_DIR = 'packages';

type Bump = {name: string; from: string; to: string};

function majorOf(version: string): number {
	const major = Number(version.split('.')[0]);
	return Number.isNaN(major) ? -1 : major;
}

/** The version at `HEAD`, i.e. before `changeset version` touched the tree. */
function versionAtHead(path: string): string | undefined {
	try {
		const raw = execFileSync('git', ['show', `HEAD:${path}`], {encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore']});
		return JSON.parse(raw).version;
	} catch {
		// a package that does not exist at HEAD is new, so it cannot have graduated
		return undefined;
	}
}

async function main(): Promise<void> {
	const entries = await readdir(PACKAGES_DIR, {withFileTypes: true});
	const graduated: Bump[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const manifestPath = join(PACKAGES_DIR, entry.name, 'package.json');

		let manifest: {name?: string; version?: string; private?: boolean};
		try {
			manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
		} catch {
			continue;
		}
		if (manifest.private || !manifest.version || !manifest.name) continue;

		const before = versionAtHead(manifestPath);
		if (before === undefined) continue;

		// Only the 0.x line is guarded: a package that already graduated deliberately
		// (hardhat-deploy is 2.x) is on real semver and may bump its major freely.
		if (majorOf(before) === 0 && majorOf(manifest.version) >= 1) {
			graduated.push({name: manifest.name, from: before, to: manifest.version});
		}
	}

	if (graduated.length > 0) {
		console.error('Refusing to graduate a pre-1.0 package to 1.x:\n');
		for (const {name, from, to} of graduated) {
			console.error(`  ${name}: ${from} -> ${to}`);
		}
		console.error(
			[
				'',
				'Nothing here is meant to reach 1.0.0 yet, so this is almost certainly',
				'changesets bumping a peer-dependent rather than a decision anyone made.',
				'',
				'Check the changeset that caused it: a `major` on a 0.x package, or a',
				'`minor` on one whose peer range stopped being `workspace:^` and so became',
				'a real semver range that can go out of range.',
				'',
				'If a 1.0.0 IS intended, remove this check in the same commit that says so.',
			].join('\n'),
		);
		process.exitCode = 1;
		return;
	}

	console.log('check-no-major-graduation: no pre-1.0 package graduated to 1.x');
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
