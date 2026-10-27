/**
 * The input of a Safe `execTransaction`, encoded by hand for `rocketh`'s own tests (this package
 * does not depend on viem). It is what an owner sends TO the Safe when executing a transaction
 * from the Safe app, and what the pasted-transaction classifier decodes.
 *
 * `execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas,
 * uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)`,
 * selector `0x6a761202`. The extension packages' tests encode the same call with viem's
 * `encodeFunctionData`, which cross-checks this encoder and the decoder against an independent
 * implementation.
 */

function word(value: bigint): string {
	return value.toString(16).padStart(64, '0');
}

function bytesTail(hex: string): string {
	const body = hex.replace(/^0x/, '').toLowerCase();
	const padded = body.padEnd(Math.ceil(body.length / 64) * 64, '0');
	return word(BigInt(body.length / 2)) + padded;
}

export function encodeSafeExecTransaction(call: {
	to: string;
	value?: bigint;
	data: string;
	/** 0 is CALL (the default), 1 is DELEGATECALL. */
	operation?: number;
	signatures?: string;
}): `0x${string}` {
	const dataTail = bytesTail(call.data);
	const signaturesTail = bytesTail(call.signatures ?? '0x' + 'ab'.repeat(65));
	const headSize = 10 * 32;
	const dataOffset = BigInt(headSize);
	const signaturesOffset = BigInt(headSize + dataTail.length / 2);
	const head = [
		word(BigInt(call.to)),
		word(call.value ?? 0n),
		word(dataOffset),
		word(BigInt(call.operation ?? 0)),
		word(0n), // safeTxGas
		word(0n), // baseGas
		word(0n), // gasPrice
		word(0n), // gasToken
		word(0n), // refundReceiver
		word(signaturesOffset),
	].join('');
	return `0x6a761202${head}${dataTail}${signaturesTail}`;
}
