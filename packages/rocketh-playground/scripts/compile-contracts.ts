/**
 * Compiles `contracts/*.sol` into vendored artifacts under `src/fixture/`.
 *
 * Usage: `pnpm --filter @rocketh/playground contracts:compile`
 *
 * Requires `solc` on PATH. It is NOT an npm dependency, deliberately: shelling out to a tool
 * the author already has keeps a 9MB compiler out of the install for every consumer of this
 * package, and matches how `sync-artifact.ts` already shells out to `npm` and `tar`. The
 * artifacts are committed, so nobody needs solc to USE the package, only to change a contract.
 *
 * Settings match the ones the published `template-ethereum-contracts` artifact records in its
 * metadata (optimizer off, `cancun`), so the two implementations behave comparably. The solc
 * PATCH version will differ from the published 0.8.28 and that is fine: v1's artifact is kept
 * exactly as published rather than recompiled here, precisely so its provenance stays "the
 * real template contract" (see `greetings-registry.artifact.ts`).
 */
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

type SolcOutput = {
	errors?: {severity: string; formattedMessage: string}[];
	contracts: Record<
		string,
		Record<
			string,
			{
				abi: unknown[];
				metadata: string;
				evm: {
					bytecode: {object: string; linkReferences: unknown};
					deployedBytecode: {object: string; linkReferences: unknown};
				};
			}
		>
	>;
};

const CONTRACTS = [
	{
		source: 'GreetingsRegistryV2.sol',
		contract: 'GreetingsRegistryV2',
		output: 'greetings-registry-v2.artifact.ts',
		exportName: 'GreetingsRegistryV2',
		header: `/**
 * The compiled \`GreetingsRegistryV2\` contract, the SECOND implementation the playground
 * upgrades its proxy to.
 *
 * GENERATED from \`contracts/GreetingsRegistryV2.sol\`. Do not hand-edit; run
 * \`pnpm --filter @rocketh/playground contracts:compile\` instead.
 *
 * Unlike v1, whose artifact is vendored verbatim from \`template-ethereum-contracts@0.0.3\`,
 * this one is ours: the template has no v2. The source lives in \`contracts/\` so the code the
 * tutorial SHOWS is provably the code it RUNS.
 */`,
	},
] as const;

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

const input = {
	language: 'Solidity',
	sources: Object.fromEntries(CONTRACTS.map((c) => [c.source, {urls: [`contracts/${c.source}`]}])),
	settings: {
		optimizer: {enabled: false, runs: 200},
		evmVersion: 'cancun',
		outputSelection: {
			'*': {
				'*': [
					'abi',
					'metadata',
					'evm.bytecode.object',
					'evm.bytecode.linkReferences',
					'evm.deployedBytecode.object',
					'evm.deployedBytecode.linkReferences',
				],
			},
		},
	},
};

const raw = execFileSync('solc', ['--standard-json', '--allow-paths', '.'], {
	cwd: packageRoot,
	input: JSON.stringify(input),
	encoding: 'utf8',
	maxBuffer: 64 * 1024 * 1024,
});

const output = JSON.parse(raw) as SolcOutput;

const errors = output.errors?.filter((e) => e.severity === 'error') ?? [];
if (errors.length > 0) {
	for (const error of errors) {
		console.error(error.formattedMessage);
	}
	throw new Error('solc reported errors');
}
for (const warning of output.errors ?? []) {
	console.warn(warning.formattedMessage.split('\n')[0]);
}

for (const target of CONTRACTS) {
	const compiled = output.contracts[target.source]?.[target.contract];
	if (!compiled) {
		throw new Error(`solc produced no output for ${target.contract}`);
	}

	const artifact = {
		contractName: target.contract,
		sourceName: `contracts/${target.source}`,
		abi: compiled.abi,
		bytecode: `0x${compiled.evm.bytecode.object}`,
		deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
		linkReferences: compiled.evm.bytecode.linkReferences,
		deployedLinkReferences: compiled.evm.deployedBytecode.linkReferences,
		// Required by `Artifact` in `@rocketh/core/types`, and what a verifier reads.
		metadata: compiled.metadata,
	};

	const file = new URL(`../src/fixture/${target.output}`, import.meta.url);
	writeFileSync(
		file,
		`${target.header}\nimport type {Artifact} from '@rocketh/core/types';\n\nexport const ${target.exportName} = ${JSON.stringify(
			artifact,
			null,
			'\t',
		)} as const satisfies Artifact;\n`,
	);
	const written = readFileSync(file, 'utf8');
	console.log(`wrote src/fixture/${target.output} (${(written.length / 1024).toFixed(1)}KB)`);
}

console.log('run `pnpm format` before committing: this writes JSON quoting, prettier fixes it');
