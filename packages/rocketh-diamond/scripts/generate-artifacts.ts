/**
 * Compile the frozen `hardhat-deploy-v1/` mirror and WRITE `src/hardhat-deploy-v1-artifacts/*.ts`.
 *
 *     pnpm --filter @rocketh/diamond generate:artifacts
 *     pnpm --filter @rocketh/diamond generate:artifacts --check   # write nothing, fail on drift
 *
 * The artifacts are GENERATED but COMMITTED, and both halves of that are deliberate.
 *
 * COMMITTED, because they are not really build output: the default facets deploy with
 * CREATE2, so their bytecode determines their ADDRESS. Compiling during `build` or during
 * the release would mean a different compiler, platform or path silently moving every
 * user's facets, and would put a Solidity toolchain in the job that holds the npm OIDC
 * token. hardhat-deploy v1 committed its `extendedArtifacts/` for the same reason, with
 * `hardhat compile` as a separate manual step.
 *
 * GENERATED, because the `.sol` is then the single source of truth. Before this, editing a
 * vendored source had NO effect on anything deployed, and nothing said so.
 *
 * Regenerating today is a no-op, byte for byte, and `--check` in CI keeps it that way. To
 * reproduce the shipped artifacts exactly, three things have to match what hardhat-deploy v1
 * fed the compiler, and each of them would otherwise change the output silently:
 *
 *   1. THE SOURCE PATHS. solc hashes them into the metadata blob at the end of the
 *      bytecode. The mirror reproduces v1's tree, so a file's path relative to
 *      `hardhat-deploy-v1/` IS its key here, and no mapping is involved.
 *   2. THE INPUT SHAPE AND SOURCE ORDER (see `SOURCE_ORDER`). These do not affect bytecode,
 *      but `solcInput` is stored verbatim in each artifact and `solcInputHash` is
 *      `murmur128` over it, exactly as v1 computed it (`src/index.ts:1038-1041`).
 *   3. THE SETTINGS. `evmVersion` is deliberately ABSENT: v1 never passed one, and 0.8.10
 *      defaults to london, which is what the artifacts' metadata records. Passing it
 *      explicitly produces identical bytecode but a different `solcInput`.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import solc from 'solc';
import murmur128 from 'murmur-128';
import prettier from 'prettier';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIRROR_ROOT = path.join(packageRoot, 'hardhat-deploy-v1');
const ARTIFACT_DIR = path.join(packageRoot, 'src', 'hardhat-deploy-v1-artifacts');

const EXPECTED_COMPILER = '0.8.10+commit.fc410830';

/**
 * The order hardhat's compilation unit listed these sources in, preserved as DATA.
 *
 * Object key order survives `JSON.stringify`, so it is part of the `solcInput` string and
 * therefore of `solcInputHash`. Sorting them, or walking the directory instead, produces
 * identical BYTECODE with a different recorded input, which would make regeneration a
 * spurious diff forever.
 */
const SOURCE_ORDER = [
	'solc_0.8/diamond/Diamond.sol',
	'solc_0.8/diamond/libraries/LibDiamond.sol',
	'solc_0.8/diamond/interfaces/IDiamondCut.sol',
	'solc_0.8/diamond/facets/DiamondCutFacet.sol',
	'solc_0.8/diamond/UsingDiamondOwner.sol',
	'solc_0.8/diamond/initializers/DiamondERC165Init.sol',
	'solc_0.8/diamond/interfaces/IERC165.sol',
	'solc_0.8/diamond/facets/DiamondLoupeFacet.sol',
	'solc_0.8/diamond/interfaces/IDiamondLoupe.sol',
	'solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol',
	'solc_0.8/diamond/facets/OwnershipFacet.sol',
	'solc_0.8/diamond/interfaces/IERC173.sol',
] as const;

/** Which contract each generated artifact file holds, and where it is defined. */
const ARTIFACTS: {name: string; sourceName: string}[] = [
	{name: 'Diamond', sourceName: 'solc_0.8/diamond/Diamond.sol'},
	{name: 'DiamondCutFacet', sourceName: 'solc_0.8/diamond/facets/DiamondCutFacet.sol'},
	{name: 'DiamondLoupeFacet', sourceName: 'solc_0.8/diamond/facets/DiamondLoupeFacet.sol'},
	{
		name: 'DiamondLoupeFacetWithoutSupportsInterface',
		sourceName: 'solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol',
	},
	{name: 'OwnershipFacet', sourceName: 'solc_0.8/diamond/facets/OwnershipFacet.sol'},
	{name: 'DiamondERC165Init', sourceName: 'solc_0.8/diamond/initializers/DiamondERC165Init.sol'},
];

/** The standard-json input, in v1's exact shape. Key order matters: it is hashed. */
function buildSolcInput(): string {
	const sources: Record<string, {content: string}> = {};
	for (const sourceName of SOURCE_ORDER) {
		sources[sourceName] = {content: fs.readFileSync(path.join(MIRROR_ROOT, sourceName), 'utf8')};
	}

	return JSON.stringify(
		{
			language: 'Solidity',
			sources,
			settings: {
				optimizer: {enabled: true, runs: 999999},
				outputSelection: {
					'*': {
						'*': [
							'abi',
							'evm.bytecode',
							'evm.deployedBytecode',
							'evm.methodIdentifiers',
							'metadata',
							'devdoc',
							'userdoc',
							'storageLayout',
							'evm.gasEstimates',
						],
						'': ['ast'],
					},
				},
				metadata: {useLiteralContent: true},
			},
		},
		null,
		'  ',
	);
}

