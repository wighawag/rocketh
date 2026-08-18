/**
 * Integration tests for the DETERMINISTIC FACTORIES themselves, rather than for what is
 * deployed through them.
 *
 * Every address a deterministic deploy computes is derived from the assumption that the
 * configured factory address holds the factory the chain config describes. The factory
 * address, the pre-signed deployment transaction and the create3 bytecode are all
 * user-supplied chain configuration, and a chain can have anything at a given address, so
 * "there is code there" is not the same fact as "the factory is there". These tests pin the
 * checks that tell the two apart.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import type {Abi} from 'abitype';

const ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'v'}], stateMutability: 'nonpayable'},
] as const satisfies Abi;

/** The canonical create2 factory, and the runtime code its pre-signed transaction creates. */
const CREATE2_FACTORY = '0x4e59b44847b379578588920ca78fbf26c0b4956c';
const CREATE2_FACTORY_RUNTIME_CODE =
	'0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3';

function receipts() {
	let counter = 0;
	return {
		eth_getTransactionReceipt: () => {
			counter++;
			return {
				contractAddress: ('0x' + counter.toString(16).padStart(40, 'a')) as `0x${string}`,
				status: '0x1',
				blockNumber: '0x1',
				blockHash: `0x${'b'.repeat(64)}`,
				transactionHash: `0x${'c'.repeat(64)}`,
				gasUsed: '0x5208',
			};
		},
	};
}

/** eth_getCode answering with `factoryCode` for the create2 factory and '0x' everywhere else. */
function create2FactoryHolding(factoryCode: string) {
	return {
		eth_getCode: (params?: unknown[]) =>
			(params?.[0] as string)?.toLowerCase() === CREATE2_FACTORY ? factoryCode : '0x',
	};
}

describe('@rocketh/deploy - create2 factory identity', () => {
	it('refuses to deploy through an address holding code that is not the configured factory', async () => {
		/**
		 * The failure this prevents is silent, which is why it is worth a check. A contract
		 * that is not the create2 proxy will not create anything at the address rocketh
		 * computed, so the deployment record would name an address that either holds nothing
		 * or holds someone else's contract, and the export would hand that address to a
		 * frontend.
		 */
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: {...receipts(), ...create2FactoryHolding('0x6080604052348015600f57600080fd')}},
		});

		await expect(
			deploy(env)(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create2', salt: ('0x' + '11'.repeat(32)) as `0x${string}`}},
			),
		).rejects.toThrow(/is not the factory its pre-signed deployment transaction creates/);
	});

	it('deploys through an address holding exactly what the pre-signed transaction creates', async () => {
		/**
		 * The expectation is not a constant in this repo: it is read out of the `signedTx`
		 * the chain config carries, whose twelve-byte constructor returns a fixed slice of
		 * its own creation code. A chain that configures a different factory is therefore
		 * checked against ITS factory, not against this one.
		 */
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: {...receipts(), ...create2FactoryHolding(CREATE2_FACTORY_RUNTIME_CODE)}},
		});

		const deployment = await deploy(env)(
			'Token',
			{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
			{deterministic: {type: 'create2', salt: ('0x' + '11'.repeat(32)) as `0x${string}`}},
		);

		expect(deployment.newlyDeployed).toBe(true);
	});

	it('says nothing about a factory whose creation code it cannot read', async () => {
		/**
		 * A factory whose constructor COMPUTES its runtime code cannot be predicted without
		 * running an EVM. The check skips rather than guesses: refusing to deploy through a
		 * factory it merely cannot describe would be worse than not checking.
		 */
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			config: {
				chains: {
					31337: {
						deterministicDeployment: {
							create2: {
								factory: CREATE2_FACTORY as `0x${string}`,
								deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
								funding: '10000000000000000',
								// A pre-signed transaction this cannot parse at all.
								signedTx: '0xdeadbeef' as `0x${string}`,
							},
						},
					},
				},
			},
			providerConfig: {responses: {...receipts(), ...create2FactoryHolding('0x6080604052348015600f57600080fd')}},
		});

		const deployment = await deploy(env)(
			'Token',
			{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
			{deterministic: {type: 'create2', salt: ('0x' + '11'.repeat(32)) as `0x${string}`}},
		);

		expect(deployment.newlyDeployed).toBe(true);
	});
});

describe('@rocketh/deploy - create3 factory identity', () => {
	it('refuses a configured create3 address its own bytecode and salt do not produce', async () => {
		/**
		 * This check existed already, but only on the branch that DEPLOYS the create3
		 * factory, the branch where a wrong address fails visibly anyway. Here the address
		 * is already occupied, which is the case where being wrong is silent.
		 */
		const wrongFactory = ('0x' + 'dd'.repeat(20)) as `0x${string}`;
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			config: {
				chains: {
					31337: {
						deterministicDeployment: {
							create3: {
								factory: wrongFactory,
								salt: ('0x' + '00'.repeat(32)) as `0x${string}`,
								bytecode: '0x6080604052348015600f57600080fd5b50' as `0x${string}`,
								proxyBytecode: '0x67363d3d37363d34f03d5260086018f3' as `0x${string}`,
							},
						},
					},
				},
			},
			providerConfig: {
				responses: {
					...receipts(),
					// Both the create3 factory and the create2 factory are already there.
					eth_getCode: () => '0x60806040',
				},
			},
		});

		await expect(
			deploy(env)(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create3', salt: ('0x' + '22'.repeat(32)) as `0x${string}`}},
			),
		).rejects.toThrow(/is not the expected address/);
	});
});
