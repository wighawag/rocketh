import {describe, it, expect} from 'vitest';
import {readFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {createIgnoreFilter, parseGitignore, parseIgnoreLine} from '../src/utils/gitignore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Builds the predicate the scaffolder uses, straight from `.gitignore` text. */
const filterFor = (content: string) => createIgnoreFilter(parseGitignore(content));

describe('gitignore matcher', () => {
	describe('regressions from the previous basename/endsWith matcher', () => {
		/**
		 * The bug that mattered most: `'*'.replace('*', '')` produced `''`, and
		 * `fileName.endsWith('')` is true for EVERY string, so a single `*` line skipped the
		 * whole template and scaffolded an empty project with no error. A lone `*` does mean
		 * "ignore everything", but it has to mean it because it was matched, not because the
		 * pattern was accidentally erased.
		 */
		it('treats a lone "*" as a wildcard, not as an erased pattern', () => {
			const isIgnored = filterFor('*');
			expect(isIgnored('anything.ts', false)).toBe(true);

			// The distinction is visible here: an empty pattern must produce NO rule at all.
			expect(parseIgnoreLine('/')).toBeUndefined();
			expect(parseIgnoreLine('!')).toBeUndefined();
			expect(parseIgnoreLine('   ')).toBeUndefined();
			expect(filterFor('/\n!\n\n')('anything.ts', false)).toBe(false);
		});

		/**
		 * The case CodeQL flagged (js/incomplete-sanitization, alert #1): only the first `*`
		 * was stripped, so `*.log.*` became `.log.*` and `endsWith('.log.*')` matched nothing.
		 */
		it('handles a pattern containing more than one wildcard', () => {
			const isIgnored = filterFor('*.log.*');
			expect(isIgnored('server.log.1', false)).toBe(true);
			expect(isIgnored('server.log.gz', false)).toBe(true);
			expect(isIgnored('server.log', false)).toBe(false);
		});

		/** A prefix glob was evaluated as a suffix, so `build*` also swallowed `mybuild`. */
		it('does not treat a prefix glob as a suffix', () => {
			const isIgnored = filterFor('build*');
			expect(isIgnored('build', false)).toBe(true);
			expect(isIgnored('build.tsbuildinfo', false)).toBe(true);
			expect(isIgnored('mybuild', false)).toBe(false);
		});

		/** Only basenames were compared, so an anchored path could never match. */
		it('matches anchored paths and keeps them anchored', () => {
			const isIgnored = filterFor('src/generated');
			expect(isIgnored('src/generated', true)).toBe(true);
			expect(isIgnored('lib/src/generated', true)).toBe(false);
			expect(isIgnored('generated', true)).toBe(false);
		});

		/** `!` lines survived parsing and were applied as positive skips: exactly inverted. */
		it('applies "!" as a re-inclusion, with the last match winning', () => {
			const isIgnored = filterFor('*.local\n!keep.local');
			expect(isIgnored('secrets.local', false)).toBe(true);
			expect(isIgnored('keep.local', false)).toBe(false);
		});
	});

	describe('pattern syntax', () => {
		it('skips blank lines and comments, and honours an escaped "#"', () => {
			expect(parseGitignore('\n# a comment\n\n   # indented comment\n')).toEqual([]);
			expect(filterFor('\\#notacomment')('#notacomment', false)).toBe(true);
		});

		it('anchors a leading "/" to the template root', () => {
			const isIgnored = filterFor('/dist');
			expect(isIgnored('dist', true)).toBe(true);
			expect(isIgnored('packages/dist', true)).toBe(false);
		});

		it('matches an unanchored pattern at any depth', () => {
			const isIgnored = filterFor('node_modules');
			expect(isIgnored('node_modules', true)).toBe(true);
			expect(isIgnored('packages/a/node_modules', true)).toBe(true);
		});

		it('restricts a trailing "/" to directories', () => {
			const isIgnored = filterFor('cache/');
			expect(isIgnored('cache', true)).toBe(true);
			expect(isIgnored('cache', false)).toBe(false);
		});

		it('keeps "*" and "?" inside a single path segment', () => {
			const isIgnored = filterFor('*.ts');
			expect(isIgnored('index.ts', false)).toBe(true);
			// Unanchored, so it still matches at depth, but via the leading-directory rule,
			// not because `*` was allowed to swallow a separator.
			expect(isIgnored('src/index.ts', false)).toBe(true);
			expect(filterFor('/*.ts')('src/index.ts', false)).toBe(false);
			expect(filterFor('file?.txt')('file1.txt', false)).toBe(true);
			expect(filterFor('file?.txt')('file12.txt', false)).toBe(false);
		});

		it('supports character classes, including negation', () => {
			expect(filterFor('file[0-9].txt')('file7.txt', false)).toBe(true);
			expect(filterFor('file[0-9].txt')('filex.txt', false)).toBe(false);
			expect(filterFor('file[!0-9].txt')('filex.txt', false)).toBe(true);
		});

		it('crosses directories for "**" only when it is a whole segment', () => {
			expect(filterFor('a/**/b')('a/b', false)).toBe(true);
			expect(filterFor('a/**/b')('a/x/y/b', false)).toBe(true);
			expect(filterFor('/artifacts/**')('artifacts/build/x.json', false)).toBe(true);
			// Per the spec, other consecutive asterisks are ordinary ones.
			expect(filterFor('/**.log')('a/b.log', false)).toBe(false);
		});

		it('treats regex metacharacters in a pattern as literals', () => {
			const isIgnored = filterFor('v1.2+build(x).txt');
			expect(isIgnored('v1.2+build(x).txt', false)).toBe(true);
			expect(isIgnored('vXX2+buildxx.txt', false)).toBe(false);
		});
	});

	describe('the shipped template', () => {
		/**
		 * The template's own `.gitignore` is the only input this matcher ever sees in
		 * production, so pin its behaviour: build output stays out of a generated project,
		 * and the project's source files stay in.
		 */
		it('ignores exactly the build output of templates/basic/.gitignore', () => {
			const content = readFileSync(join(__dirname, '../templates/basic/.gitignore'), 'utf-8');
			const isIgnored = filterFor(content);

			for (const directory of ['node_modules', 'dist', 'artifacts', 'cache', 'generated']) {
				expect(isIgnored(directory, true), `${directory} should be ignored`).toBe(true);
			}
			expect(isIgnored('.env.local', false)).toBe(true);

			for (const kept of ['package.json', '.gitignore', 'hardhat.config.ts', 'contracts/Greeter.sol']) {
				expect(isIgnored(kept, false), `${kept} should be copied`).toBe(false);
			}
			// Anchored, so a nested directory of the same name is a real source directory.
			expect(isIgnored('contracts/generated', true)).toBe(false);
		});
	});
});
