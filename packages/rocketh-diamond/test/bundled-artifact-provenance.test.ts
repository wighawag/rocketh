/**
 * The bundled Diamond artifacts must correspond to the Solidity in this repo.
 *
 * `@rocketh/diamond` deploys PREBUILT artifacts: the base `Diamond` and the default
 * facets are shipped as compiled bytecode under `src/hardhat-deploy-v1-artifacts/`, and
 * the package build (`tsc` + `ts-to-json`) never invokes a Solidity compiler. Until the
 * sources were vendored alongside them, nobody could answer "what source produced the
 * bytecode this package puts on chain?" from anything in this repository.
 *
 * WHAT MAKES THIS CHECKABLE WITHOUT A COMPILER: these artifacts were compiled with
 * `metadata.useLiteralContent: true`, so each one's `metadata` field carries the FULL
 * TEXT of every source that went into it, not merely a hash. The artifact is therefore
 * self-describing, and this test asserts the obligation that follows: every source the
 * artifact says it was built from EXISTS in `solc_0_8/` and is byte-identical to the
 * copy the compiler saw.
 *
 * That gives a reviewer a chain they can walk with no toolchain at all:
 *
 *     solc_0_8/*.sol  ==  metadata.sources[*].content  ->  (solc 0.8.10)  ->  bytecode
 *
 * This test pins the left link, hermetically, on every run. The right link needs the
 * exact compiler and is pinned separately by `scripts/verify-diamond-artifacts.ts`,
 * which recompiles and compares bytecode (see that file for why it is not a unit test).
 *
 * If this test fails, one of two things happened, and they need opposite fixes:
 *   - a `.sol` under `solc_0_8/` was edited, in which case the artifacts are now stale
 *     and must be recompiled, because editing the source changes nothing on chain;
 *   - an artifact was replaced, in which case the sources must be updated to match.
 * Either way the two halves have drifted and the deployed bytecode is no longer
 * explained by the source next to it.
 */

import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import artifactDiamond from '../src/hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondCutFacet from '../src/hardhat-deploy-v1-artifacts/DiamondCutFacet.js';
import artifactDiamondLoupeFacet from '../src/hardhat-deploy-v1-artifacts/DiamondLoupeFacet.js';
import artifactDiamondLoupeFacetWithoutSupportsInterface from '../src/hardhat-deploy-v1-artifacts/DiamondLoupeFacetWithoutSupportsInterface.js';
import artifactOwnershipFacet from '../src/hardhat-deploy-v1-artifacts/OwnershipFacet.js';
import artifactDiamondERC165Init from '../src/hardhat-deploy-v1-artifacts/DiamondERC165Init.js';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The compiler that produced every bundled artifact. Pinned as an assertion rather than
 * read from the metadata: a future artifact rebuilt with a different compiler is a
 * decision someone must make deliberately, not something a test should silently accept.
 */
const EXPECTED_COMPILER = '0.8.10+commit.fc410830';

/**
 * Metadata source keys are the paths of the ORIGINAL compilation unit
 * (hardhat-deploy v1's tree, `solc_0.8/diamond/...`). This repo vendors the same files
 * under `solc_0_8/`, the directory name Solidity-free tooling can handle (no dot).
 */
function repoPathForMetadataSource(metadataSourcePath: string): string {
	const relative = metadataSourcePath.replace(/^solc_0\.8\/diamond\//, '');
	return path.join(packageRoot, 'solc_0_8', relative);
}

type BundledArtifact = {contractName?: string; metadata: string};

const ARTIFACTS: BundledArtifact[] = [
	artifactDiamond,
	artifactDiamondCutFacet,
	artifactDiamondLoupeFacet,
	artifactDiamondLoupeFacetWithoutSupportsInterface,
	artifactOwnershipFacet,
	artifactDiamondERC165Init,
];

describe('@rocketh/diamond - bundled artifact provenance', () => {
	for (const artifact of ARTIFACTS) {
		const metadata = JSON.parse(artifact.metadata);
		const name = artifact.contractName ?? Object.values(metadata.settings.compilationTarget)[0];

		describe(`${name}`, () => {
			it('was compiled by the pinned solc, with sources embedded literally', () => {
				expect(metadata.compiler.version).toBe(EXPECTED_COMPILER);
				// Without literal content the check below could only compare hashes, which tells
				//  a reviewer that something differs but never what.
				expect(metadata.settings.metadata?.useLiteralContent).toBe(true);
			});

			it('has every source it was built from vendored in this repo, byte-identical', () => {
				const sources = Object.entries(metadata.sources as Record<string, {content: string}>);
				expect(sources.length).toBeGreaterThan(0);

				for (const [metadataSourcePath, source] of sources) {
					const repoPath = repoPathForMetadataSource(metadataSourcePath);
					expect(
						fs.existsSync(repoPath),
						`missing vendored source for ${metadataSourcePath} (expected ${repoPath})`,
					).toBe(true);
					expect(
						fs.readFileSync(repoPath, 'utf8'),
						`${path.relative(packageRoot, repoPath)} differs from the copy embedded in ${name}'s metadata`,
					).toBe(source.content);
				}
			});
		});
	}

	it('vendors no Solidity that no artifact accounts for', () => {
		// The reverse direction: an orphan .sol would look authoritative while explaining no
		//  deployed bytecode at all, which is exactly the confusion this vendoring exists to end.
		const accountedFor = new Set<string>();
		for (const artifact of ARTIFACTS) {
			for (const metadataSourcePath of Object.keys(JSON.parse(artifact.metadata).sources)) {
				accountedFor.add(path.resolve(repoPathForMetadataSource(metadataSourcePath)));
			}
		}

		const solidityRoot = path.join(packageRoot, 'solc_0_8');
		const found: string[] = [];
		const walk = (dir: string) => {
			for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith('.sol')) found.push(path.resolve(full));
			}
		};
		walk(solidityRoot);

		const orphans = found.filter((f) => !accountedFor.has(f)).map((f) => path.relative(packageRoot, f));

		// `UsingDiamondOwner.sol` is a helper for CONSUMERS to inherit in their own facets; it
		//  is not compiled into anything this package deploys, so it is expected here.
		expect(orphans).toEqual(['solc_0_8/UsingDiamondOwner.sol']);
	});
});
