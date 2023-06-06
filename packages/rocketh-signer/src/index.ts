import {handleSignerProtocol} from 'rocketh';
import {EIP1193LocalSigner} from 'eip-1193-signer';

handleSignerProtocol('privateKey', async (str: string) => {
	const [proto, privateKey] = str.split(':');
	return {type: 'signerOnly', signer: new EIP1193LocalSigner(privateKey as `0x${string}`)};
});
