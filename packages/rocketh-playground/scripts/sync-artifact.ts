/**
 * Regenerates `src/fixture/greetings-registry.artifact.ts` from a published
 * `template-ethereum-contracts` tarball.
 *
 * The artifact is VENDORED rather than imported (see the header this writes for why), and a
 * vendored file with no way to refresh it rots. This is that way.
 *
 * Usage: `pnpm --filter @rocketh/playground artifact:sync [version]`
 *
 * It trims the published artifact to the fields a deployment needs. The published module is
 * ~946KB on disk because it also carries `evm`, `storageLayout`, `devdoc` and `userdoc`, none
 * of which a deploy reads, and all of which a documentation page would have to download.
 */
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const VERSION = process.argv[2] ?? '0.0.3';
const OUTPUT = new URL('../src/fixture/greetings-registry.artifact.ts', import.meta.url);

const workingDirectory = mkdtempSync(join(tmpdir(), 'rocketh-playground-artifact-'));

try {
	execFileSync('npm', ['pack', `template-ethereum-contracts@${VERSION}`], {
		cwd: workingDirectory,
		stdio: 'inherit',
	});
	const tarball = readdirSync(workingDirectory).find((name) => name.endsWith('.tgz'));
	if (!tarball) {
		throw new Error(`npm pack produced no tarball for template-ethereum-contracts@${VERSION}`);
	}
	execFileSync('tar', ['xzf', tarball], {cwd: workingDirectory, stdio: 'inherit'});

	const module = (await import(
		join(workingDirectory, 'package/dist/generated/artifacts/GreetingsRegistry.js')
	)) as Record<string, Record<string, unknown>>;
	const published = module.Artifact_GreetingsRegistry;
	if (!published) {
		throw new Error('the published module no longer exports Artifact_GreetingsRegistry');
	}

	const trimmed = {
		contractName: published.contractName,
		sourceName: published.sourceName,
		abi: published.abi,
		bytecode: published.bytecode,
		deployedBytecode: published.deployedBytecode,
		linkReferences: published.linkReferences,
		deployedLinkReferences: published.deployedLinkReferences,
		// Required by `Artifact` in `@rocketh/core/types`, and what a verifier reads.
		metadata: published.metadata,
	};

	const header = `/**
 * The compiled \`GreetingsRegistry\` contract, vendored.
 *
 * WHY vendored rather than imported from \`template-ethereum-contracts\`: that package declares
 * \`@rocketh/deploy\`, \`@rocketh/proxy\`, \`@rocketh/read-execute\`, \`@rocketh/router\`,
 * \`@rocketh/signer\` and \`@rocketh/viem\` as real dependencies pinned to published \`^0.17.x\`.
 * Installing it here would place a SECOND copy of those packages next to this workspace's own,
 * and the deploy script's extensions would then close over a different \`Environment\` than the
 * executor builds. Vendoring keeps exactly one copy of rocketh in play.
 *
 * It is also what makes this affordable to ship on a docs page: the published artifact module
 * is ~946KB on disk because it carries \`evm\`, \`storageLayout\` and the doc blocks. Trimmed to
 * what a deployment actually needs it is ~14KB. \`metadata\` is kept because \`Artifact\` in
 * \`@rocketh/core/types\` requires it and verification reads it.
 *
 * Bytecode and ABI are copied verbatim from \`template-ethereum-contracts@${VERSION}\`, so this
 * deploys the same contract the template does. Precedent: ADR-0003 vendors the hardhat-deploy
 * v1 proxy artifacts into \`@rocketh/proxy\` for the same class of reason.
 *
 * GENERATED, do not hand-edit. Regenerate with \`pnpm --filter @rocketh/playground artifact:sync\`.
 */
import type {Artifact} from '@rocketh/core/types';

export const GreetingsRegistry = ${JSON.stringify(trimmed, null, '\t')} as const satisfies Artifact;
`;

	writeFileSync(OUTPUT, header);
	console.log(`wrote ${OUTPUT.pathname} from template-ethereum-contracts@${VERSION}`);
	console.log('run `pnpm format` before committing: this writes JSON quoting, prettier fixes it');
} finally {
	rmSync(workingDirectory, {recursive: true, force: true});
}
