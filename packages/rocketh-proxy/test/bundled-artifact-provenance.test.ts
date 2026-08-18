/**
 * The bundled proxy artifacts must correspond to the Solidity in this repo.
 *
 * Same obligation as `@rocketh/diamond`'s, for the same reason: these artifacts ship as
 * compiled bytecode inherited from hardhat-deploy v1, the package build never runs a
 * Solidity compiler, and a proxy deployed with a deterministic salt gets its ADDRESS from
 * that bytecode. Until the sources were vendored, "what source produced this?" had no answer
 * inside this repository.
 *
 *     hardhat-deploy-v1/**\/*.sol  ==  metadata.sources[*].content  ->  (solc 0.8.10)  ->  bytecode
 *
 * This is the hermetic half, which needs no compiler because the artifacts embed their own
 * sources (`metadata.useLiteralContent: true`). `pnpm verify:artifacts` is the other half.
 *
 * NOTE the two compilation units: v1 compiled the EIP173 proxies separately from the
 * OpenZeppelin-based ones, so those artifacts legitimately carry different `solcInput`
 * strings and different `solcInputHash` values. The mirror holds the union.
 */

import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
	allCompiledSources,
	compiledUnits,
	describeArtifact,
	solidityFilesUnder,
	type ProvenanceArtifact,
} from '../../../scripts/artifact-provenance.js';

import artifactEIP173Proxy from '../src/hardhat-deploy-v1-artifacts/EIP173Proxy.js';
import artifactEIP173ProxyWithReceive from '../src/hardhat-deploy-v1-artifacts/EIP173ProxyWithReceive.js';
import artifactERC1967Proxy from '../src/hardhat-deploy-v1-artifacts/ERC1967Proxy.js';
import artifactOptimizedTransparentUpgradeableProxy from '../src/hardhat-deploy-v1-artifacts/OptimizedTransparentUpgradeableProxy.js';
import artifactProxyAdmin from '../src/hardhat-deploy-v1-artifacts/ProxyAdmin.js';
import artifactTransparentUpgradeableProxy from '../src/hardhat-deploy-v1-artifacts/TransparentUpgradeableProxy.js';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIRROR_ROOT = path.join(packageRoot, 'hardhat-deploy-v1');

const EXPECTED_COMPILER = '0.8.10+commit.fc410830';

const ARTIFACTS: ProvenanceArtifact[] = [
	artifactEIP173Proxy,
	artifactEIP173ProxyWithReceive,
	artifactERC1967Proxy,
	artifactOptimizedTransparentUpgradeableProxy,
	artifactProxyAdmin,
	artifactTransparentUpgradeableProxy,
];

describe('@rocketh/proxy - bundled artifact provenance', () => {
	for (const artifact of ARTIFACTS) {
		const described = describeArtifact(artifact);

		describe(described.name, () => {
			it('was compiled by the pinned solc, with sources embedded literally', () => {
				expect(described.compiler).toBe(EXPECTED_COMPILER);
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

	it('vendors exactly the union of both compilation units', () => {
		const vendored = solidityFilesUnder(MIRROR_ROOT).map((file) => path.relative(MIRROR_ROOT, file));
		expect(vendored.sort()).toEqual(allCompiledSources(ARTIFACTS));
	});

	it('still comes from two separate compilation units', () => {
		// Pinned because merging them is the tempting simplification: it would compile to
		//  identical bytecode and still rewrite every artifact, since `solcInput` is stored
		//  verbatim and `solcInputHash` is derived from it.
		expect(compiledUnits(ARTIFACTS)).toHaveLength(2);
	});
});
