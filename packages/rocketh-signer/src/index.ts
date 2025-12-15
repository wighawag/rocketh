import {EIP1193LocalSigner} from 'eip-1193-signer';
import type {SignerProtocolFunction} from '@rocketh/core/types';

export const privateKey: SignerProtocolFunction = async (protocolString: string) => {
	const [proto, privateKeyString] = protocolString.split(':');
	if (!privateKeyString.startsWith('0x')) {
		throw new Error(`Private key must start with 0x, got: ${privateKeyString}`);
	}
	const privateKey = privateKeyString as `0x${string}`;
	return {
		type: 'signerOnly',
		signer: new EIP1193LocalSigner(privateKey),
	};
};
