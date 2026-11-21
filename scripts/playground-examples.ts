/**
 * The playground examples' equality check: every sample on rocketh.dev marked as a file of a
 * playground example must equal that file, so the page and the project its "Open in
 * playground" button opens cannot drift apart.
 *
 * A sample is marked in its fence's info string, after the language:
 *
 *     ```typescript playground=greetings-registry/deploy/001_deploy_greetings_registry.ts
 *
 * which names `examples/playground/greetings-registry/deploy/001_deploy_greetings_registry.ts`
 * (see `examples/playground/README.md` for what an example holds). The body must equal the
 * file byte for byte, except that the file may end with the newline a fence drops.
 *
 * `pnpm test` runs this (`scripts/test/playground-examples.test.ts`). Whether each example
 * deploys is the other half, `pnpm test:docs:playground-examples`.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative, sep} from 'node:path';

/** Where the examples live, relative to the repository root. */
export const EXAMPLES_DIR = 'examples/playground';

/** The site's pages: the content rocketh.dev is built from. */
const PAGE_ROOTS = ['index.md', 'documentation', 'hardhat-deploy'];

/** The info-string word that marks a sample. */
const MARKER = 'playground=';

export type MarkedFence = {
	/** The page, relative to the repository root, with `/` separators. */
	page: string;
	/** The 1-based line of the opening fence. */
	line: number;
	/** What follows `playground=`, as written. */
	target: string;
	/** The fence's content, without the newline before the closing fence. */
	body: string;
};

/** Every Markdown page of the site under `root`, relative and sorted. */
export function sitePages(root: string): string[] {
	const pages: string[] = [];
	const walk = (path: string) => {
		const full = join(root, path);
		if (!existsSync(full)) return;
		if (statSync(full).isDirectory()) {
			for (const entry of readdirSync(full)) {
				if (entry === 'node_modules' || entry.startsWith('.')) continue;
				walk(join(path, entry));
			}
		} else if (path.endsWith('.md')) {
			pages.push(path.split(sep).join('/'));
		}
	};
	for (const path of PAGE_ROOTS) walk(path);
	return pages.sort();
}

/**
 * The fenced code blocks of a Markdown text whose info string carries the marker, read the way
 * CommonMark reads fences: backticks or tildes, at least three, indented by at most three
 * spaces; the closing fence uses the same character, at least as many, and nothing after it but
 * spaces; the opening fence's indentation is removed from each line of the body (so a fence in
 * a list item reads as it renders). A fence inside a longer fence is content, not a fence.
 */
export function markedFencesOf(text: string, page: string): MarkedFence[] {
	const lines = text.split('\n');
	const fences: MarkedFence[] = [];
	let i = 0;
	while (i < lines.length) {
		const open = lines[i].match(/^( {0,3})(`{3,}|~{3,})(.*)$/);
		if (!open || (open[2][0] === '`' && open[3].includes('`'))) {
			i++;
			continue;
		}
		const [, indent, fence, info] = open;
		const start = i;
		const body: string[] = [];
		i++;
		while (i < lines.length) {
			const close = lines[i].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
			if (close && close[1][0] === fence[0] && close[1].length >= fence.length) break;
			body.push(stripIndent(lines[i], indent.length));
			i++;
		}
		i++;
		const word = info
			.trim()
			.split(/\s+/)
			.find((w) => w.startsWith(MARKER));
		if (word) {
			fences.push({page, line: start + 1, target: word.slice(MARKER.length), body: body.join('\n')});
		}
	}
	return fences;
}

function stripIndent(line: string, count: number): string {
	let n = 0;
	while (n < count && line[n] === ' ') n++;
	return line.slice(n);
}

/** Every marked fence of the site's pages under `root`. */
export function findMarkedFences(root: string): MarkedFence[] {
	return sitePages(root).flatMap((page) => markedFencesOf(readFileSync(join(root, page), 'utf-8'), page));
}

/**
 * The example file a marker names, relative to the repository root, or null when the marker is
 * not `<example>/<path>` inside that example (empty, absolute, or with a `.` or `..` part).
 */
export function exampleFileOf(target: string): string | null {
	const parts = target.split('/');
	if (parts.length < 2 || parts.some((part) => part === '' || part === '.' || part === '..' || part.includes('\\')))
		return null;
	return `${EXAMPLES_DIR}/${parts.join('/')}`;
}

/** The first 1-based line where `a` and `b` differ. */
function firstDifferingLine(a: string, b: string): number {
	const left = a.split('\n');
	const right = b.split('\n');
	let n = 0;
	while (n < left.length && n < right.length && left[n] === right[n]) n++;
	return n + 1;
}

/**
 * Checks every marked fence under `root`; returns one message per problem, each naming the
 * page and line of the fence and the example file. Empty when every marked fence equals its
 * file.
 */
export function checkPlaygroundMarkers(root: string): string[] {
	const problems: string[] = [];
	for (const fence of findMarkedFences(root)) {
		const where = `${fence.page}:${fence.line}`;
		const file = exampleFileOf(fence.target);
		if (!file) {
			problems.push(
				`${where}: the marker "${MARKER}${fence.target}" must be ${MARKER}<example>/<path>, a file inside ${EXAMPLES_DIR}/<example>/`,
			);
			continue;
		}
		const full = join(root, file);
		if (!existsSync(full) || !statSync(full).isFile()) {
			problems.push(
				`${where}: the fence is marked ${MARKER}${fence.target}, but there is no such example file: ${file}`,
			);
			continue;
		}
		const content = readFileSync(full, 'utf-8');
		if (content !== fence.body && content !== fence.body + '\n') {
			const line = firstDifferingLine(fence.body, content.endsWith('\n') ? content.slice(0, -1) : content);
			problems.push(
				`${where}: the fence marked ${MARKER}${fence.target} differs from ${file} (first at line ${line} of the file); make the two equal`,
			);
		}
	}
	return problems;
}

/** Run directly (`tsx scripts/playground-examples.ts`): prints the problems, fails on any. */
if (process.argv[1] && relative(process.argv[1], new URL(import.meta.url).pathname) === '') {
	const problems = checkPlaygroundMarkers(join(new URL('.', import.meta.url).pathname, '..'));
	for (const problem of problems) console.error(problem);
	process.exit(problems.length > 0 ? 1 : 0);
}
