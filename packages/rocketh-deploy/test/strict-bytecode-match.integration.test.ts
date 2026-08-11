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
function withMetadata(metadataByte: string): `0x${string}` {
	const blob = metadataByte.repeat(10); // 10 bytes of "metadata"
	return `${RUNTIME_CODE}${blob}000c` as `0x${string}`;
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
