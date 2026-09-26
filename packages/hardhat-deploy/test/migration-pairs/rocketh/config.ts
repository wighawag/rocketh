// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';
import * as proxyExtension from '@rocketh/proxy';
import * as diamondExtension from '@rocketh/diamond';

export const config = {
	// v1's `namedAccounts`, moved here and renamed `accounts`. Every value keeps its v1 meaning:
	// an index into the node's accounts, an address, or a map keyed by network, then `default`.
	accounts: {
		deployer: 0,
		tokenOwner: {
			default: 1,
			sepolia: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
		},
		// `null`: this account does not exist on mainnet. It is absent from `namedAccounts`
		// there, and TypeScript makes a script handle `undefined` for it.
		faucetOwner: {
			default: 2,
			mainnet: null,
		},
	},
	data: {},
} as const satisfies UserConfig;

// What v1 built in, rocketh adds as extensions: each script receives the union of these.
export const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...proxyExtension,
	...diamondExtension,
};

export type Extensions = typeof extensions;
export type Accounts = typeof config.accounts;
export type Data = typeof config.data;
