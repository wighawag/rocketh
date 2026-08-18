/**
 * The bundled Diamond artifacts must correspond to the Solidity in this repo.
 *
 * `@rocketh/diamond` deploys PREBUILT artifacts: the base `Diamond` and the default facets
 * ship as compiled bytecode under `src/hardhat-deploy-v1-artifacts/`, and the package build
 * (`tsc` + `ts-to-json`) never invokes a Solidity compiler. Until the sources were vendored
 * alongside them, nobody could answer "what source produced the bytecode this package puts
 * on chain?" from anything in this repository.
 *
 * TWO CHECKS PIN THE CHAIN, and this is the hermetic half:
 *
 *     hardhat-deploy-v1/**\/*.sol  ==  metadata.sources[*].content  ->  (solc 0.8.10)  ->  bytecode
 *
 * The left link needs no compiler, because these artifacts were built with
 * `metadata.useLiteralContent: true` and therefore embed the full text of every source they
 * were compiled from. The right link is `pnpm verify:artifacts`, which recompiles and
 * compares the generated files, and which CI runs.
 *
 * A failure here means the two halves drifted, and the two causes need opposite fixes: an
 * edited `.sol` means the artifacts are stale (and nothing that was edited is on chain),
 * while a replaced artifact means the sources are.
 */

import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
	allCompiledSources,
	describeArtifact,
	solidityFilesUnder,
	type ProvenanceArtifact,
} from '../../../scripts/artifact-provenance.js';

import artifactDiamond from '../src/hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondCutFacet from '../src/hardhat-deploy-v1-artifacts/DiamondCutFacet.js';
import artifactDiamondLoupeFacet from '../src/hardhat-deploy-v1-artifacts/DiamondLoupeFacet.js';
import artifactDiamondLoupeFacetWithoutSupportsInterface from '../src/hardhat-deploy-v1-artifacts/DiamondLoupeFacetWithoutSupportsInterface.js';
import artifactOwnershipFacet from '../src/hardhat-deploy-v1-artifacts/OwnershipFacet.js';
import artifactDiamondERC165Init from '../src/hardhat-deploy-v1-artifacts/DiamondERC165Init.js';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIRROR_ROOT = path.join(packageRoot, 'hardhat-deploy-v1');

/**
 * Pinned as an assertion rather than read from the metadata: an artifact rebuilt with a
 * different compiler is a decision someone must make deliberately, not something a test
 * should silently accept, because the compiler identity is hashed into the bytecode and the
 * default facets are deployed with CREATE2.
 */
const EXPECTED_COMPILER = '0.8.10+commit.fc410830';

const ARTIFACTS: ProvenanceArtifact[] = [
	artifactDiamond,
	artifactDiamondCutFacet,
	artifactDiamondLoupeFacet,
	artifactDiamondLoupeFacetWithoutSupportsInterface,
	artifactOwnershipFacet,
	artifactDiamondERC165Init,
];

describe('@rocketh/diamond - bundled artifact provenance', () => {
	for (const artifact of ARTIFACTS) {
		const described = describeArtifact(artifact);

		describe(described.name, () => {
			it('was compiled by the pinned solc, with sources embedded literally', () => {
				expect(described.compiler).toBe(EXPECTED_COMPILER);
				// Without literal content the check below could only compare hashes, which tells a
				//  reviewer that something differs but never what.
				expect(described.useLiteralContent).toBe(true);
			});

			it('has every source it was built from vendored in this repo, byte-identical', () => {
				expect(described.sources.length).toBeGreaterThan(0);

				for (const {sourceName, content} of described.sources) {
					const repoPath = path.join(MIRROR_ROOT, sourceName);
					expect(fs.existsSync(repoPath), `missing vendored source for ${sourceName}`).toBe(true);
					expect(
						fs.readFileSync(repoPath, 'utf8'),
						`${sourceName} differs from the copy embedded in ${described.name}'s metadata`,
					).toBe(content);
				}
			});
		});
	}

	it('vendors exactly the compilation unit, no more and no less', () => {
		// A stray `.sol` here would look authoritative while explaining no deployed bytecode at
		//  all, and a missing one would make regeneration impossible. `UsingDiamondOwner.sol` is
		//  the interesting member: part of the unit, imported by nothing deployed here.
		const vendored = solidityFilesUnder(MIRROR_ROOT).map((file) => path.relative(MIRROR_ROOT, file));
		expect(vendored.sort()).toEqual(allCompiledSources(ARTIFACTS));
	});

	it('keeps the public solc_0_8 import surface identical to the frozen mirror', () => {
		// `solc_0_8/` is what CONSUMERS import (`@rocketh/proxy/solc_0_8/...` in the migration
		//  guide), and it overlaps the mirror: LibDiamond and the interfaces appear in both. Drift
		//  would be silent AND serious, since a user would compile their facets against an
		//  interface differing from the one the deployed diamond was built with.
		const consumerSurface = path.join(packageRoot, 'solc_0_8');
		const shared = solidityFilesUnder(consumerSurface);
		expect(shared.length).toBeGreaterThan(0);

		for (const file of shared) {
			const relative = path.relative(consumerSurface, file);
			const mirrored = path.join(MIRROR_ROOT, 'solc_0.8/diamond', relative);
			expect(fs.existsSync(mirrored), `${relative} has no counterpart in the frozen mirror`).toBe(true);
			expect(
				fs.readFileSync(file, 'utf8'),
				`solc_0_8/${relative} has drifted from the copy the shipped artifacts were built from`,
			).toBe(fs.readFileSync(mirrored, 'utf8'));
		}
	});
});
