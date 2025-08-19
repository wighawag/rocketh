import {EIP1193LocalSigner} from 'eip-1193-signer';
import {SignerProtocolFunction} from 'rocketh/dist/environment/index.js';

export const privateKey: SignerProtocolFunction = async (protocolString: string) => {
	if (!protocolString.startsWith('0x')) {
		throw new Error(`Private key must start with 0x, got: ${protocolString}`);
	}
	const privateKey = protocolString as `0x${string}`;
	return {
		type: 'signerOnly',
		signer: new EIP1193LocalSigner(privateKey),
	};
};
