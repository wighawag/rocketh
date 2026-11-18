import {describe, it, expect} from 'vitest';
import {readFileSync, readdirSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = join(__dirname, '../../..');
const page = readFileSync(join(repo, 'documentation/reference/errors/index.md'), 'utf-8');

/**
 * The source of every package, with the string concatenations of a message joined back
 * together (`'...' +\n '...'` reads as one string), so a fragment that the code builds from
 * several literals is still found. The vendored v1 artifacts are skipped: they are large
 * generated files with no message in them.
 */
function packageSources(): string {
	const parts: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, {withFileTypes: true})) {
			if (entry.name === 'node_modules' || entry.name === 'hardhat-deploy-v1-artifacts') continue;
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (/\.(ts|cjs)$/.test(entry.name)) parts.push(readFileSync(path, 'utf-8'));
		}
	};
	const packages = join(repo, 'packages');
	for (const pkg of readdirSync(packages, {withFileTypes: true})) {
		if (!pkg.isDirectory()) continue;
		try {
			walk(join(packages, pkg.name, 'src'));
		} catch {
			// a package without src
		}
	}
	return parts
		.join('\n')
		.replace(/[`'"]\s*\+\s*[`'"]/g, '')
		.replace(/\\`/g, '`');
}

/**
 * The fixed text of each message the page quotes: the part that does not depend on the run
 * (names, addresses, chain ids are examples on the page). Each must be on the page AND in the
 * code, so a message reworded in the code fails here until the page follows.
 */
const fragments = [
	'cannot resolve the named account "',
	', but the node lists no accounts.',
	'Unknown signer for account ',
	'  Execute the following transaction out-of-band, then re-run:',
	'Cannot ask for confirmation: stdin is not a terminal, so there is nobody to answer.',
	'The node reports chainId ',
	'. Refusing to continue: every transaction would be signed for chain ',
	'Loading deployment from environment ',
	' (with chainId: ',
	') for a different chainId (',
	' was recorded with genesisHash ',
	", but the current chain's genesisHash is ",
	"A '.chain' or '.chainId' file is expected to be present in the deployment folder for network ",
	'Refusing to reset on a fork run: this would delete the deployment records of ',
	', the network being simulated, and a fork run never writes them back.',
	' to ask which chain the fork of "',
	' did not succeed: its receipt reports status ',
	'rocketh requires a successful status before it records anything, so nothing was saved.',
	'could not be evaluated, so nothing was executed: ',
	'returned true, which asks rocketh to record it as done and never run it again, but it has no id to record it under.',
	' mixes the flat form ({methodName, args}) with the explicit {init, onUpgrade} form.',
	'" is a class, which cannot be called with the environment.',
	'" threw while the environment was being set up',
	' takes a FUNCTION, not a promise.',
	'Hardhat deploy connection not found in the environment.',
	'no deployments to export for environment ',
	'  no such deployment folder: ',
];

describe('documentation/reference/errors, the common errors page', () => {
	const sources = packageSources();

	it.each(fragments)('quotes %j as the code prints it', (fragment) => {
		expect(page).toContain(fragment);
		expect(sources).toContain(fragment);
	});

	/** No message block on the page escapes the check above. */
	it('checks every message block on the page', () => {
		const blocks = [...page.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]);
		expect(blocks.length).toBeGreaterThan(0);
		for (const block of blocks) {
			expect(
				fragments.some((fragment) => block.includes(fragment)),
				block,
			).toBe(true);
		}
	});
});
