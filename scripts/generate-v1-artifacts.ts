/**
 * Reproduce hardhat-deploy v1's extended artifacts from vendored Solidity, byte for byte.
 *
 * Shared by `@rocketh/diamond` and `@rocketh/proxy`, which both ship PREBUILT artifacts
 * inherited from hardhat-deploy v1 and both vendor the sources those artifacts were built
 * from under a `hardhat-deploy-v1/` mirror. Each package supplies only DATA (which
 * compilation units, which sources in which order, which contracts to emit); the mechanics
 * of reproducing v1's output live here once.
 *
 * WHY THE ARTIFACTS ARE GENERATED BUT COMMITTED. These contracts are deployed with CREATE2,
 * so their bytecode determines their ADDRESS. Compiling during `build` or during a release
 * would let a different compiler, platform or path silently move every user's proxies and
 * facets, and would put a Solidity toolchain in the job that holds the npm OIDC token. v1
 * committed its `extendedArtifacts/` for the same reason, with `hardhat compile` as a
 * separate manual step. Generating them keeps the `.sol` as the single source of truth;
 * committing them keeps the addresses fixed. `--check` in CI is what holds the two together.
 *
 * WHAT MUST MATCH v1, AND WHY EACH ONE IS EASY TO GET SILENTLY WRONG:
 *
 *   1. THE SOURCE PATHS. solc hashes them into the metadata blob at the end of the
 *      bytecode, so the same bytes compiled under a different path are different bytecode
 *      and therefore a different address. Each mirror reproduces v1's tree exactly, so a
 *      file's path relative to the mirror IS its key here, with no mapping.
 *   2. THE COMPILATION UNITS AND THEIR SOURCE ORDER. Neither affects bytecode, but
 *      `solcInput` is stored verbatim in every artifact and `solcInputHash` is `murmur128`
 *      over that string, exactly as v1 computed it (v1 `src/index.ts:1038-1041`). Object key
 *      order survives `JSON.stringify`, so the order is DATA each package states, never the
 *      result of walking a directory. A package may have SEVERAL units (`@rocketh/proxy` has
 *      two), and artifacts from different units legitimately carry different hashes.
 *   3. THE SETTINGS. `evmVersion` is deliberately absent: v1 never passed one and 0.8.10
 *      defaults to london, which is what the metadata records. Passing it explicitly
 *      produces identical bytecode but a different recorded input.
 *
 * `solcInputHash` is not a security property. In v1 it is a content-addressed FILENAME:
 * deployments store their compilation input once at `deployments/<net>/solcInputs/<hash>.json`
 * and reference it, so many deployments sharing a compilation do not each carry a copy.
 * rocketh does not write that folder, so the field is inherited data. It is reproduced here
 * only because these artifact files are compared byte for byte, and `murmur-128` is the
 * dependency v1 used to compute it.
 */

import fs from 'node:fs';
import path from 'node:path';

import solc from 'solc';
import murmur128 from 'murmur-128';
import prettier from 'prettier';

/** The compiler every v1 artifact in this repo was built with. */
export const EXPECTED_COMPILER = '0.8.10+commit.fc410830';

export type ArtifactTarget = {
	/** Contract name, and the name of the generated `<name>.ts`. */
	name: string;
	/** Source that defines it, as keyed in the compilation unit. */
	sourceName: string;
};

export type CompilationUnit = {
	/**
	 * Every source of the unit, IN v1's ORDER (see the header). Paths are relative to the
	 * package's `hardhat-deploy-v1/` mirror and are used verbatim as solc's source keys.
	 */
	sources: string[];
	/** The contracts to emit from this unit. */
	artifacts: ArtifactTarget[];
};

export type GenerateSpec = {
	/** Absolute path of the package root. */
	packageRoot: string;
	/** Where the generated `<name>.ts` files go, relative to `packageRoot`. */
	artifactDir: string;
	units: CompilationUnit[];
};

