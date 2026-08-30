/**
 * Integration tests for @rocketh/read-execute - happy paths and field encodings.
 *
 * The existing tests cover the unknown-signer error enrichment (`execute`/`tx` always
 * throw `UnknownSignerError`) and the read retry loop. They never exercise the SUCCESS
 * path of `execute` or `tx`, nor the transaction-field hex encodings (`gas`,
 * `maxFeePerGas`, `maxPriorityFeePerGas`, `nonce`, `value`), nor `read` with an
 * `account` / `blockTag`, nor the non-zero-data decode failure. These gaps are
 * covered here.
 *
 * They use `createTestEnvironment`, which builds a REAL rocketh environment against a
 * mock EIP-1193 provider, so `broadcastExecution` exercises the real account-resolution
 * and broadcast path. A node-held account is signable, so `execute`/`tx` succeed.
 */

import {describe, it, expect} from 'vitest';
import {execute, executeByName, tx, read, readByName} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {Abi} from 'abitype';

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
	{
		type: 'function',
		name: 'getValue',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT},
		nodeAccounts: [NODE_ACCOUNT],
	});
	const artifact = createMockArtifact('TestContract', ABI);
	const deployment = await env.save('TestContract', {
		address: CONTRACT_ADDRESS,
		...artifact,
		argsData: '0x',
	});
	return {env, provider, deployment};
}

describe('@rocketh/read-execute - execute happy path and field encodings', () => {
	it('returns a receipt when the account is signable', async () => {
		const {env, deployment} = await setup();
		const _execute = execute(env);

		const receipt = await _execute(deployment, {
			functionName: 'setValue',
			args: [42n],
			account: 'deployer',
		});

		expect(receipt).toBeDefined();
		expect(receipt.status).toBe('0x1');
	});

	it('hex-encodes gas, maxFeePerGas, maxPriorityFeePerGas, nonce and value onto the tx', async () => {
		const {env, provider, deployment} = await setup();
		const _execute = execute(env);

		await _execute(deployment, {
			functionName: 'setValue',
			args: [42n],
			account: 'deployer',
			gas: 100000n,
			maxFeePerGas: 2000000000n,
			maxPriorityFeePerGas: 1000000000n,
			nonce: 7,
			value: 1000n,
		} as any);

		const requests = provider.getRequests();
		const sendTx = requests.find((r) => r.method === 'eth_sendTransaction');
		expect(sendTx).toBeDefined();
		const params = sendTx!.params![0] as any;
		expect(params.gas).toBe('0x186a0'); // 100000
		expect(params.maxFeePerGas).toBe('0x77359400'); // 2000000000
		expect(params.maxPriorityFeePerGas).toBe('0x3b9aca00'); // 1000000000
		expect(params.nonce).toBe('0x7');
		expect(params.value).toBe('0x3e8'); // 1000
	});

	/**
	 * ZERO is a VALUE, not an absence, and it used to be neither.
	 *
	 * These fields were guarded on truthiness, which splits badly on `0n`. `gas` used `&&`, and
	 * `&&` returns its LEFT operand when that operand is falsy, so `gas: 0n` reached the provider
	 * as the BIGINT `0n` on a field typed `0x${string}`: a type violation on the wire, and one a
	 * JSON-RPC transport cannot even serialise. The `?:` spelling on `nonce` did not leak a type
	 * but silently DROPPED the zero, which matters most exactly there: nonce 0 is the first
	 * transaction of any fresh account, so "nonce: 0" and "no nonce" are entirely different
	 * instructions and used to be indistinguishable.
	 *
	 * Asserting the TYPE as well as the value is the point: `expect(params.gas).toBe('0x0')`
	 * alone would still pass if a future edit reintroduced `&&` and produced `0n`, because the
	 * comparison would simply fail rather than explain. The typeof check names the defect.
	 */
	it('encodes an explicit ZERO gas/fee/nonce/value rather than dropping it or leaking a bigint', async () => {
		const {env, provider, deployment} = await setup();
		const _execute = execute(env);

		await _execute(deployment, {
			functionName: 'setValue',
			args: [42n],
			account: 'deployer',
			gas: 0n,
			maxFeePerGas: 0n,
			maxPriorityFeePerGas: 0n,
			nonce: 0,
			value: 0n,
		} as any);

		const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction');
		const params = sendTx!.params![0] as any;

		for (const field of ['gas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce']) {
			expect(typeof params[field], `${field} must be a 0x quantity, never a bigint`).toBe('string');
			expect(params[field]).toBe('0x0');
		}
		expect(params.value).toBe('0x0');
	});

	it('leaves gas/fee/nonce/value undefined when not provided', async () => {
		const {env, provider, deployment} = await setup();
		const _execute = execute(env);

		await _execute(deployment, {functionName: 'setValue', args: [1n], account: 'deployer'});

		const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction');
		const params = sendTx!.params![0] as any;
		expect(params.gas).toBeUndefined();
		expect(params.maxFeePerGas).toBeUndefined();
		expect(params.maxPriorityFeePerGas).toBeUndefined();
		expect(params.nonce).toBeUndefined();
		expect(params.value).toBeUndefined();
	});

	it('encodes the function call into the data field', async () => {
		const {env, provider, deployment} = await setup();
		const _execute = execute(env);

		await _execute(deployment, {functionName: 'setValue', args: [42n], account: 'deployer'});

		const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction');
		const params = sendTx!.params![0] as any;
		// The data should contain the function selector + encoded uint256(42)
		expect(params.data).toMatch(/^0x/);
		expect(params.to).toBe(CONTRACT_ADDRESS);
		expect(params.from).toBe(NODE_ACCOUNT);
	});

	it('passes args ?? [] to the contract enrichment payload for a zero-arg call', async () => {
		// A function with no args still gets contract: {method, args: []} on the broadcast,
		// so an unsignable from would name the function. We test with a signable account
		// (so it succeeds) and just assert no error — the args:[] path is the covered branch.
		const {env, deployment} = await setup();
		const _execute = execute(env);

		// Use a function with no args — we need a no-arg nonpayable function.
		const ABI_NO_ARG = [
			{type: 'function', name: 'noop', inputs: [], outputs: [], stateMutability: 'nonpayable'},
		] as const satisfies Abi;
		const artifact = createMockArtifact('NoArg', ABI_NO_ARG);
		const noArgDeployment = await env.save('NoArg', {
			address: ('0x' + 'b'.repeat(40)) as `0x${string}`,
			...artifact,
			argsData: '0x',
		});

		const receipt = await _execute(noArgDeployment, {functionName: 'noop', account: 'deployer'});
		expect(receipt).toBeDefined();
	});
});

