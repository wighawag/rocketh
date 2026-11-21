import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkPlaygroundMarkers, findMarkedFences} from '../playground-examples.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * A sample on rocketh.dev that stands for a file of a playground example is marked in its
 * fence's info string, after the language:
 *
 *     ```typescript playground=<example>/<path in the example>
 *
 * Its body must equal `examples/playground/<example>/<path>` byte for byte (the file may end
 * with the newline the fence drops), so the page and the example the "Open in playground"
 * button opens cannot drift apart. These tests run the check on small fixture repositories,
 * then on this repository's own pages.
 */
describe('playground examples: every marked fence equals its example file', () => {
	let root: string;

	function write(path: string, content: string) {
		const target = join(root, path);
		mkdirSync(dirname(target), {recursive: true});
		writeFileSync(target, content);
	}

	const script =
		"import {deployScript} from '../rocketh/deploy.js';\n\nexport default deployScript(async () => {}, {});\n";

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'playground-examples-'));
		write('examples/playground/sample/deploy/01_sample.ts', script);
	});
	afterEach(() => {
		rmSync(root, {recursive: true, force: true});
	});

	it('passes when the marked fence equals its example file', () => {
		write(
			'documentation/page/index.md',
			'# A page\n\n```typescript playground=sample/deploy/01_sample.ts\n' + script + '```\n',
		);
		expect(checkPlaygroundMarkers(root)).toEqual([]);
	});

	it('fails when the marked fence and its file differ, naming the page, the line and the file', () => {
		write(
			'documentation/page/index.md',
			'# A page\n\nSome text.\n\n```typescript playground=sample/deploy/01_sample.ts\n' +
				script.replace('{}, {}', '{}, {tags: []}') +
				'```\n',
		);
		const problems = checkPlaygroundMarkers(root);
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain('documentation/page/index.md:5');
		expect(problems[0]).toContain('examples/playground/sample/deploy/01_sample.ts');
		expect(problems[0]).toContain('differs');
	});

	it('fails when the marker names a missing file', () => {
		write('hardhat-deploy/page.md', 'Text.\n\n```ts playground=sample/deploy/02_missing.ts\n' + script + '```\n');
		const problems = checkPlaygroundMarkers(root);
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain('hardhat-deploy/page.md:3');
		expect(problems[0]).toContain('examples/playground/sample/deploy/02_missing.ts');
		expect(problems[0]).toContain('no such example file');
	});

	it('fails when the marker names a missing example', () => {
		write('index.md', '```ts playground=nope/deploy/01_sample.ts\n' + script + '```\n');
		const problems = checkPlaygroundMarkers(root);
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain('index.md:1');
		expect(problems[0]).toContain('examples/playground/nope/deploy/01_sample.ts');
	});

	it('refuses a marker that leaves its example folder', () => {
		write('index.md', '```ts playground=sample/../../../package.json\n{}\n```\n');
		const problems = checkPlaygroundMarkers(root);
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain('index.md:1');
		expect(problems[0]).toContain('<example>/<path>');
	});

	it('does not allow more than the one trailing newline the fence drops', () => {
		write('examples/playground/sample/deploy/03_blank.ts', script + '\n');
		write('documentation/page.md', '```ts playground=sample/deploy/03_blank.ts\n' + script + '```\n');
		expect(checkPlaygroundMarkers(root)).toHaveLength(1);
	});

	it('reads fences the way Markdown does: a longer fence, a tilde fence, an indented one', () => {
		write(
			'documentation/page.md',
			[
				'````markdown',
				'```ts playground=sample/deploy/not-a-fence.ts',
				'```',
				'````',
				'',
				'~~~ts playground=sample/deploy/01_sample.ts',
				script + '~~~',
				'',
				'1. In a list:',
				'',
				'   ```ts playground=sample/deploy/01_sample.ts',
				...script
					.split('\n')
					.slice(0, -1)
					.map((line) => (line ? '   ' + line : line)),
				'   ```',
				'',
			].join('\n'),
		);
		const fences = findMarkedFences(root);
		expect(fences.map((f) => f.line)).toEqual([6, 14]);
		expect(checkPlaygroundMarkers(root)).toEqual([]);
	});

	it('only reads the pages of the site', () => {
		write('README.md', '```ts playground=sample/deploy/missing.ts\n```\n');
		write('work/notes/note.md', '```ts playground=sample/deploy/missing.ts\n```\n');
		expect(checkPlaygroundMarkers(root)).toEqual([]);
	});
});

describe("this repository's marked samples", () => {
	it('has at least one marked sample, and every one equals its example file', () => {
		expect(findMarkedFences(repo).length).toBeGreaterThan(0);
		expect(checkPlaygroundMarkers(repo)).toEqual([]);
	});
});
