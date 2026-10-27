import {encodeFunctionData, type Abi} from 'viem';

/** The Safe's `execTransaction`, the call an owner sends TO the Safe when executing from the Safe app. */
export const SAFE_EXEC_TRANSACTION_ABI = [
	{
		type: 'function',
		name: 'execTransaction',
		stateMutability: 'payable',
		inputs: [
			{name: 'to', type: 'address'},
			{name: 'value', type: 'uint256'},
			{name: 'data', type: 'bytes'},
			{name: 'operation', type: 'uint8'},
			{name: 'safeTxGas', type: 'uint256'},
			{name: 'baseGas', type: 'uint256'},
			{name: 'gasPrice', type: 'uint256'},
			{name: 'gasToken', type: 'address'},
			{name: 'refundReceiver', type: 'address'},
			{name: 'signatures', type: 'bytes'},
		],
		outputs: [{name: 'success', type: 'bool'}],
	},
] as const satisfies Abi;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * The input of a Safe `execTransaction` carrying `call`, encoded with viem: an implementation
 * independent of the hand-written decoder in `rocketh`, so these tests cross-check it.
 */
export function encodeSafeExecTransaction(call: {
	to: `0x${string}`;
	value?: bigint;
	data: `0x${string}`;
	/** 0 is CALL (the default), 1 is DELEGATECALL. */
	operation?: number;
}): `0x${string}` {
	return encodeFunctionData({
		abi: SAFE_EXEC_TRANSACTION_ABI,
		functionName: 'execTransaction',
		args: [
			call.to,
			call.value ?? 0n,
			call.data,
			call.operation ?? 0,
			0n,
			0n,
			0n,
			ZERO_ADDRESS,
			ZERO_ADDRESS,
			`0x${'ab'.repeat(65)}`,
		],
	});
}
