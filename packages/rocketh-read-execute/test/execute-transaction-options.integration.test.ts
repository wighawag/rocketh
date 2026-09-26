/**
 * Integration tests for @rocketh/read-execute - transaction options on `execute`
 *
 * `execute`'s argument is typed as viem's `WriteContractParameters` (minus `address`, `abi`,
 * `account` and `chain`), so the TYPE accepts every transaction option viem does. These tests
 * document the rule rocketh applies to each of them, the same one `@rocketh/deploy` applies: an
 * option the type accepts is either put on the transaction, or refused loudly at the call. It is
 * never silently dropped.
 *
 * - `dataSuffix` is honoured: appended to the calldata, as viem's `writeContract` does.
 * - `type` is honoured for `'eip1559'` (the default) and `'legacy'`, and refused otherwise (so
 *   `'eip2930'` is refused). The legacy side is documented in `legacy-transactions.integration.test.ts`.
 * - The EIP-4844 blob fields and the EIP-7702 `authorizationList` are refused: the transaction
 *   rocketh sends is an EIP-1559 or a legacy one and can carry neither.
 *
 * They run against `createTestEnvironment`, a REAL rocketh environment wired to a mock EIP-1193
 * provider, so the transaction inspected below is the one the broadcast choke point dispatched.
 */

import {describe, it, expect} from 'vitest';
import {encodeFunctionData} from 'viem';
import type {Abi} from 'abitype';
import {execute, executeByName} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
const CONTRACT_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;

const ABI = [
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: 'value'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT},
		nodeAccounts: [NODE_ACCOUNT],
	});
	const deployment = await env.save('TestContract', {
		address: CONTRACT_ADDRESS,
		...createMockArtifact('TestContract', ABI),
		argsData: '0x',
	});
	return {env, provider, deployment};
}

type TestProvider = Awaited<ReturnType<typeof setup>>['provider'];

function dispatchedTransactions(provider: TestProvider): Record<string, unknown>[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => r.params?.[0] as Record<string, unknown>);
}

const SET_VALUE_42 = encodeFunctionData({abi: ABI, functionName: 'setValue', args: [42n]});

describe('@rocketh/read-execute - transaction options on execute', () => {
	describe('dataSuffix', () => {
		it('should append the suffix to the calldata', async () => {
			/**
			 * Example: tagging a call with an attribution suffix the contract ignores.
			 *
			 * ```typescript
			 * await execute(registry, {account: 'deployer', functionName: 'setValue', args: [42n], dataSuffix: '0xcafe'});
			 * ```
			 */
			const {env, provider, deployment} = await setup();

			await execute(env)(deployment, {
				account: 'deployer',
				functionName: 'setValue',
				args: [42n],
				dataSuffix: '0xcafebabe',
			});

			expect(dispatchedTransactions(provider).at(-1)?.data).toBe(`${SET_VALUE_42}cafebabe`);
		});

		it('should leave the calldata alone without a suffix', async () => {
			const {env, provider, deployment} = await setup();

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});

			expect(dispatchedTransactions(provider).at(-1)?.data).toBe(SET_VALUE_42);
		});
	});

	describe('type', () => {
		it('should accept type "eip1559", which is what rocketh sends', async () => {
			const {env, provider, deployment} = await setup();

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n], type: 'eip1559'});

			expect(dispatchedTransactions(provider).at(-1)?.type).toBe('0x2');
		});

		it('should refuse any other type instead of sending an EIP-1559 transaction anyway', async () => {
			const {env, provider, deployment} = await setup();

			await expect(
				execute(env)(deployment, {
					account: 'deployer',
					functionName: 'setValue',
					args: [42n],
					type: 'eip2930',
				} as never),
			).rejects.toThrow(/execute "setValue": "type: eip2930" is not supported/);
			expect(dispatchedTransactions(provider)).toEqual([]);
		});
	});

	describe('options the sent transaction cannot carry', () => {
		it('should refuse an EIP-7702 authorizationList', async () => {
			const {env, provider, deployment} = await setup();

			await expect(
				execute(env)(deployment, {
					account: 'deployer',
					functionName: 'setValue',
					args: [42n],
					authorizationList: [],
				} as never),
			).rejects.toThrow(/"authorizationList" is not supported/);
			expect(dispatchedTransactions(provider)).toEqual([]);
		});

		it.each(['blobs', 'blobVersionedHashes', 'kzg', 'sidecars', 'maxFeePerBlobGas'])(
			'should refuse the blob field %s',
			async (field) => {
				const {env, provider, deployment} = await setup();

				await expect(
					execute(env)(deployment, {
						account: 'deployer',
						functionName: 'setValue',
						args: [42n],
						[field]: field === 'maxFeePerBlobGas' ? 1n : [],
					} as never),
				).rejects.toThrow(new RegExp(`"${field}" is not supported`));
				expect(dispatchedTransactions(provider)).toEqual([]);
			},
		);

		it('should refuse through executeByName too', async () => {
			const {env} = await setup();

			await expect(
				executeByName(env)('TestContract', {
					account: 'deployer',
					functionName: 'setValue',
					args: [42n],
					authorizationList: [],
				} as never),
			).rejects.toThrow(/"authorizationList" is not supported/);
		});
	});
});
