#!/usr/bin/env npx tsx

/**
 * Force every pending changeset to a `patch` bump.
 *
 * WHY: while this monorepo is pre-1.0, we do not want a `minor`/`major`
 * changeset. Under SemVer, a 0.x `minor` is allowed to be breaking, and
 * changesets encodes that by force-bumping any package that (peer-)depends on a
 * bumped internal package to a *major*. With our internal `peerDependencies`
 * (kept intentionally, so every package resolves the same instance), a single
 * `minor` on `@rocketh/core`/`@rocketh/node` cascades the peer-dependents
 * (`@rocketh/doc`, `@rocketh/export`, `@rocketh/verifier`) straight to `1.0.0`.
 * No changesets config option disables that peer rule.
 *
 * The reliable, non-fragile fix is to constrain the INPUT: rewrite each pending
 * changeset so its bump lines are `patch`. Then `changeset version` runs
 * normally and every package stays in `0.x` (peer-dependents follow as patch).
 * This only edits human-authored intent files; it never touches versions,
 * dependency ranges, or changelogs (changesets still owns all of that).
 *
 * Run this BEFORE `changeset version` (see the `version:` step of the release
 * workflow). Remove it (and start using real `minor`/`major`) once the packages
 * graduate to `1.0.0`.
 *
 * Usage:
 *   npx tsx scripts/force-patch-changesets.ts        # rewrite in place
 *   npx tsx scripts/force-patch-changesets.ts --check # fail if any need rewriting (no write)
 */

import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const CHANGESET_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.changeset');

// A frontmatter bump line looks like:  '@rocketh/core': minor
// Capture the leading `<key>:` and the bump word so we can rewrite only the word.
const BUMP_LINE = /^(\s*(?:'[^']*'|"[^"]*"|[^:\s]+)\s*:\s*)(major|minor|patch)(\s*)$/;

/**
 * Rewrite the frontmatter of a single changeset so every bump becomes `patch`.
 * Returns the new content, or null if nothing changed.
 *
 * Pure string surgery scoped to the first `---`-delimited block, so the summary
 * body (which may itself contain `---` rules or the words minor/major) is left
 * untouched.
 */
export function forcePatch(content: string): string | null {
	const lines = content.split('\n');

	// The frontmatter is the block between the first two `---` fences.
	if (lines[0]?.trim() !== '---') {
		return null; // not a changeset with frontmatter; leave alone
	}
	let end = -1;
	for (let i = 1; i < lines.length; i++) {
		if (lines[i].trim() === '---') {
			end = i;
			break;
		}
	}
	if (end === -1) {
		return null; // malformed; do not touch
	}

	let changed = false;
	for (let i = 1; i < end; i++) {
		const m = lines[i].match(BUMP_LINE);
		if (m && m[2] !== 'patch') {
			lines[i] = `${m[1]}patch${m[3]}`;
			changed = true;
		}
	}

	return changed ? lines.join('\n') : null;
}

async function main() {
	const check = process.argv.includes('--check');

	let entries: string[];
	try {
		entries = await readdir(CHANGESET_DIR);
	} catch {
		console.log('force-patch-changesets: no .changeset directory, nothing to do');
		return;
	}

	const files = entries.filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

	const rewritten: string[] = [];
	for (const file of files) {
		const path = join(CHANGESET_DIR, file);
		const content = await readFile(path, 'utf8');
		const next = forcePatch(content);
		if (next !== null) {
			rewritten.push(file);
			if (!check) {
				await writeFile(path, next);
			}
		}
	}

	if (rewritten.length === 0) {
		console.log('force-patch-changesets: all changesets already patch-only');
		return;
	}

	if (check) {
		console.error(
			`force-patch-changesets: these changesets are not patch-only:\n  - ${rewritten.join('\n  - ')}\n` +
				`Run "pnpm changeset:force-patch" (or keep them patch while pre-1.0).`,
		);
		process.exit(1);
	}

	console.log(`force-patch-changesets: rewrote to patch:\n  - ${rewritten.join('\n  - ')}`);
}

// Only run when executed directly (e.g. `tsx scripts/force-patch-changesets.ts`),
// not when imported by a test that just wants `forcePatch`.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
