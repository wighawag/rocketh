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
 *     hardhat-deploy-v1/**\/*.sol  ==  metadata.sources[*].content  ->  (solc 0.8.10)  ->  bytecode
 *
 * WHY THE SOURCES SIT UNDER `hardhat-deploy-v1/` AND NOT `solc_0_8/`. Two reasons, and
 * both matter.
 *
 * `solc_0_8/` is a PUBLIC SOLIDITY IMPORT SURFACE: `package.json` exports `./solc_0_8/*`
 * and the migration guide tells users to write
 * `import '@rocketh/proxy/solc_0_8/ERC1967/Proxied.sol'` in their own contracts. It holds
 * the handful of files a consumer legitimately inherits or imports. The contracts THIS
 * package deploys are not among them, and putting them there would invite an import of an
 * implementation contract that is meant to be deployed for you.
 *
 * And the mirror reproduces hardhat-deploy v1's tree EXACTLY, so a file's path relative to
 * `hardhat-deploy-v1/` IS its key in the artifact metadata (`solc_0.8/diamond/Diamond.sol`).
 * That is not cosmetic: solc hashes the source PATHS into the metadata blob at the end of
 * the bytecode, so compiling these same bytes under any other path yields different
 * bytecode, and, because the default facets deploy with CREATE2, a different ADDRESS for
 * every user. The layout is what makes regeneration reproduce the shipped artifacts rather
 * than silently move everyone's facets.
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

/** The frozen mirror of hardhat-deploy v1's tree: relative path == artifact metadata key. */
const MIRROR_ROOT = path.join(packageRoot, 'hardhat-deploy-v1');

/** No mapping, deliberately: see the layout note above. */
function repoPathForMetadataSource(metadataSourcePath: string): string {
	return path.join(MIRROR_ROOT, metadataSourcePath);
}

type BundledArtifact = {contractName?: string; metadata: string};

function solidityFilesUnder(root: string): string[] {
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

		const found = solidityFilesUnder(MIRROR_ROOT);
		const orphans = found.filter((f) => !accountedFor.has(f)).map((f) => path.relative(packageRoot, f));

		// The mirror is exactly the compilation inputs, nothing else. A stray file here would
		//  look authoritative while explaining no deployed bytecode at all.
		expect(orphans).toEqual([]);
	});

	it('keeps the public solc_0_8 import surface identical to the frozen mirror', () => {
		// `solc_0_8/` is what CONSUMERS import (`@rocketh/proxy/solc_0_8/...` in the migration
		//  guide), and it overlaps the mirror: LibDiamond and the interfaces appear in both. Two
		//  copies can drift, and the drift would be silent AND serious, since a user would compile
		//  their facets against an interface that differs from the one the deployed diamond was
		//  built with. `UsingDiamondOwner.sol` is consumer-only (nothing deployed here compiles
		//  it), so it has no counterpart and is skipped.
		const consumerSurface = path.join(packageRoot, 'solc_0_8');
		const shared = solidityFilesUnder(consumerSurface).filter(
			(file) => path.basename(file) !== 'UsingDiamondOwner.sol',
		);
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
