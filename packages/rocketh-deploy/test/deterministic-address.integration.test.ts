/**
 * Integration tests for `computeDeterministicAddress`: learning the address a deterministic
 * deployment WILL land on, without deploying it.
 *
 * This is the rocketh answer to hardhat-deploy v1's `deployments.deterministic(name, options)`.
 * The pattern it exists for has no other workaround: two contracts that must each know the
 * other's address. Deterministic deployment makes an address known in advance, but only if the
 * script can READ that address before it broadcasts anything; otherwise the script is back to
 * sequencing deployments, which is what deterministic deployment exists to avoid.
 *
 * What every test here pins, beyond the address itself, is that the preview SENDS NOTHING: no
 * `eth_sendTransaction`, no `eth_sendRawTransaction`. That matters because `deploy` itself
 * funds and deploys the deterministic factories when a chain lacks them, and a preview that
 * deployed a factory would not be a preview.
 */

import {describe, it, expect} from 'vitest';
import {computeDeterministicAddress, deploy} from '../src/index.js';
import {
	createTestEnvironment,
	createNodeHeldEnvironment,
	createMockArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
	type MockProvider,
} from '@rocketh/test-utils';
import type {Abi} from 'abitype';
import {zeroHash} from 'viem';

/** A contract whose constructor takes the address of its counterpart. */
const KNOWS_ANOTHER_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'other'}], stateMutability: 'nonpayable'},
] as const satisfies Abi;

const TOKEN_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'v'}], stateMutability: 'nonpayable'},
] as const satisfies Abi;

const SEND_METHODS = ['eth_sendTransaction', 'eth_sendRawTransaction'];

/** Every transaction the provider was asked to send, signed or not. */
function sends(provider: MockProvider) {
	return provider.getRequests().filter((r) => SEND_METHODS.includes(r.method));
}

