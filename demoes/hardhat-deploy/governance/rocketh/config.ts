// ----------------------------------------------------------------------------
// Typed Config
// ----------------------------------------------------------------------------
import type {UserConfig} from 'rocketh/types';

// we define our config and export it as "config"
export const config = {
	accounts: {
		// the key the deploy machine holds: it deploys implementations and pays gas
		deployer: {
			default: 0,
		},
		// a human who is an owner of the demo multisig. It never appears as a `from`
		//  in a governance call: the multisig CONTRACT does. This account is who
		//  replays the deferred transaction through the multisig afterwards.
		governanceOperator: {
			default: 1,
		},
	},
	data: {},

	// Never prompt, anywhere. The default (`'auto'`) would open the interactive
	//  resolver on a TTY, which is a perfectly good feature and exactly the wrong
	//  one for this demo: the whole point here is to SEE the deferred transaction
	//  printed and hand it to an operator. `catchUnknownSigner` forces this policy
	//  for the call it wraps anyway, so this line only governs anything that is
	//  accidentally left unwrapped, where a hard throw is the honest outcome.
	onUnknownSigner: 'throw',
} as const satisfies UserConfig;

// then we import each extensions we are interested in using in our deploy script or elsewhere

// this one provide a deploy function
import * as deployExtension from '@rocketh/deploy';
// this one provide read,execute functions
import * as readExecuteExtension from '@rocketh/read-execute';
// this one provide a deployViaProxy function that let you declaratively
//  deploy proxy based contracts
import * as deployProxyExtension from '@rocketh/proxy';
// this one provide catchUnknownSigner: the reason this demo exists
import * as unknownSignerExtension from '@rocketh/unknown-signer';

// and export them as a unified object
const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...deployProxyExtension,
	...unknownSignerExtension,
};
export {extensions};

// then we also export the types that our config ehibit so other can use it

type Extensions = typeof extensions;
type Accounts = typeof config.accounts;
type Data = typeof config.data;

export type {Extensions, Accounts, Data};