describe('@rocketh/read-execute - executeByName', () => {
	it('throws when no deployment with the given name exists', async () => {
		const {env} = await setup();
		const _executeByName = executeByName(env);

		await expect(
			_executeByName('NonExistent', {functionName: 'setValue', args: [1n], account: 'deployer'}),
		).rejects.toThrow('no deployment named NonExistent');
	});
});

describe('@rocketh/read-execute - tx happy path and field encodings', () => {
	it('returns a receipt for a signable account', async () => {
		const {env} = await setup();
		const _tx = tx(env);

		const receipt = await _tx({
			account: 'deployer',
			to: CONTRACT_ADDRESS,
			data: '0xdeadbeef',
		});

		expect(receipt).toBeDefined();
		expect(receipt.status).toBe('0x1');
	});

	it('sets to: undefined when no destination is given (contract-creation shape)', async () => {
		const {env, provider} = await setup();
		const _tx = tx(env);

		await _tx({account: 'deployer', data: '0xdeadbeef'});

		const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction');
		const params = sendTx!.params![0] as any;
		expect(params.to).toBeUndefined();
	});

	it('hex-encodes gas, fees and value', async () => {
		const {env, provider} = await setup();
		const _tx = tx(env);

		await _tx({
			account: 'deployer',
			to: CONTRACT_ADDRESS,
			data: '0x',
			gas: 50000n,
			maxFeePerGas: 100n,
			maxPriorityFeePerGas: 50n,
			value: 1n,
		});

		const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction');
		const params = sendTx!.params![0] as any;
		expect(params.gas).toBe('0xc350'); // 50000
		expect(params.maxFeePerGas).toBe('0x64'); // 100
		expect(params.maxPriorityFeePerGas).toBe('0x32'); // 50
		expect(params.value).toBe('0x1');
	});
});

describe('@rocketh/read-execute - read with account and blockTag', () => {
	it('puts the resolved from-address on the eth_call when an account is given', async () => {
		const {env, provider, deployment} = await setup();
		const _read = read(env);

		provider.setResponse('eth_call', '0x000000000000000000000000000000000000000000000000000000000000002a');

		await _read(deployment, {functionName: 'getValue', account: 'deployer'});

		const callReq = provider.getRequests().find((r) => r.method === 'eth_call');
		const params = callReq!.params![0] as any;
		expect(params.from).toBe(NODE_ACCOUNT);
	});

	it('omits from when no account is given', async () => {
		const {env, provider, deployment} = await setup();
		const _read = read(env);

		provider.setResponse('eth_call', '0x000000000000000000000000000000000000000000000000000000000000002a');

		await _read(deployment, {functionName: 'getValue'});

		const callReq = provider.getRequests().find((r) => r.method === 'eth_call');
		const params = callReq!.params![0] as any;
		expect(params.from).toBeUndefined();
	});

	it('passes blockTag as the second eth_call parameter', async () => {
		const {env, provider, deployment} = await setup();
		const _read = read(env);

		provider.setResponse('eth_call', '0x000000000000000000000000000000000000000000000000000000000000002a');

		await _read(deployment, {functionName: 'getValue', blockTag: 'pending'});

		const callReq = provider.getRequests().find((r) => r.method === 'eth_call');
		expect(callReq!.params![1]).toBe('pending');
	});

	it('passes blockNumber as the second eth_call parameter when given', async () => {
		const {env, provider, deployment} = await setup();
		const _read = read(env);

		provider.setResponse('eth_call', '0x000000000000000000000000000000000000000000000000000000000000002a');

		await _read(deployment, {functionName: 'getValue', blockNumber: 123n});

		const callReq = provider.getRequests().find((r) => r.method === 'eth_call');
		expect(callReq!.params![1]).toBe(123n);
	});

	it('throws immediately (no retry) when decoding fails with a non-zero-data error', async () => {
		const {env, provider, deployment} = await setup();
		const _read = read(env);

		// Well-formed but wrong-width data for a uint256 return: '0x1234' is not 32 bytes,
		// so decodeFunctionResult throws a size error that is NOT AbiDecodingZeroDataError.
		let callCount = 0;
		provider.setResponse('eth_call', () => {
			callCount++;
			return '0x1234';
		});

		await expect(_read(deployment, {functionName: 'getValue'})).rejects.toThrow();
		expect(callCount).toBe(1);
	});
});

describe('@rocketh/read-execute - readByName', () => {
	it('throws when no deployment with the given name exists', async () => {
		const {env} = await setup();
		const _readByName = readByName(env);

		await expect(_readByName('NonExistent', {functionName: 'getValue'})).rejects.toThrow(
			'no deployment named NonExistent',
		);
	});
});
