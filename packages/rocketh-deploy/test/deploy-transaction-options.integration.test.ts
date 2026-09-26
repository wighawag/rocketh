/**
 * Integration Tests for @rocketh/deploy - Transaction options on a deployment
 *
 * `deploy`'s construction argument is typed as viem's `DeployContractParameters` (minus
 * `bytecode`, `account`, `abi` and `chain`), so the TYPE accepts every transaction option viem
 * does. These tests document the rule rocketh applies to each of them: an option the type accepts
 * is either put on the transaction, or refused loudly at the call. It is never silently dropped.
 *
 * - `nonce` is honoured, including `nonce: 0` (the first transaction of a fresh account).
 * - `type` is honoured for `'eip1559'` (the default) and `'legacy'`, and refused otherwise. The
 *   legacy side, `gasPrice` and chains declared legacy, is documented in
 *   `legacy-transactions.integration.test.ts`.
 * - The EIP-4844 blob fields and the EIP-7702 `authorizationList` are refused: neither
 *   transaction type can create a contract.
 * - `dataSuffix` is refused: on a deployment it would become part of the init code.
 *
 * They run against `createTestEnvironment`, a REAL rocketh environment wired to a mock EIP-1193
 * provider, so the transaction inspected below is the one production's single
 * `broadcastTransaction` choke point actually dispatched.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

/** An address the mock node lists in `eth_accounts`, so the deployer is signable. */
const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;

type TestProvider = Awaited<ReturnType<typeof createTestEnvironment>>['provider'];

/** The transaction object passed to the last `eth_sendTransaction` the mock provider recorded. */
function getLastDispatchedTransaction(provider: TestProvider): Record<string, unknown> | undefined {
	const sendRequest = [...provider.getRequests()].reverse().find((r) => r.method === 'eth_sendTransaction');
	return sendRequest?.params?.[0] as Record<string, unknown> | undefined;
}

function countDispatchedTransactions(provider: TestProvider): number {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction').length;
}

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: DEPLOYER},
		nodeAccounts: [DEPLOYER],
	});
	return {_deploy: deploy(env), provider};
}

describe('@rocketh/deploy - Transaction options', () => {
	describe('nonce', () => {
		it('should put an explicit nonce on the dispatched transaction', async () => {
			/**
			 * Example: pinning the nonce of a deployment, e.g. to replace a stuck transaction or to
			 * reproduce an address that depends on the deployer's nonce.
			 *
			 * ```typescript
			 * await deploy('Registry', {account: 'deployer', artifact: Registry, args: [], nonce: 7});
			 * ```
			 */
			const {_deploy, provider} = await setup();

			await _deploy('Pinned', {account: 'deployer', artifact: createMockArtifact('Pinned'), args: [42n], nonce: 7});

			expect(getLastDispatchedTransaction(provider)?.nonce).toBe('0x7');
		});

		it('should put nonce 0 on the wire rather than treating it as missing', async () => {
			/**
			 * `nonce: 0` is the first transaction of a fresh account, not an absent value, so it must
			 * reach the node as `0x0`.
			 */
			const {_deploy, provider} = await setup();

			await _deploy('First', {account: 'deployer', artifact: createMockArtifact('First'), args: [42n], nonce: 0});

			expect(getLastDispatchedTransaction(provider)?.nonce).toBe('0x0');
		});

		it('should leave the nonce to the signer when none is passed', async () => {
			const {_deploy, provider} = await setup();

			await _deploy('Unpinned', {account: 'deployer', artifact: createMockArtifact('Unpinned'), args: [42n]});

			expect(getLastDispatchedTransaction(provider)?.nonce).toBeUndefined();
		});
	});

	describe('type', () => {
		it('should accept type "eip1559", which is what a deployment is sent as', async () => {
			const {_deploy, provider} = await setup();

			await _deploy('Typed', {
				account: 'deployer',
				artifact: createMockArtifact('Typed'),
				args: [42n],
				type: 'eip1559',
			});

			expect(getLastDispatchedTransaction(provider)?.type).toBe('0x2');
		});

		it('should send type "legacy" as a legacy (type 0) transaction rather than refuse it', async () => {
			/**
			 * This used to be refused, when rocketh could only send EIP-1559. It is now honoured, for
			 * chains that reject EIP-1559: the node fills the gas price it was not given.
			 */
			const {_deploy, provider} = await setup();

			await _deploy('Legacy', {
				account: 'deployer',
				artifact: createMockArtifact('Legacy'),
				args: [42n],
				type: 'legacy',
			});

			expect(countDispatchedTransactions(provider)).toBe(1);
			const sent = getLastDispatchedTransaction(provider);
			expect(sent?.type).toBe('0x0');
			expect(sent?.maxFeePerGas).toBeUndefined();
		});

		it('should refuse any other type instead of sending an EIP-1559 transaction anyway', async () => {
			const {_deploy, provider} = await setup();

			await expect(
				_deploy('AccessListed', {
					account: 'deployer',
					artifact: createMockArtifact('AccessListed'),
					args: [42n],
					type: 'eip2930',
				} as never),
			).rejects.toThrow(/"type: eip2930" is not supported.*remove `type`/);
			expect(countDispatchedTransactions(provider)).toBe(0);
		});
	});

	describe('options a deployment cannot carry', () => {
		it('should refuse an EIP-7702 authorizationList', async () => {
			const {_deploy, provider} = await setup();

			await expect(
				_deploy('Delegating', {
					account: 'deployer',
					artifact: createMockArtifact('Delegating'),
					args: [42n],
					authorizationList: [],
				}),
			).rejects.toThrow(/"authorizationList".*cannot create a contract/);
			expect(countDispatchedTransactions(provider)).toBe(0);
		});

		it('should refuse EIP-4844 blob fields', async () => {
			const {_deploy, provider} = await setup();

			await expect(
				_deploy('Blobby', {
					account: 'deployer',
					artifact: createMockArtifact('Blobby'),
					args: [42n],
					blobs: ['0x01'],
				}),
			).rejects.toThrow(/"blobs".*cannot create a contract/);
			expect(countDispatchedTransactions(provider)).toBe(0);
		});

		it('should refuse dataSuffix rather than deploying without it', async () => {
			const {_deploy, provider} = await setup();

			await expect(
				_deploy('Suffixed', {
					account: 'deployer',
					artifact: createMockArtifact('Suffixed'),
					args: [42n],
					dataSuffix: '0xdeadbeef',
				}),
			).rejects.toThrow(/"dataSuffix" is not supported.*constructor argument/);
			expect(countDispatchedTransactions(provider)).toBe(0);
		});

		it('should refuse even when the deployment would be reused, so the answer does not depend on state', async () => {
			/**
			 * A refused option is refused at the call. It does not pass on the run where the contract
			 * already exists and fail on the run where it does not.
			 */
			const {_deploy} = await setup();
			const artifact = createMockArtifact('Reused');
			await _deploy('Reused', {account: 'deployer', artifact, args: [42n]});

			await expect(
				_deploy(
					'Reused',
					{account: 'deployer', artifact, args: [42n], dataSuffix: '0xdeadbeef'},
					{skipIfAlreadyDeployed: true},
				),
			).rejects.toThrow(/"dataSuffix" is not supported/);
		});
	});
});
