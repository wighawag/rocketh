/**
 * The packages a playground example depends on, declared by importing them.
 *
 * An example (`examples/playground/<name>/`) never carries a `package.json`: it uses the
 * starting project's packages, plus every package its files import that the starting project
 * does not list. The playground's Download adds those at the version the tab ran; the deploy
 * check, `pnpm test:docs:playground-examples` (`scripts/test-playground-examples.sh`), adds them
 * to the copied starting project's `devDependencies`, at their latest published version, before
 * it installs. An example importing only the starting project's packages leaves its
 * `package.json` untouched.
 *
 * Run directly, it is the deploy check's helper:
 *
 *     tsx scripts/playground-example-packages.ts missing <example dir> <package.json>
 *         prints the packages the example imports that <package.json> lacks, one per line
 *     tsx scripts/playground-example-packages.ts add <package.json> <name>@<range> ...
 *         adds them to its devDependencies
 */
import {builtinModules} from 'node:module';
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';

/** The files whose imports count: the ones the playground runs. Contracts compile with no import callback. */
const SOURCE_FILE = /\.(?:[cm]?ts|[cm]?js)$/;

/** `from '...'`, `import '...'` and `import('...')`, the module specifiers of a TypeScript file. */
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"\n]+)\1/g;

const BUILTINS = new Set(builtinModules);

/** The package a bare specifier names (`@rocketh/diamond/types` is `@rocketh/diamond`), or null when it is not a package. */
function packageOf(specifier: string): string | null {
	if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) return null;
	const parts = specifier.split('/');
	const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
	if (!name || BUILTINS.has(name)) return null;
	return name;
}

/** The packages a source file imports, sorted, each once. */
export function importedPackagesOf(source: string): string[] {
	const names = new Set<string>();
	for (const match of source.matchAll(SPECIFIER)) {
		const name = packageOf(match[2]);
		if (name) names.add(name);
	}
	return [...names].sort();
}

/** The packages the TypeScript and JavaScript files of an example folder import, sorted, each once. */
export function packagesImportedBy(dir: string): string[] {
	const names = new Set<string>();
	const walk = (path: string) => {
		for (const entry of readdirSync(path)) {
			if (entry === 'node_modules' || entry.startsWith('.')) continue;
			const full = join(path, entry);
			if (statSync(full).isDirectory()) walk(full);
			else if (SOURCE_FILE.test(entry))
				for (const name of importedPackagesOf(readFileSync(full, 'utf-8'))) names.add(name);
		}
	};
	if (existsSync(dir)) walk(dir);
	return [...names].sort();
}

type PackageJson = Record<string, unknown> & {devDependencies?: Record<string, string>};

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/** The packages the example in `dir` imports that `packageJson` (its text) lists in none of its dependency fields. */
export function missingPackages(dir: string, packageJson: string): string[] {
	const pkg = JSON.parse(packageJson) as PackageJson;
	const listed = new Set(
		DEPENDENCY_FIELDS.flatMap((field) => Object.keys((pkg[field] as Record<string, string> | undefined) ?? {})),
	);
	return packagesImportedBy(dir).filter((name) => !listed.has(name));
}

/**
 * `packageJson` (its text) with `added` in its `devDependencies`, where the starting project keeps
 * its rocketh packages, keys sorted as pnpm keeps them, and the file's indentation kept.
 */
export function addDevDependencies(packageJson: string, added: Record<string, string>): string {
	const pkg = JSON.parse(packageJson) as PackageJson;
	const merged: Record<string, string> = {...(pkg.devDependencies ?? {}), ...added};
	pkg.devDependencies = Object.fromEntries(
		Object.keys(merged)
			.sort()
			.map((name) => [name, merged[name]]),
	);
	const indent = /^\{\r?\n([ \t]+)"/.exec(packageJson)?.[1] ?? '  ';
	return JSON.stringify(pkg, null, indent) + (packageJson.endsWith('\n') ? '\n' : '');
}

/** Run directly: the deploy check's two steps, `missing` and `add` (see the header). */
if (process.argv[1] && relative(process.argv[1], new URL(import.meta.url).pathname) === '') {
	const [command, ...args] = process.argv.slice(2);
	if (command === 'missing' && args.length === 2) {
		for (const name of missingPackages(args[0], readFileSync(args[1], 'utf-8'))) console.log(name);
	} else if (command === 'add' && args.length >= 2) {
		const added: Record<string, string> = {};
		for (const spec of args.slice(1)) {
			const at = spec.lastIndexOf('@');
			if (at <= 0) {
				console.error(`playground-example-packages: expected <name>@<range>, got "${spec}"`);
				process.exit(1);
			}
			added[spec.slice(0, at)] = spec.slice(at + 1);
		}
		writeFileSync(args[0], addDevDependencies(readFileSync(args[0], 'utf-8'), added));
	} else {
		console.error(
			'usage: playground-example-packages.ts missing <example dir> <package.json> | add <package.json> <name>@<range> ...',
		);
		process.exit(1);
	}
}