/** v1's standard-json input shape. Key order matters: this string is stored AND hashed. */
function buildSolcInput(mirrorRoot: string, sources: string[]): string {
	const sourceEntries: Record<string, {content: string}> = {};
	for (const sourceName of sources) {
		sourceEntries[sourceName] = {content: fs.readFileSync(path.join(mirrorRoot, sourceName), 'utf8')};
	}

	return JSON.stringify(
		{
			language: 'Solidity',
			sources: sourceEntries,
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

/** The extended artifact, in v1's field order (it is compared byte for byte). */
function buildArtifact(compiled: any, target: ArtifactTarget, solcInput: string, solcInputHash: string) {
	// `evm.bytecode.object` and `evm.deployedBytecode.object` are dropped, as v1 dropped them:
	//  the same hex already sits at the top level. Everything else solc puts there
	//  (sourceMap, opcodes, linkReferences, generatedSources) is kept.
	const {object: _creationObject, ...bytecodeRest} = compiled.evm.bytecode;
	const {object: _runtimeObject, ...deployedBytecodeRest} = compiled.evm.deployedBytecode;

	return {
		contractName: target.name,
		sourceName: target.sourceName,
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

/**
 * Generate (or, with `--check`, compare) every artifact of a package.
 *
 * Returns nothing and exits non-zero on drift, so a package's script is a data declaration
 * plus one call.
 */
export async function generateV1Artifacts(spec: GenerateSpec): Promise<void> {
	const checkOnly = process.argv.includes('--check');

	const version = solc.version();
	if (!version.startsWith(EXPECTED_COMPILER)) {
		throw new Error(
			`expected solc ${EXPECTED_COMPILER} but the installed compiler is ${version}. These artifacts were ` +
				`built with that exact version, and the compiler identity is hashed into the bytecode, so any other ` +
				`one regenerates DIFFERENT artifacts and therefore different CREATE2 addresses.`,
		);
	}

	const mirrorRoot = path.join(spec.packageRoot, 'hardhat-deploy-v1');
	const artifactDir = path.join(spec.packageRoot, spec.artifactDir);
	const prettierConfig = await prettier.resolveConfig(path.join(artifactDir, 'anything.ts'));

	let drifted = 0;
	let total = 0;

	for (const unit of spec.units) {
		const solcInput = buildSolcInput(mirrorRoot, unit.sources);
		const solcInputHash = Buffer.from(murmur128(solcInput)).toString('hex');

		const output = JSON.parse(solc.compile(solcInput));
		const fatal = (output.errors ?? []).filter((e: {severity: string}) => e.severity === 'error');
		if (fatal.length > 0) {
			throw new Error(fatal.map((e: {formattedMessage: string}) => e.formattedMessage).join('\n'));
		}

		for (const target of unit.artifacts) {
			total++;
			const compiled = output.contracts[target.sourceName]?.[target.name];
			if (!compiled) {
				throw new Error(`solc produced no contract '${target.name}' from '${target.sourceName}'`);
			}

			const artifact = buildArtifact(compiled, target, solcInput, solcInputHash);

			// INDENTED, not compact, and that is what makes the output byte-identical to what is
			//  committed: prettier only keeps an object literal expanded when the input already
			//  breaks the line after `{`, so a compact `JSON.stringify` would let it collapse
			//  every short object and rewrite thousands of lines no compiler output changed.
			const formatted = await prettier.format(`export default ${JSON.stringify(artifact, null, '\t')} as const;\n`, {
				...prettierConfig,
				parser: 'typescript',
			});

			const file = path.join(artifactDir, `${target.name}.ts`);
			const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined;

			if (current === formatted) {
				console.log(`  unchanged  ${target.name}`);
				continue;
			}

			drifted++;
			if (checkOnly) {
				// Say WHICH half moved. A bytecode difference means someone edited Solidity without
				//  regenerating, so nothing they changed is on chain AND the addresses would move
				//  once it is. An unchanged bytecode points at packaging, which is harmless but
				//  still has to be committed.
				const currentBytecode = current?.match(/bytecode:\s*'(0x[0-9a-fA-F]*)'/)?.[1];
				console.log(
					`  DRIFT      ${target.name}: ${
						currentBytecode === artifact.bytecode ? 'bytecode unchanged, packaging differs' : 'BYTECODE DIFFERS'
					}`,
				);
				continue;
			}

			fs.writeFileSync(file, formatted);
			console.log(`  written    ${target.name}`);
		}
	}

	if (checkOnly && drifted > 0) {
		console.error(
			`\n${drifted} of ${total} artifacts do not match a fresh compile of hardhat-deploy-v1/.\n` +
				`Regenerate them, then review the diff CAREFULLY: these artifacts determine CREATE2 addresses, ` +
				`so a bytecode change moves them for every user.`,
		);
		process.exit(1);
	}

	console.log(
		checkOnly
			? `\nAll ${total} artifacts match a fresh compile of the vendored sources.`
			: `\nGenerated ${total} artifacts from hardhat-deploy-v1/ with solc ${EXPECTED_COMPILER}.`,
	);
}