/**
 * The extended-artifact object, with hardhat-deploy v1's field order.
 *
 * Order is not cosmetic here either: these are emitted as a TypeScript literal and compared
 * byte for byte against what is committed.
 */
function buildArtifact(compiled: any, name: string, sourceName: string, solcInput: string, solcInputHash: string) {
	// `evm.bytecode.object` and `evm.deployedBytecode.object` are dropped, as v1 dropped them:
	//  the same hex already sits at the top level as `bytecode` / `deployedBytecode`, and these
	//  files are large enough without carrying every contract's code twice. Everything else solc
	//  puts under `evm.bytecode` (sourceMap, opcodes, linkReferences, generatedSources) is kept.
	const {object: _creationObject, ...bytecodeRest} = compiled.evm.bytecode;
	const {object: _runtimeObject, ...deployedBytecodeRest} = compiled.evm.deployedBytecode;

	return {
		contractName: name,
		sourceName,
		abi: compiled.abi,
		bytecode: `0x${compiled.evm.bytecode.object}`,
		deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
		linkReferences: compiled.evm.bytecode.linkReferences ?? {},
		deployedLinkReferences: compiled.evm.deployedBytecode.linkReferences ?? {},
		devdoc: compiled.devdoc,
		evm: {
			bytecode: bytecodeRest,
			deployedBytecode: deployedBytecodeRest,
			gasEstimates: compiled.evm.gasEstimates,
			methodIdentifiers: compiled.evm.methodIdentifiers,
		},
		metadata: compiled.metadata,
		storageLayout: compiled.storageLayout,
		userdoc: compiled.userdoc,
		solcInput,
		solcInputHash,
	};
}

async function main(): Promise<void> {
	const checkOnly = process.argv.includes('--check');

	const version = solc.version();
	if (!version.startsWith(EXPECTED_COMPILER)) {
		throw new Error(
			`expected solc ${EXPECTED_COMPILER} but the installed compiler is ${version}. The bundled artifacts ` +
				`were built with that exact version, and the compiler identity is hashed into the bytecode, so any ` +
				`other one regenerates DIFFERENT artifacts and therefore different CREATE2 addresses.`,
		);
	}

	const solcInput = buildSolcInput();
	const solcInputHash = Buffer.from(murmur128(solcInput)).toString('hex');

	const output = JSON.parse(solc.compile(solcInput));
	const fatal = (output.errors ?? []).filter((e: {severity: string}) => e.severity === 'error');
	if (fatal.length > 0) {
		throw new Error(fatal.map((e: {formattedMessage: string}) => e.formattedMessage).join('\n'));
	}

	const prettierConfig = await prettier.resolveConfig(path.join(ARTIFACT_DIR, 'Diamond.ts'));

	let drifted = 0;
	for (const {name, sourceName} of ARTIFACTS) {
		const artifact = buildArtifact(output.contracts[sourceName][name], name, sourceName, solcInput, solcInputHash);

		// INDENTED, not compact, and that is what makes the output byte-identical to what is
		//  committed. Prettier preserves an object literal's expansion when the source already has
		//  a line break after `{` (its objects-preserve-first-line-break rule), so a compact
		//  `JSON.stringify` would let it collapse every short object onto one line and rewrite
		//  thousands of lines that no compiler output actually changed.
		const formatted = await prettier.format(`export default ${JSON.stringify(artifact, null, '\t')} as const;\n`, {
			...prettierConfig,
			parser: 'typescript',
		});

		const target = path.join(ARTIFACT_DIR, `${name}.ts`);
		const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : undefined;

		if (current === formatted) {
			console.log(`  unchanged  ${name}`);
			continue;
		}

		drifted++;
		if (checkOnly) {
			// Say WHICH half moved: a bytecode difference means someone edited Solidity without
			//  regenerating (and nothing they changed is on chain), while an unchanged bytecode
			//  points at packaging, which is harmless but still has to be committed.
			const currentBytecode = current?.match(/bytecode:\s*'(0x[0-9a-fA-F]*)'/)?.[1];
			const sameBytecode = currentBytecode === artifact.bytecode;
			console.log(`  DRIFT      ${name}: ${sameBytecode ? 'bytecode unchanged, packaging differs' : 'BYTECODE DIFFERS'}`);
			continue;
		}

		fs.writeFileSync(target, formatted);
		console.log(`  written    ${name}`);
	}

	if (checkOnly && drifted > 0) {
		console.error(
			`\n${drifted} artifact(s) do not match a fresh compile of hardhat-deploy-v1/.\n` +
				`Run: pnpm --filter @rocketh/diamond generate:artifacts\n` +
				`Then review the diff CAREFULLY: these artifacts determine the CREATE2 addresses of the ` +
				`default facets, so a bytecode change moves them for every user.`,
		);
		process.exit(1);
	}

	console.log(
		checkOnly
			? `\nAll ${ARTIFACTS.length} artifacts match a fresh compile of the vendored sources.`
			: `\nGenerated ${ARTIFACTS.length} artifacts from hardhat-deploy-v1/ with solc ${EXPECTED_COMPILER}.`,
	);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
