/**
 * Recompile the vendored Solidity and prove it produces the bundled artifacts' bytecode.
 *
 *     pnpm --filter @rocketh/diamond verify:artifacts
 *
 * This package DEPLOYS prebuilt artifacts (`src/hardhat-deploy-v1-artifacts/`), and its
 * `build` script never runs a Solidity compiler. `test/bundled-artifact-provenance.test.ts`
 * pins the first half of the chain hermetically (the vendored `.sol` files are byte-identical
 * to the sources embedded in each artifact's metadata). This script pins the second half,
 * the one that needs the exact compiler:
 *
 *     hardhat-deploy-v1/**\/*.sol  ->  (solc 0.8.10+commit.fc410830)  ->  the bundled bytecode
 *
 * WHY A SCRIPT AND NOT A TEST: it needs a specific solc binary that `pnpm test` cannot
 * assume, and downloading one silently during a test run is exactly the kind of implicit
 * network dependency this package's own supply-chain settings exist to prevent. Point it
 * at a compiler you already have:
 *
 *     SOLC=~/.local/share/svm/0.8.10/solc-0.8.10 pnpm --filter @rocketh/diamond verify:artifacts
 *
 * With no `SOLC` it looks in foundry's svm store, then falls back to `solc` on PATH, and
 * REFUSES to run against any version other than the pinned one: a mismatch would compare
 * two unrelated compilers and call the difference a defect in the artifacts.
 *
 * Each artifact is compiled on its own, from the exact source set, optimizer settings,
 * evmVersion and metadata settings recorded in ITS OWN metadata, so nothing about the
 * comparison is guessed.
 */

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import artifactDiamond from '../src/hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondCutFacet from '../src/hardhat-deploy-v1-artifacts/DiamondCutFacet.js';
import artifactDiamondLoupeFacet from '../src/hardhat-deploy-v1-artifacts/DiamondLoupeFacet.js';
import artifactDiamondLoupeFacetWithoutSupportsInterface from '../src/hardhat-deploy-v1-artifacts/DiamondLoupeFacetWithoutSupportsInterface.js';
import artifactOwnershipFacet from '../src/hardhat-deploy-v1-artifacts/OwnershipFacet.js';
import artifactDiamondERC165Init from '../src/hardhat-deploy-v1-artifacts/DiamondERC165Init.js';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED_COMPILER = '0.8.10+commit.fc410830';
const SOLC_VERSION = '0.8.10';

type BundledArtifact = {contractName?: string; metadata: string; bytecode: string; deployedBytecode?: string};

const ARTIFACTS: BundledArtifact[] = [
	artifactDiamond,
	artifactDiamondCutFacet,
	artifactDiamondLoupeFacet,
	artifactDiamondLoupeFacetWithoutSupportsInterface,
	artifactOwnershipFacet,
	artifactDiamondERC165Init,
];

/**
 * The mirror reproduces v1's tree exactly, so a metadata source key IS the relative path.
 * That is load-bearing rather than tidy: solc hashes source paths into the metadata blob at
 * the end of the bytecode, so the same bytes compiled under a different path produce
 * different bytecode and, under CREATE2, a different address for every user.
 */
function repoPathForMetadataSource(metadataSourcePath: string): string {
	return path.join(packageRoot, 'hardhat-deploy-v1', metadataSourcePath);
}

/** The compiler to use, in order of decreasing explicitness. */
function resolveSolc(): string {
	const candidates = [
		process.env.SOLC,
		path.join(os.homedir(), '.local/share/svm', SOLC_VERSION, `solc-${SOLC_VERSION}`),
		path.join(os.homedir(), '.svm', SOLC_VERSION, `solc-${SOLC_VERSION}`),
		'solc',
	].filter((candidate): candidate is string => !!candidate);

	for (const candidate of candidates) {
		try {
			const version = execFileSync(candidate, ['--version'], {encoding: 'utf8'});
			if (version.includes(EXPECTED_COMPILER)) {
				return candidate;
			}
		} catch {
			// Not present, or not executable: try the next candidate.
		}
	}

	throw new Error(
		`no solc ${EXPECTED_COMPILER} found. The bundled artifacts were built with it, and comparing bytecode ` +
			`from any other compiler would report a difference that is not a defect.\n` +
			`Point SOLC at one, e.g.\n` +
			`  forge build --use ${SOLC_VERSION}   # downloads it into ~/.local/share/svm\n` +
			`  SOLC=~/.local/share/svm/${SOLC_VERSION}/solc-${SOLC_VERSION} pnpm --filter @rocketh/diamond verify:artifacts`,
	);
}

