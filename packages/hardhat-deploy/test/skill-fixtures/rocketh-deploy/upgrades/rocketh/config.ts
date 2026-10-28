// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';
import * as proxyExtension from '@rocketh/proxy';
import * as diamondExtension from '@rocketh/diamond';

export const config = {
	accounts: {
		deployer: 0,
		// the account that holds the upgrade rights: the node's second account on a dev chain
		admin: 1,
	},
	data: {},
} as const satisfies UserConfig;

export const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...proxyExtension,
	...diamondExtension,
};

export type Extensions = typeof extensions;
export type Accounts = typeof config.accounts;
export type Data = typeof config.data;