describe('@rocketh/deploy - computeDeterministicAddress', () => {
	describe('create2', () => {
		it('gives the address a create2 deploy will land on, without touching the network', async () => {
			/**
			 * Example: learning a create2 address before deploying
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * import {computeDeterministicAddress} from '@rocketh/deploy';
			 *
			 * const {address} = await env.computeDeterministicAddress(artifacts.Token, [1n], {
			 *   account: 'deployer',
			 *   deterministic: {type: 'create2', salt: '0x11...'},
			 * });
			 * ```
			 *
			 * A create2 address is a pure function of the factory address (chain config), the
			 * salt and the creation code (bytecode + encoded constructor arguments), so the
			 * preview makes NO provider request at all, not even a read.
			 */
			const {env, provider} = await createNodeHeldEnvironment();
			const artifact = createMockArtifact('Token', TOKEN_ABI);
			const salt = ('0x' + '11'.repeat(32)) as `0x${string}`;

			provider.clearRequests();
			const preview = await computeDeterministicAddress(env)(artifact, [1n], {
				account: 'deployer',
				deterministic: {type: 'create2', salt},
			});
			expect(provider.getRequests()).toEqual([]);
			expect(preview.type).toBe('create2');

			// The real deploy, with the same inputs, lands exactly there.
			const deployment = await deploy(env)(
				'Token',
				{account: 'deployer', artifact, args: [1n]},
				{deterministic: {type: 'create2', salt}},
			);
			expect(deployment.newlyDeployed).toBe(true);
			expect(deployment.address).toBe(preview.address);
		});

		it('normalises the salt exactly as deploy does', async () => {
			/**
			 * `deterministic: true` means the zero salt, and a hex salt shorter than 32 bytes is
			 * LEFT-padded with zeros, so `'0x1234'` is the salt `0x00…001234`. The preview and
			 * `deploy` share one normalisation, so the same spelling always means the same salt.
			 */
			const {env} = await createNodeHeldEnvironment();
			const artifact = createMockArtifact('Token', TOKEN_ABI);
			const compute = computeDeterministicAddress(env);
			const account = 'deployer';

			const fromTrue = await compute(artifact, [1n], {account, deterministic: true});
			const fromZero = await compute(artifact, [1n], {account, deterministic: {type: 'create2', salt: zeroHash}});
			expect(fromTrue.address).toBe(fromZero.address);

			const fromShort = await compute(artifact, [1n], {account, deterministic: '0x1234'});
			const fromPadded = await compute(artifact, [1n], {
				account,
				deterministic: `0x${'1234'.padStart(64, '0')}`,
			});
			expect(fromShort.address).toBe(fromPadded.address);
			expect(fromShort.address).not.toBe(fromTrue.address);

			// And deploy reads the short spelling the same way.
			const deployment = await deploy(env)('Token', {account, artifact, args: [1n]}, {deterministic: '0x1234'});
			expect(deployment.address).toBe(fromShort.address);
		});

		it('depends on the constructor arguments, as the creation code does', async () => {
			/**
			 * The constructor arguments are part of the create2 creation code, so they change
			 * the address. This is why the preview takes them: an address computed without them
			 * would not be the address `deploy` lands on.
			 */
			const {env} = await createNodeHeldEnvironment();
			const artifact = createMockArtifact('Token', TOKEN_ABI);
			const compute = computeDeterministicAddress(env);

			const one = await compute(artifact, [1n], {account: 'deployer', deterministic: true});
			const two = await compute(artifact, [2n], {account: 'deployer', deterministic: true});
			expect(one.address).not.toBe(two.address);
		});
	});

	describe('create3', () => {
		it('gives the address a create3 deploy will land on, reading at most the code there', async () => {
			/**
			 * A create3 address depends on the deployer and the salt only, so it too is known
			 * without the network. The preview spends ONE read, `eth_getCode` at the computed
			 * address, to report whether that address is already `occupied`; it never sends,
			 * even though neither deterministic factory exists on this chain yet and the real
			 * deploy below has to deploy both.
			 */
			const {env, provider} = await createNodeHeldEnvironment();
			const artifact = createMockArtifact('Token', TOKEN_ABI);
			const salt = ('0x' + '22'.repeat(32)) as `0x${string}`;

			provider.clearRequests();
			const preview = await computeDeterministicAddress(env)(artifact, [1n], {
				account: 'deployer',
				deterministic: {type: 'create3', salt},
			});
			expect(sends(provider)).toEqual([]);
			expect(provider.getRequests().map((r) => r.method)).toEqual(['eth_getCode']);
			expect(provider.getRequests()[0].params?.[0]).toBe(preview.address);
			expect(preview).toEqual({type: 'create3', address: preview.address, occupied: false});

			const deployment = await deploy(env)(
				'Token',
				{account: 'deployer', artifact, args: [1n]},
				{deterministic: {type: 'create3', salt}},
			);
			expect(sends(provider).length).toBeGreaterThan(0);
			expect(deployment.newlyDeployed).toBe(true);
			expect(deployment.address).toBe(preview.address);
		});

		it('reports an address that already holds code as occupied', async () => {
			/**
			 * `occupied: true` says only that the address already holds code. It does NOT say
			 * whose: a create3 address ignores the bytecode, so the code there may be this
			 * contract (deployed by an earlier run) or another contract deployed from the same
			 * account with the same salt. `deploy` tells the two apart: it records the first as
			 * already deployed and refuses the second. The preview leaves that judgement to it.
			 */
			const occupiedCode = '0x6080604052';
			const {env, provider} = await createTestEnvironment({
				accounts: STANDARD_NAMED_ACCOUNTS,
				nodeAccounts: NODE_HELD_ACCOUNTS,
				providerConfig: {responses: {eth_getCode: () => occupiedCode}},
			});
			const artifact = createMockArtifact('Token', TOKEN_ABI);

			provider.clearRequests();
			const preview = await computeDeterministicAddress(env)(artifact, [1n], {
				account: 'deployer',
				deterministic: {type: 'create3', salt: '0x22'},
			});
			expect(preview).toEqual({type: 'create3', address: preview.address, occupied: true});
			expect(sends(provider)).toEqual([]);
		});

		it('depends on the deployer, not on the bytecode or the arguments', async () => {
			/**
			 * The create3 factory namespaces the salt by the calling account, so the same salt
			 * gives each account its own address, and the account is a required input of the
			 * preview for that reason. The bytecode and constructor arguments do not enter the
			 * address at all.
			 */
			const {env} = await createNodeHeldEnvironment();
			const compute = computeDeterministicAddress(env);
			const deterministic = {type: 'create3', salt: '0x33'} as const;

			const tokenOne = await compute(createMockArtifact('Token', TOKEN_ABI), [1n], {
				account: 'deployer',
				deterministic,
			});
			const tokenTwo = await compute(createMockArtifact('Other', TOKEN_ABI), [2n], {
				account: 'deployer',
				deterministic,
			});
			const fromAnotherAccount = await compute(createMockArtifact('Token', TOKEN_ABI), [1n], {
				account: 'user1',
				deterministic,
			});
			expect(tokenTwo.address).toBe(tokenOne.address);
			expect(fromAnotherAccount.address).not.toBe(tokenOne.address);
		});

		it('refuses a create3 configuration that contradicts itself, without sending', async () => {
			/**
			 * The configured create3 factory address must be the one its own bytecode and salt
			 * produce through the create2 factory. `deploy` refuses a configuration that says
			 * otherwise, and the preview refuses it the same way, because an address computed
			 * from a factory that is not where the config says would be a wrong answer.
			 */
			const {env, provider} = await createTestEnvironment({
				accounts: STANDARD_NAMED_ACCOUNTS,
				nodeAccounts: NODE_HELD_ACCOUNTS,
				config: {
					chains: {
						31337: {
							deterministicDeployment: {
								create3: {
									factory: ('0x' + 'dd'.repeat(20)) as `0x${string}`,
									salt: zeroHash,
									bytecode: '0x6080604052348015600f57600080fd5b50',
									proxyBytecode: '0x67363d3d37363d34f03d5260086018f3',
								},
							},
						},
					},
				},
			});

			await expect(
				computeDeterministicAddress(env)(createMockArtifact('Token', TOKEN_ABI), [1n], {
					account: 'deployer',
					deterministic: {type: 'create3', salt: '0x22'},
				}),
			).rejects.toThrow(/is not the expected address/);
			expect(sends(provider)).toEqual([]);
		});
	});

	describe('Two contracts that must know each other', () => {
		it('hands a create2 address to another constructor before deploying it', async () => {
			/**
			 * Example: B needs A's address, and A is deployed deterministically
			 *
			 * ```typescript
			 * const {address: a} = await env.computeDeterministicAddress(artifacts.A, [], {
			 *   account: 'deployer',
			 *   deterministic: true,
			 * });
			 * await env.deploy('B', {account: 'deployer', artifact: artifacts.B, args: [a]});
			 * await env.deploy('A', {account: 'deployer', artifact: artifacts.A, args: []}, {deterministic: true});
			 * ```
			 *
			 * With create2, A's own constructor arguments are part of its address, so A cannot
			 * take B's address in return. When BOTH must know the other, use create3 (next test).
			 */
			const {env, provider} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);
			const artifactA = createMockArtifact('A', TOKEN_ABI);
			const artifactB = createMockArtifact('B', KNOWS_ANOTHER_ABI);

			const {address: addressOfA} = await computeDeterministicAddress(env)(artifactA, [7n], {
				account: 'deployer',
				deterministic: true,
			});
			expect(sends(provider)).toEqual([]);

			const b = await _deploy('B', {account: 'deployer', artifact: artifactB, args: [addressOfA]});
			const a = await _deploy('A', {account: 'deployer', artifact: artifactA, args: [7n]}, {deterministic: true});

			expect(a.address).toBe(addressOfA);
			expect(b.argsData.toLowerCase()).toContain(addressOfA.slice(2).toLowerCase());
		});

		it('wires two contracts to each other with create3', async () => {
			/**
			 * Example: A and B each take the other's address in their constructor
			 *
			 * ```typescript
			 * const {address: a} = await env.computeDeterministicAddress(artifacts.A, [], {
			 *   account: 'deployer',
			 *   deterministic: {type: 'create3', salt: '0xa1'},
			 * });
			 * const b = await env.deploy('B', {account: 'deployer', artifact: artifacts.B, args: [a]});
			 * await env.deploy(
			 *   'A',
			 *   {account: 'deployer', artifact: artifacts.A, args: [b.address]},
			 *   {deterministic: {type: 'create3', salt: '0xa1'}},
			 * );
			 * ```
			 *
			 * A create3 address ignores the creation code, so A's address can be known before
			 * A's constructor arguments are, which is what lets A receive B's address. The
			 * arguments passed to the preview do not affect a create3 address; they are still
			 * taken so the call reads the same for both kinds.
			 */
			const {env, provider} = await createNodeHeldEnvironment();
			const _deploy = deploy(env);
			const artifactA = createMockArtifact('A', KNOWS_ANOTHER_ABI);
			const artifactB = createMockArtifact('B', KNOWS_ANOTHER_ABI);
			const deterministic = {type: 'create3', salt: '0xa1'} as const;

			const placeholder = '0x0000000000000000000000000000000000000000';
			const previewOfA = await computeDeterministicAddress(env)(artifactA, [placeholder], {
				account: 'deployer',
				deterministic,
			});
			expect(previewOfA.occupied).toBe(false);
			expect(sends(provider)).toEqual([]);

			const b = await _deploy('B', {account: 'deployer', artifact: artifactB, args: [previewOfA.address]});
			const a = await _deploy('A', {account: 'deployer', artifact: artifactA, args: [b.address]}, {deterministic});

			expect(a.address).toBe(previewOfA.address);
			expect(b.argsData.toLowerCase()).toContain(previewOfA.address.slice(2).toLowerCase());
			expect(a.argsData.toLowerCase()).toContain(b.address.slice(2).toLowerCase());
		});
	});
});
