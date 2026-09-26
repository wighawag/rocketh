import {EIP1193LocalSigner} from 'eip-1193-signer';
import type {SignerProtocolFunction} from '@rocketh/core/types';

export const privateKey: SignerProtocolFunction = async (protocolString: string) => {
	const [proto, privateKeyString] = protocolString.split(':');
	if (!privateKeyString || !privateKeyString.startsWith('0x')) {
		// The value is NEVER echoed: it is almost certainly a real key missing its prefix (wallets
		// export keys without one), and an error message reaches terminals and CI logs, where GitHub
		// masks only the exact secret string and not a key embedded in a larger one.
		throw new Error(
			`Private key must start with 0x (got a value of ${privateKeyString?.length ?? 0} characters that does not; it is not shown).`,
		);
	}
	const privateKey = privateKeyString as `0x${string}`;
	return {
		type: 'signerOnly',
		signer: new EIP1193LocalSigner(privateKey),
	};
};
