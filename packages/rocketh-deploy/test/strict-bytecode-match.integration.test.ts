/**
 * Integration tests for `@rocketh/deploy` - the REDEPLOY decision.
 *
 * On a re-run, `deploy` decides whether a saved deployment still corresponds to the
 * artifact you are deploying now. That decision is the whole reason a deploy script can
 * be run twice, and `strictBytecodeMatch` is the knob that changes it.
 *
 * By DEFAULT the comparison strips the trailing CBOR METADATA BLOB that Solidity appends
 * to runtime bytecode, because that blob changes for reasons that do not change
 * behaviour: a comment, an absolute source path, a compiler patch bump. Comparing raw
 * bytes would redeploy a contract - or upgrade a proxy - because someone reformatted a
 * file (`docs/adr/0004-non-strict-bytecode-matching-by-default.md`).
 *
 * `strictBytecodeMatch: true` opts out and compares verbatim, for flows that pin an exact
 * compilation.
 *
 * These run against `createTestEnvironment`, so the redeploy decision, the save and the
 * broadcast are the real ones.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {createMockArtifact, createNodeHeldEnvironment} from '@rocketh/test-utils';
import type {Artifact} from '@rocketh/core/types';
import type {Abi} from 'abitype';

/**
 * The part of the runtime bytecode that IS the contract: identical between the two
 * artifacts below, because the scenario is a recompile that changed only metadata.
 */
const RUNTIME_CODE = '0x60806040526001';

/**
 * A metadata blob plus its two-byte big-endian LENGTH suffix, which is how solc marks the
 * end of the runtime bytecode. `000c` = 12 bytes, matching the 12-byte blob in front of
 * it, so stripping the declared length removes exactly the metadata.
 */
function withMetadata(metadataByte: string, lengthInBytes = 10): `0x${string}` {
	const blob = metadataByte.repeat(lengthInBytes);
	const suffix = lengthInBytes.toString(16).padStart(4, '0');
	return `${RUNTIME_CODE}${blob}${suffix}` as `0x${string}`;
}

/**
 * Two artifacts for the SAME contract, compiled twice: same runtime code, different
 * metadata. This is the case the default exists for.
 */
function artifactCompiledWith(metadataByte: string, creationSuffix: string): Artifact<Abi> {
	const artifact = createMockArtifact('MetadataSensitiveContract');
	(artifact as {deployedBytecode: string}).deployedBytecode = withMetadata(metadataByte);
	// the creation bytecode carries the blob too, so it differs between compilations
	(artifact as {bytecode: string}).bytecode = `0x6080604052348015600f57600080fd5b50${creationSuffix}`;
	return artifact;
}

const FIRST_COMPILATION = () => artifactCompiledWith('a1', 'aa');
const SECOND_COMPILATION = () => artifactCompiledWith('b2', 'bb');