/** Strip solc's trailing CBOR metadata, whose length is the last two bytes. */
function withoutMetadata(bytecode: string): string {
	const raw = bytecode.replace(/^0x/, '');
	if (raw.length < 4) return raw;
	const length = parseInt(raw.slice(-4), 16);
	const cut = raw.length - 4 - length * 2;
	return cut > 0 ? raw.slice(0, cut) : raw;
}

function compile(artifact: BundledArtifact, solc: string) {
	const metadata = JSON.parse(artifact.metadata);
	const [targetFile, contractName] = Object.entries(metadata.settings.compilationTarget)[0] as [string, string];

	const sources: Record<string, {content: string}> = {};
	for (const metadataSourcePath of Object.keys(metadata.sources)) {
		sources[metadataSourcePath] = {content: fs.readFileSync(repoPathForMetadataSource(metadataSourcePath), 'utf8')};
	}

	const input = {
		language: 'Solidity',
		sources,
		settings: {
			optimizer: metadata.settings.optimizer,
			evmVersion: metadata.settings.evmVersion,
			metadata: metadata.settings.metadata,
			remappings: metadata.settings.remappings ?? [],
			libraries: metadata.settings.libraries ?? {},
			outputSelection: {'*': {'*': ['evm.bytecode.object', 'evm.deployedBytecode.object']}},
		},
	};

	const output = JSON.parse(
		execFileSync(solc, ['--standard-json'], {
			input: JSON.stringify(input),
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024,
		}),
	);

	const fatal = (output.errors ?? []).filter((e: {severity: string}) => e.severity === 'error');
	if (fatal.length > 0) {
		throw new Error(
			`solc failed for ${contractName}:\n${fatal.map((e: {formattedMessage: string}) => e.formattedMessage).join('\n')}`,
		);
	}

	const compiled = output.contracts[targetFile][contractName];
	return {
		contractName,
		bytecode: compiled.evm.bytecode.object,
		deployedBytecode: compiled.evm.deployedBytecode.object,
	};
}

function main(): void {
	const solc = resolveSolc();
	console.log(`solc:      ${solc}`);
	console.log(`expecting: ${EXPECTED_COMPILER}\n`);

	let failures = 0;

	for (const artifact of ARTIFACTS) {
		const {contractName, bytecode, deployedBytecode} = compile(artifact, solc);

		const creationMatches = `0x${bytecode}` === artifact.bytecode;
		const runtimeMatches =
			artifact.deployedBytecode === undefined || `0x${deployedBytecode}` === artifact.deployedBytecode;

		if (creationMatches && runtimeMatches) {
			console.log(`  OK        ${contractName}: creation and runtime bytecode reproduced exactly`);
			continue;
		}

		// A difference confined to the trailing CBOR blob means the CODE is identical and only
		//  the metadata hash moved (a source byte, a path, a settings field). Worth separating:
		//  it is a provenance discrepancy, not a behavioural one.
		const codeOnlyMatches =
			withoutMetadata(`0x${bytecode}`) === withoutMetadata(artifact.bytecode) &&
			(artifact.deployedBytecode === undefined ||
				withoutMetadata(`0x${deployedBytecode}`) === withoutMetadata(artifact.deployedBytecode));

		failures++;
		if (codeOnlyMatches) {
			console.log(
				`  METADATA  ${contractName}: executable code is identical, trailing metadata differs. ` +
					`The sources compile to the same behaviour but not to the same artifact.`,
			);
		} else {
			console.log(
				`  MISMATCH  ${contractName}: recompiled bytecode differs (creation ${creationMatches ? 'ok' : 'differs'}, ` +
					`runtime ${runtimeMatches ? 'ok' : 'differs'})`,
			);
		}
	}

	if (failures > 0) {
		console.error(`\n${failures} of ${ARTIFACTS.length} artifacts could not be reproduced from hardhat-deploy-v1/.`);
		process.exit(1);
	}

	console.log(`\nAll ${ARTIFACTS.length} bundled artifacts reproduced from the vendored sources.`);
}

main();
