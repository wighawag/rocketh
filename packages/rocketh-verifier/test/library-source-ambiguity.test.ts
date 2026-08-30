/**
 * Tests for @rocketh/verifier - making an AMBIGUOUS library-name resolution visible.
 *
 * Etherscan keys `settings.libraries` by the source file that DEFINES each
 * library, so the verifier has to resolve that path. The authoritative route is
 * the compiler `linkReferences` map (the path IS the key). When a deployment
 * carries no usable `linkReferences`, the verifier falls back to SCANNING the
 * compilation metadata `sources`: the AST first, then a `library <Name>` match
 * over the raw source text.
 *
 * That fallback takes the FIRST hit. Two sources in one compilation can declare
 * the same library name (vendored/forked dependency trees, test fixtures), and
 * the text scan can additionally match a mention inside a comment or a string
 * literal. Taking the first hit is fine; taking it SILENTLY is not, because a
 * wrong pick surfaces much later as an opaque verification failure.
 *
 * These tests pin the warning and, just as importantly, pin the SILENCE of the
 * unambiguous paths: a warning on every verification is a warning nobody reads.
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {findLibrarySourcePath, findLibrarySourcePathFromLinkReferences} from '../src/library-source.js';

const MATH_LIBRARY_SOURCE =
	'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nlibrary Math { function add(uint a, uint b) internal pure returns (uint) { return a + b; } }\n';

function astWithLibrary(name: string) {
	return {
		nodes: [{nodeType: 'PragmaDirective'}, {nodeType: 'ContractDefinition', contractKind: 'library', name}],
	};
}

describe('@rocketh/verifier - ambiguous library-name resolution', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		warnSpy.mockRestore();
	});

	function warnings(): string[] {
		return warnSpy.mock.calls.map((args: unknown[]) => args.map(String).join(' '));
	}

	describe('quiet paths', () => {
		it('says nothing when the AST scan finds exactly one declaring source', () => {
			const sources = {
				'src/lib/Math.sol': {content: MATH_LIBRARY_SOURCE, ast: astWithLibrary('Math')},
				'src/Greeter.sol': {content: 'contract Greeter { }', ast: astWithLibrary('Other')},
			};
			expect(findLibrarySourcePath('Math', sources)).toBe('src/lib/Math.sol');
			expect(warnings()).toEqual([]);
		});

		it('says nothing when the text scan finds exactly one declaring source', () => {
			const sources = {
				'contracts/Math.sol': {content: MATH_LIBRARY_SOURCE},
				'contracts/Greeter.sol': {content: 'import "./Math.sol";\ncontract Greeter { }'},
			};
			expect(findLibrarySourcePath('Math', sources)).toBe('contracts/Math.sol');
			expect(warnings()).toEqual([]);
		});

		it('says nothing when no source declares the library at all', () => {
			expect(
				findLibrarySourcePath('Math', {'contracts/Greeter.sol': {content: 'contract Greeter {}'}}),
			).toBeUndefined();
			expect(warnings()).toEqual([]);
		});

		it('says nothing when the path is resolved from linkReferences, even if the sources are ambiguous', () => {
			/**
			 * `linkReferences` is authoritative: the defining source path is the map
			 * KEY, so no candidate is ever chosen and there is nothing to warn about.
			 * The verifier prefers it over the scan (see the etherscan payload tests),
			 * so a compilation whose `sources` happen to be ambiguous stays silent as
			 * long as the deployment carries linkReferences.
			 */
			const linkReferences = {
				'contracts/Util.sol': {Util: [{start: 10, length: 20}]},
				'contracts/Math.sol': {Math: [{start: 30, length: 20}]},
			};
			expect(findLibrarySourcePathFromLinkReferences('Math', linkReferences)).toBe('contracts/Math.sol');
			expect(warnings()).toEqual([]);
		});
	});

	describe('AST-pass ambiguity', () => {
		it('warns naming the library, every candidate and the chosen one, and still returns the first hit', () => {
			/**
			 * Two REAL libraries called `Math` in one compilation: a vendored copy
			 * alongside the project's own. Both are genuine declarations, so the fix
			 * is on the user's side (dedupe, or carry linkReferences).
			 */
			const sources = {
				'contracts/Math.sol': {content: MATH_LIBRARY_SOURCE, ast: astWithLibrary('Math')},
				'lib/vendor/Math.sol': {content: MATH_LIBRARY_SOURCE, ast: astWithLibrary('Math')},
			};

			// Unchanged behaviour: the first hit is still what gets returned.
			expect(findLibrarySourcePath('Math', sources)).toBe('contracts/Math.sol');

			expect(warnSpy).toHaveBeenCalledTimes(1);
			const message = warnings()[0];
			expect(message).toContain('Math');
			expect(message).toContain('contracts/Math.sol');
			expect(message).toContain('lib/vendor/Math.sol');
			// It must say WHICH one was picked, not merely list the candidates.
			expect(message).toMatch(/chose|chosen|using/i);
			// ...and that this came from the AST scan (a real duplicate declaration).
			expect(message).toMatch(/AST/i);
			expect(message).not.toMatch(/comment/i);
		});

		it('does not consult the text scan once the AST scan has found candidates', () => {
			/**
			 * The AST pass wins outright today, and this task must not change which
			 * source is chosen. A source that only MENTIONS `library Math` in text
			 * must therefore not become a candidate (nor trigger a warning) when the
			 * AST already answered.
			 */
			const sources = {
				'src/Math.sol': {content: MATH_LIBRARY_SOURCE, ast: astWithLibrary('Math')},
				'src/Notes.sol': {content: '// library Math lives in Math.sol\ncontract Notes { }'},
			};
			expect(findLibrarySourcePath('Math', sources)).toBe('src/Math.sol');
			expect(warnings()).toEqual([]);
		});
	});

	describe('text-pass ambiguity', () => {
		it('warns and says the candidates came from the raw-source text scan', () => {
			/**
			 * No AST on these sources, so resolution falls through to the regex over
			 * `content` — which happily matches `library Math` inside a COMMENT. The
			 * user's fix here is different from two real declarations, so the warning
			 * has to distinguish the two.
			 */
			const sources = {
				'contracts/Math.sol': {content: MATH_LIBRARY_SOURCE},
				'contracts/Notes.sol': {
					content: '// SPDX-License-Identifier: MIT\n// see library Math for the checked helpers\ncontract Notes { }\n',
				},
			};

			expect(findLibrarySourcePath('Math', sources)).toBe('contracts/Math.sol');

			expect(warnSpy).toHaveBeenCalledTimes(1);
			const message = warnings()[0];
			expect(message).toContain('Math');
			expect(message).toContain('contracts/Math.sol');
			expect(message).toContain('contracts/Notes.sol');
			expect(message).toMatch(/chose|chosen|using/i);
			// The distinguishing bit: a text-scan hit may not be a declaration at all.
			expect(message).toMatch(/text|content/i);
			expect(message).toMatch(/comment/i);
			expect(message).not.toMatch(/AST/i);
		});

		it('lists every candidate when more than two sources match', () => {
			const sources = {
				'a/Math.sol': {content: MATH_LIBRARY_SOURCE},
				'b/Math.sol': {content: MATH_LIBRARY_SOURCE},
				'c/Math.sol': {content: MATH_LIBRARY_SOURCE},
			};
			expect(findLibrarySourcePath('Math', sources)).toBe('a/Math.sol');
			const message = warnings()[0];
			for (const path of ['a/Math.sol', 'b/Math.sol', 'c/Math.sol']) {
				expect(message).toContain(path);
			}
		});
	});
});