describe('@rocketh/deploy - strictBytecodeMatch', () => {
	describe('the default: metadata-only differences do NOT redeploy', () => {
		it('reuses the existing deployment when only the metadata changed', async () => {
			/**
			 * Example: you recompiled after editing a comment, and re-ran the script.
			 *
			 * Nothing about the contract's behaviour changed, so nothing is deployed: the
			 * saved deployment comes back with `newlyDeployed: false` at its original
			 * address.
			 */
			const {env, provider} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			const first = await _deploy('MetadataSensitiveContract', {
				account: 'deployer',
				artifact: FIRST_COMPILATION(),
				args: [42n],
			});
			expect(first.newlyDeployed).toBe(true);

			provider.clearRequests();

			const second = await _deploy('MetadataSensitiveContract', {
				account: 'deployer',
				artifact: SECOND_COMPILATION(),
				args: [42n],
			});

			expect(second.newlyDeployed).toBe(false);
			expect(second.address).toBe(first.address);
			// and it is not merely reported as reused: no transaction was sent
			expect(provider.getRequests().map((r) => r.method)).not.toContain('eth_sendTransaction');
		});
	});

	describe('the default: reading the metadata length correctly', () => {
		it('reuses when the two compilations produced metadata of DIFFERENT lengths', async () => {
			/**
			 * Metadata length is not a constant. It varies with what solc puts in the blob — an
			 * absolute source path is enough to change it — so two builds of the same contract on
			 * two machines can carry blobs of different sizes.
			 *
			 * Each side must therefore be stripped by ITS OWN declared length. Applying one
			 * side's length to both cuts at a different offset in each, leaves a fragment of one
			 * blob in the comparison, and reports a difference that does not exist — redeploying
			 * a contract, or upgrading a proxy, over nothing at all.
			 */
			const {env} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			const shortMetadata = createMockArtifact('VaryingMetadataContract');
			(shortMetadata as {deployedBytecode: string}).deployedBytecode = withMetadata('a1', 10);
			const longMetadata = createMockArtifact('VaryingMetadataContract');
			(longMetadata as {deployedBytecode: string}).deployedBytecode = withMetadata('b2', 14);

			const first = await _deploy('VaryingMetadataContract', {
				account: 'deployer',
				artifact: shortMetadata,
				args: [42n],
			});
			const second = await _deploy('VaryingMetadataContract', {
				account: 'deployer',
				artifact: longMetadata,
				args: [42n],
			});

			expect(first.newlyDeployed).toBe(true);
			expect(second.newlyDeployed).toBe(false);
			expect(second.address).toBe(first.address);
		});

		it('does NOT treat two different contracts as identical when the trailing bytes are not a real length', async () => {
			/**
			 * The failure mode that made this worth fixing.
			 *
			 * ANY bytecode ends in some two bytes, and reading them as a metadata length is only
			 * meaningful if a blob that size could be there. A short runtime bytecode (a stub, a
			 * minimal proxy, a test fixture) routinely ends in bytes that parse as tens of
			 * thousands. Stripping that many characters yields an EMPTY string — and then every
			 * such contract compares equal to every other one, so a genuinely CHANGED contract is
			 * skipped as already deployed and the new code never reaches the chain.
			 *
			 * The two artifacts below have different runtime code AND different creation code.
			 * They must not be confused for each other.
			 */
			const {env} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			// '4052' as a length claims 16466 bytes of metadata on a 5-byte runtime bytecode
			const stubby = createMockArtifact('StubbyContract');
			(stubby as {deployedBytecode: string}).deployedBytecode = '0x6080604052';
			(stubby as {bytecode: string}).bytecode = '0x6080604052348015600f57600080fd5baa';

			const differentStubby = createMockArtifact('StubbyContract');
			(differentStubby as {deployedBytecode: string}).deployedBytecode = '0x6080604053';
			(differentStubby as {bytecode: string}).bytecode = '0x6080604052348015600f57600080fd5bbb';

			const first = await _deploy('StubbyContract', {account: 'deployer', artifact: stubby, args: [42n]});
			const second = await _deploy('StubbyContract', {
				account: 'deployer',
				artifact: differentStubby,
				args: [42n],
			});

			expect(first.newlyDeployed).toBe(true);
			expect(second.newlyDeployed).toBe(true);
			expect(second.address).not.toBe(first.address);
		});

		it('still reuses an unchanged contract whose trailing bytes are not a real length', async () => {
			/** The other half: falling back must not mean "always redeploy". */
			const {env} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			const stubby = () => {
				const artifact = createMockArtifact('UnchangedStubbyContract');
				(artifact as {deployedBytecode: string}).deployedBytecode = '0x6080604052';
				return artifact;
			};

			const first = await _deploy('UnchangedStubbyContract', {
				account: 'deployer',
				artifact: stubby(),
				args: [42n],
			});
			const second = await _deploy('UnchangedStubbyContract', {
				account: 'deployer',
				artifact: stubby(),
				args: [42n],
			});

			expect(first.newlyDeployed).toBe(true);
			expect(second.newlyDeployed).toBe(false);
		});
	});

	describe('strictBytecodeMatch: true - the bytes must match exactly', () => {
		it('redeploys when only the metadata changed', async () => {
			/**
			 * Example: a verification or attestation flow pins the metadata hash, so a
			 * metadata-only difference genuinely is a different artifact to you.
			 *
			 * The SAME pair of artifacts that was reused above now redeploys. That pairing is
			 * the point of these two tests: the only thing that changed is the option.
			 */
			const {env, provider} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			const first = await _deploy(
				'MetadataSensitiveContract',
				{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
				{strictBytecodeMatch: true},
			);
			expect(first.newlyDeployed).toBe(true);

			provider.clearRequests();

			const second = await _deploy(
				'MetadataSensitiveContract',
				{account: 'deployer', artifact: SECOND_COMPILATION(), args: [42n]},
				{strictBytecodeMatch: true},
			);

			expect(second.newlyDeployed).toBe(true);
			expect(second.address).not.toBe(first.address);
			expect(provider.getRequests().map((r) => r.method)).toContain('eth_sendTransaction');
		});

		it('still reuses an IDENTICAL artifact', async () => {
			/**
			 * The other half: strict does not mean "always redeploy". Recompiling nothing at
			 * all still reuses, so turning the option on does not cost you idempotency.
			 */
			const {env} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			const first = await _deploy(
				'MetadataSensitiveContract',
				{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
				{strictBytecodeMatch: true},
			);
			const second = await _deploy(
				'MetadataSensitiveContract',
				{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
				{strictBytecodeMatch: true},
			);

			expect(first.newlyDeployed).toBe(true);
			expect(second.newlyDeployed).toBe(false);
			expect(second.address).toBe(first.address);
		});
	});

	describe('how it interacts with the other two redeploy options', () => {
		it('is not consulted at all under skipIfAlreadyDeployed', async () => {
			/**
			 * `skipIfAlreadyDeployed` answers the question before the comparison happens, so
			 * even a strict comparison of two genuinely different artifacts never runs.
			 */
			const {env} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			const first = await _deploy(
				'MetadataSensitiveContract',
				{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
				{strictBytecodeMatch: true},
			);
			const second = await _deploy(
				'MetadataSensitiveContract',
				{account: 'deployer', artifact: SECOND_COMPILATION(), args: [42n]},
				{skipIfAlreadyDeployed: true},
			);

			expect(second.newlyDeployed).toBe(false);
			expect(second.address).toBe(first.address);
		});

		it('rejects alwaysOverride combined with skipIfAlreadyDeployed', async () => {
			/**
			 * The two contradict each other outright, so the run fails rather than picking a
			 * winner silently.
			 */
			const {env} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);

			await expect(
				_deploy(
					'MetadataSensitiveContract',
					{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
					{alwaysOverride: true, skipIfAlreadyDeployed: true},
				),
			).rejects.toThrow(/conflicting options/);
		});
	});
});
