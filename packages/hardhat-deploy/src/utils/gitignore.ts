/**
 * A small, self-contained gitignore matcher used by the `hardhat-deploy init` scaffolder to
 * decide which template files to copy into a freshly generated project.
 *
 * This replaces an earlier hand-rolled check of the shape
 * `fileName === pattern || fileName.endsWith(pattern.replace('*', ''))`, which only ever
 * compared BASENAMES and stripped the FIRST `*`. That silently mishandled a lone `*`
 * (`endsWith('')` is true for every string, so the whole template was skipped), prefix globs
 * like `build*` (matched as a suffix, so `mybuild` was skipped too), patterns with two
 * wildcards like `*.log.*` (left a stray `*` and matched nothing), anchored paths like
 * `src/generated`, and `!` negations (kept as positive skips, inverting their meaning).
 *
 * Supported subset of the gitignore spec: comments, blank lines, `!` negation with
 * last-match-wins, trailing `/` for directory-only rules, leading `/` and mid-pattern `/`
 * for anchoring, `*`, `?`, `[...]` character classes, `**` for cross-directory matching, and
 * `\` escapes.
 *
 * Deviations, all deliberate:
 * - Leading whitespace on a line is trimmed. Git treats it as part of the filename; in a
 *   template `.gitignore` it is always an indentation typo.
 * - A file underneath an ignored directory cannot be re-included by a later negation. Git
 *   has the same restriction, and the caller reinforces it by not descending into ignored
 *   directories at all.
 */

export type IgnoreRule = {
	/** The pattern as written, kept for debugging and error messages. */
	source: string;
	/** `true` for a `!`-prefixed rule, which re-includes a previously ignored path. */
	negated: boolean;
	/** `true` for a rule ending in `/`, which matches directories only. */
	directoryOnly: boolean;
	/** Matches a `/`-separated path relative to the directory holding the `.gitignore`. */
	regex: RegExp;
};

export type IgnoreFilter = (relativePath: string, isDirectory: boolean) => boolean;

const REGEXP_METACHARACTERS = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (text: string): string => text.replace(REGEXP_METACHARACTERS, '\\$&');

/**
 * Finds the closing `]` of a character class opened at `start`, or -1 when there is none.
 * A `!` or `^` right after the `[`, and a `]` as the first class member, are literal.
 */
const findCharacterClassEnd = (glob: string, start: number): number => {
	let index = start + 1;
	if (glob[index] === '!' || glob[index] === '^') {
		index++;
	}
	if (glob[index] === ']') {
		index++;
	}
	while (index < glob.length) {
		if (glob[index] === '\\') {
			index += 2;
			continue;
		}
		if (glob[index] === ']') {
			return index;
		}
		index++;
	}
	return -1;
};

/**
 * Translates a gitignore glob into a regular expression body.
 *
 * `*` and `?` deliberately stop at `/`, so they stay within one path segment. Only a `**`
 * that occupies a whole segment crosses directories; per the gitignore spec, consecutive
 * asterisks anywhere else are plain asterisks.
 */
const globToRegExpSource = (glob: string): string => {
	let out = '';
	let index = 0;

	while (index < glob.length) {
		const character = glob[index];

		if (character === '\\') {
			const escaped = glob[index + 1];
			if (escaped === undefined) {
				out += '\\\\';
				index++;
			} else {
				out += escapeRegExp(escaped);
				index += 2;
			}
			continue;
		}

		if (character === '*') {
			const atSegmentStart = index === 0 || glob[index - 1] === '/';
			let stars = 0;
			while (glob[index] === '*') {
				stars++;
				index++;
			}
			const atSegmentEnd = index >= glob.length || glob[index] === '/';

			if (stars >= 2 && atSegmentStart && atSegmentEnd) {
				if (glob[index] === '/') {
					// `**/` matches zero or more leading directories.
					out += '(?:.*/)?';
					index++;
				} else {
					// A trailing `**` matches everything below this point.
					out += '.*';
				}
			} else {
				out += '[^/]*';
			}
			continue;
		}

		if (character === '?') {
			out += '[^/]';
			index++;
			continue;
		}

		if (character === '[') {
			const end = findCharacterClassEnd(glob, index);
			if (end === -1) {
				out += '\\[';
				index++;
				continue;
			}
			let characterClass = glob.slice(index, end + 1);
			if (characterClass[1] === '!') {
				characterClass = `[^${characterClass.slice(2)}`;
			}
			out += characterClass;
			index = end + 1;
			continue;
		}

		out += escapeRegExp(character);
		index++;
	}

	return out;
};

/**
 * Parses a single `.gitignore` line. Returns `undefined` for blank lines, comments, and
 * lines that carry no pattern at all (a bare `/`, `!`, or `!/`), which must never be turned
 * into a rule: an empty pattern is exactly what made the previous implementation match every
 * file.
 */
export function parseIgnoreLine(line: string): IgnoreRule | undefined {
	let pattern = line.replace(/^[ \t]+/, '');

	// Trailing whitespace is insignificant unless escaped with a backslash.
	let end = pattern.length;
	while (end > 0 && (pattern[end - 1] === ' ' || pattern[end - 1] === '\t')) {
		let backslashes = 0;
		let scan = end - 2;
		while (scan >= 0 && pattern[scan] === '\\') {
			backslashes++;
			scan--;
		}
		if (backslashes % 2 === 1) {
			break;
		}
		end--;
	}
	pattern = pattern.slice(0, end);

	if (pattern === '' || pattern.startsWith('#')) {
		return undefined;
	}

	const source = pattern;

	let negated = false;
	if (pattern.startsWith('!')) {
		negated = true;
		pattern = pattern.slice(1);
	} else if (pattern.startsWith('\\!') || pattern.startsWith('\\#')) {
		pattern = pattern.slice(1);
	}

	let directoryOnly = false;
	if (pattern.endsWith('/') && !pattern.endsWith('\\/')) {
		directoryOnly = true;
		pattern = pattern.slice(0, -1);
	}

	const anchored = pattern.startsWith('/') || pattern.slice(1).includes('/');
	if (pattern.startsWith('/')) {
		pattern = pattern.slice(1);
	}

	if (pattern === '') {
		return undefined;
	}

	const body = globToRegExpSource(pattern);
	// An unanchored pattern matches at any depth, so allow any leading directories.
	const regex = new RegExp(anchored ? `^${body}$` : `^(?:.*/)?${body}$`);

	return {source, negated, directoryOnly, regex};
}

/** Parses the CONTENT of a `.gitignore` file. Reading it from disk is the caller's job. */
export function parseGitignore(content: string): IgnoreRule[] {
	const rules: IgnoreRule[] = [];
	for (const line of content.split('\n')) {
		const rule = parseIgnoreLine(line.replace(/\r$/, ''));
		if (rule) {
			rules.push(rule);
		}
	}
	return rules;
}

/**
 * Builds a predicate over paths relative to the directory holding the `.gitignore`.
 * Later rules win over earlier ones, which is what makes `!` negation work.
 */
export function createIgnoreFilter(rules: IgnoreRule[]): IgnoreFilter {
	return (relativePath: string, isDirectory: boolean): boolean => {
		const normalized = relativePath.split('\\').join('/').replace(/^\/+/, '').replace(/\/+$/, '');
		if (normalized === '') {
			return false;
		}

		let ignored = false;
		for (const rule of rules) {
			if (rule.directoryOnly && !isDirectory) {
				continue;
			}
			if (rule.regex.test(normalized)) {
				ignored = !rule.negated;
			}
		}
		return ignored;
	};
}
