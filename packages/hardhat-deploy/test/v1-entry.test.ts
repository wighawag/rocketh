import {describe, it, expect, vi} from 'vitest';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** The repository root, where the Markdown of rocketh.dev lives (`hardhat-deploy/` is a section of the site). */
const repoRoot = join(__dirname, '..', '..', '..');

/**
 * Loads `src/v1-entry.cjs` (the `require` export, what a hardhat v2 project loads by mistake) and
 * returns the message it throws. It throws on load by design, so the module never caches.
 */
function v1EntryMessage(): string {
	// `hardhat --version` may fail where the test runs; the entry logs that and carries on.
	const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		require('../src/v1-entry.cjs');
	} catch (error) {
		return (error as Error).message;
	} finally {
		silence.mockRestore();
	}
	throw new Error('v1-entry.cjs did not throw');
}

describe('hardhat-deploy v1 entry point (hardhat v2 projects)', () => {
	/**
	 * The one link a v1 user sees when they discover v2 is not a drop-in upgrade. It used to point
	 * at `.../migration-from-v1.html`, which the site never served: a folder page is published as
	 * `/x/`, and a forwarding page cannot be written for an address ending in `.html`.
	 */
	it('points at the migration capability map, an address the site serves', () => {
		const message = v1EntryMessage();
		const urls = message.match(/https:\/\/rocketh\.dev\/\S+/g) ?? [];
		expect(urls).toEqual(['https://rocketh.dev/hardhat-deploy/migration/']);

		// Every link printed must be a page of this checkout's site, folder style, never `.html`.
		for (const url of urls) {
			const path = new URL(url).pathname;
			expect(path.endsWith('/')).toBe(true);
			expect(existsSync(join(repoRoot, path, 'index.md'))).toBe(true);
		}
	});

	it('still offers the v1 install command', () => {
		expect(v1EntryMessage()).toContain('npm install hardhat-deploy@1');
	});
});
