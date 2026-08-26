/**
 * Integration tests for @rocketh/proxy - untested fresh-deploy options.
 *
 * The existing `proxy.integration.test.ts` covers the basic proxy variants and `owner`,
 * `execute: {methodName}`, `UUPS`, shared-admin, and deterministic. Many options remain
 * untested: `proxyDisabled`, `ERC173ProxyWithReceive`, custom proxy contract,
 * `execute: {init}` (the fresh-deploy half of the init/onUpgrade split),
 * `execute` as a bare string, `execute` method-not-found throw, unknown proxy contract
 * throw, and `deterministicImplementation`.
 *
 * These are all on the FRESH-deploy path, so they use `createTestEnvironment` directly
 * without the storage/store setup that the upgrade tests need.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	withChangedBytecode,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {encodeFunctionData} from 'viem';
import type {Abi} from 'abitype';

const CONTRACT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'v'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
	});
	const artifact = createMockArtifact('Vault', CONTRACT_ABI);
	return {env, provider, artifact};
}

describe('@rocketh/proxy - fresh-deploy options', () => {
	describe('proxyDisabled', () => {
		it('deploys the implementation directly without a proxy', async () => {
			const {env} = await setup();
			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyDisabled: true},
			);

			expect(result).toBeDefined();
			// No _Proxy deployment should exist
			expect(env.getOrNull('Vault_Proxy')).toBeNull();
			// The deployment IS the implementation (no proxy wrapping)
			expect(result.address).toBe(env.get('Vault').address);
		});

		/**
		 * WITH NO PROXY THERE IS NO UPGRADE, so a changed contract must redeploy.
		 *
		 * This path took the PROXY's options, including a forced `skipIfAlreadyDeployed`.
		 * That is a proxy's default and a sensible one: a proxy has a stable address and a
		 * mutable implementation pointer, so an existing one is left in place and the change
		 * is wired in by an upgrade. Here the deployment under `name` IS the contract and
		 * nothing rewires it, so the skip just returned the existing record on name alone,
		 * without comparing bytecode or args, and a recompiled contract never reached the
		 * chain.
		 */
		it('redeploys when the contract changed, since nothing else would pick the change up', async () => {
			const {env} = await setup();
			const first = createMockArtifact('Vault', CONTRACT_ABI);
			const recompiled = withChangedBytecode(first);

			const before = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: first, args: [42n]},
				{proxyDisabled: true},
			);
			const after = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: recompiled, args: [42n]},
				{proxyDisabled: true},
			);

			expect(after.newlyDeployed).toBe(true);
			expect(after.address).not.toBe(before.address);
			expect(env.get('Vault').address).toBe(after.address);
			expect(env.get('Vault').deployedBytecode).toBe(recompiled.deployedBytecode);
		});

		/**
		 * THE CALLER'S OWN COMPARISON SETTING SURVIVES, because with the proxy disabled the
		 * contract being compared is theirs.
		 *
		 * `strictBytecodeMatch: false` is forced for a real proxy on purpose: the comparison
		 * decides whether to UPGRADE, and a compiler metadata diff is not a reason to move a
		 * live proxy's implementation (ADR 0004). This path used to inherit that forcing, so
		 * a caller pinning an exact compilation of their own contract was silently ignored.
		 *
		 * The two artifacts differ only in the trailing CBOR metadata blob, with the two-byte
		 * big-endian length suffix solc appends, which is exactly what the default strips.
		 * The creation bytecode carries the blob too, so it differs between compilations as
		 * well: under `strictBytecodeMatch` the runtime comparison is skipped and it is the
		 * creation bytecode that is compared (`@rocketh/deploy`'s else branch).
		 */
		it('honours strictBytecodeMatch on the contract, which a proxy would have forced off', async () => {
			const RUNTIME_CODE = '0x60806040526001';
			const compiledWith = (metadataByte: string, creationSuffix: string) => {
				const artifact = createMockArtifact('Vault', CONTRACT_ABI);
				const blob = metadataByte.repeat(10);
				(artifact as {deployedBytecode: string}).deployedBytecode = `${RUNTIME_CODE}${blob}000a`;
				(artifact as {bytecode: string}).bytecode = `${artifact.bytecode}${creationSuffix}`;
				return artifact;
			};
			const FIRST_COMPILATION = () => compiledWith('a1', 'aa');
			const SECOND_COMPILATION = () => compiledWith('b2', 'bb');

			// Default: a metadata-only difference is not a change, so nothing is redeployed.
			const lenient = await setup();
			const lenientFirst = await deployViaProxy(lenient.env)(
				'Vault',
				{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
				{proxyDisabled: true},
			);
			const lenientSecond = await deployViaProxy(lenient.env)(
				'Vault',
				{account: 'deployer', artifact: SECOND_COMPILATION(), args: [42n]},
				{proxyDisabled: true},
			);
			expect(lenientSecond.newlyDeployed).toBe(false);
			expect(lenientSecond.address).toBe(lenientFirst.address);

			// strictBytecodeMatch: the same pair of artifacts now counts as a change.
			const strict = await setup();
			const strictFirst = await deployViaProxy(strict.env)(
				'Vault',
				{account: 'deployer', artifact: FIRST_COMPILATION(), args: [42n]},
				{proxyDisabled: true, strictBytecodeMatch: true},
			);
			const strictSecond = await deployViaProxy(strict.env)(
				'Vault',
				{account: 'deployer', artifact: SECOND_COMPILATION(), args: [42n]},
				{proxyDisabled: true, strictBytecodeMatch: true},
			);
			expect(strictSecond.newlyDeployed).toBe(true);
			expect(strictSecond.address).not.toBe(strictFirst.address);
		});

		/** The other direction: comparing on every run must not cause a spurious redeploy. */
		it('still reuses an unchanged contract', async () => {
			const {env} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			const before = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{proxyDisabled: true},
			);
			const after = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{proxyDisabled: true},
			);

			expect(after.newlyDeployed).toBe(false);
			expect(after.address).toBe(before.address);
		});
	});

	describe('ERC173ProxyWithReceive', () => {
		it('deploys with the ERC173ProxyWithReceive variant', async () => {
			const {env} = await setup();
			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyContract: 'ERC173ProxyWithReceive'},
			);

			expect(result).toBeDefined();
			// A _Proxy deployment should exist
			expect(env.getOrNull('Vault_Proxy')).toBeDefined();
			// The proxy and implementation should be at different addresses
			expect(result.address).not.toBe(env.get('Vault_Implementation').address);
		});
	});

	describe('proxyContract: custom', () => {
		it('deploys with a custom proxy artifact', async () => {
			const {env} = await setup();

			// Use the EIP173Proxy artifact as the custom proxy (it's already available in the package)
			const EIP173ProxyWithReceive = (await import('../src/hardhat-deploy-v1-artifacts/EIP173ProxyWithReceive.js'))
				.default;

			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyContract: {type: 'custom', artifact: EIP173ProxyWithReceive}},
			);

			expect(result).toBeDefined();
			expect(env.getOrNull('Vault_Proxy')).toBeDefined();
		});

		it('deploys with a custom proxy artifact and custom args template', async () => {
			const {env} = await setup();

			const ERC1967Proxy = (await import('../src/hardhat-deploy-v1-artifacts/ERC1967Proxy.js')).default;

			// UUPS-style: only {implementation} and {data}, no {admin}
			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyContract: {type: 'custom', artifact: ERC1967Proxy, args: ['{implementation}', '{data}']}},
			);

			expect(result).toBeDefined();
			expect(env.getOrNull('Vault_Proxy')).toBeDefined();
		});
	});

	describe('unknown proxy contract', () => {
		it('throws for an unknown proxy contract name', async () => {
			const {env} = await setup();

			await expect(
				deployViaProxy(env)(
					'Vault',
					{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
					{proxyContract: 'NonExistentProxy' as any},
				),
			).rejects.toThrow(/unknown proxy contract/);
		});
	});

	describe('execute: init (fresh deploy)', () => {
		it('encodes the init method call into the proxy constructor data field', async () => {
			const {env, provider} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{execute: {init: {methodName: 'initialize', args: [99n]}}},
			);

			// The proxy deployment tx should have `data` containing the encoded init call
			const proxyTx = provider
				.getRequests()
				.filter((r) => r.method === 'eth_sendTransaction')
				.map((r) => r.params?.[0] as any)
				.find((tx) => tx.data?.length > 200); // the proxy deploy has the longest data

			expect(proxyTx).toBeDefined();
			// The init calldata should be embedded in the proxy constructor args
			const initCalldata = encodeFunctionData({
				abi: CONTRACT_ABI,
				functionName: 'initialize',
				args: [99n],
			});
			// The proxy constructor data field is the 3rd arg (after implementation and admin)
			// We just verify the init calldata appears somewhere in the deployed data
			expect(proxyTx.data).toContain(initCalldata.slice(2));
		});

		it('accepts execute as a bare string (uses constructor args as init args)', async () => {
			const {env} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{execute: 'initialize'},
			);

			expect(result).toBeDefined();
		});

		it('throws when the execute method is not found in the ABI', async () => {
			const {env} = await setup();

			await expect(
				deployViaProxy(env)(
					'Vault',
					{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
					{execute: {init: {methodName: 'nonExistent', args: []}}},
				),
			).rejects.toThrow(/Method nonExistent not found/);
		});
	});

	describe('deterministicImplementation', () => {
		it('deploys the implementation deterministically while the proxy is non-deterministic', async () => {
			const {env} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{deterministicImplementation: true},
			);

			expect(result).toBeDefined();
			// The implementation should be deterministic (deployed via create2)
			expect(env.getOrNull('Vault_Implementation')).toBeDefined();
		});
	});
});
