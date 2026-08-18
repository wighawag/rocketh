/**
 * Pure helpers for the "the vendored sources ARE what produced these artifacts" tests.
 *
 * Shared by `@rocketh/diamond` and `@rocketh/proxy`, whose provenance tests differ only in
 * which artifacts they load. The assertions stay in each test file, where a failure message
 * belongs; only the extraction lives here.
 *
 * These artifacts were compiled with `metadata.useLiteralContent: true`, so each carries the
 * FULL TEXT of every source it was built from. That is what makes provenance checkable with
 * no compiler, no network and no fixtures: the artifact is self-describing, and the test
 * asserts the repo agrees with it.
 */

import fs from 'node:fs';
import path from 'node:path';

/** The shape these helpers need. Artifacts carry much more. */
export type ProvenanceArtifact = {
	contractName?: string;
	/** solc metadata, as a JSON string. */
	metadata: string;
	/** The whole standard-json input of the compilation unit, as v1 stored it. */
	solcInput: string;
};

/** Every `.sol` under `root`, absolute and sorted. */
export function solidityFilesUnder(root: string): string[] {
	const found: string[] = [];
	const walk = (dir: string) => {
		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name.endsWith('.sol')) found.push(path.resolve(full));
		}
	};
	walk(root);
	return found.sort();
}

/**
 * What an artifact claims about itself: its compiler, and the literal text of each source.
 *
 * Source keys are the paths of the ORIGINAL compilation unit, which each package's
 * `hardhat-deploy-v1/` mirror reproduces exactly, so a key is also the path relative to that
 * mirror. That identity is load-bearing rather than tidy: solc hashes source paths into the
 * metadata blob at the end of the bytecode, so the same bytes compiled under a different
 * path are different bytecode and, under CREATE2, a different address for every user.
 */
export function describeArtifact(artifact: ProvenanceArtifact): {
	name: string;
	compiler: string;
	useLiteralContent: boolean;
	sources: {sourceName: string; content: string}[];
} {
	const metadata = JSON.parse(artifact.metadata);
	return {
		name: artifact.contractName ?? (Object.values(metadata.settings.compilationTarget)[0] as string),
		compiler: metadata.compiler.version,
		useLiteralContent: metadata.settings.metadata?.useLiteralContent === true,
		sources: Object.entries(metadata.sources as Record<string, {content: string}>).map(([sourceName, source]) => ({
			sourceName,
			content: source.content,
		})),
	};
}

/**
 * The DISTINCT compilation units these artifacts came from, as sorted source lists.
 *
 * Taken from `solcInput` rather than `metadata.sources` because metadata lists only what a
 * contract REACHES, while the unit is what was actually compiled, and the unit is what a
 * generator has to reproduce (it feeds `solcInputHash`). A package may legitimately have
 * several: `@rocketh/proxy` compiled its EIP173 proxies separately from the
 * OpenZeppelin-based ones, so those artifacts carry different inputs and different hashes.
 */
export function compiledUnits(artifacts: ProvenanceArtifact[]): string[][] {
	const byInput = new Map<string, string[]>();
	for (const artifact of artifacts) {
		if (!byInput.has(artifact.solcInput)) {
			byInput.set(artifact.solcInput, Object.keys(JSON.parse(artifact.solcInput).sources).sort());
		}
	}
	return [...byInput.values()];
}

/** Every source of every unit, deduplicated: what the mirror must hold, no more and no less. */
export function allCompiledSources(artifacts: ProvenanceArtifact[]): string[] {
	return [...new Set(compiledUnits(artifacts).flat())].sort();
}
