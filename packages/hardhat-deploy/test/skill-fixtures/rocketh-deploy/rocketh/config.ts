// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

export const config = {
	accounts: {
		deployer: 0,
		// the node's second account on a dev chain, a fixed address on mainnet
		treasury: {default: 1, mainnet: '0x2222222222222222222222222222222222222222'},
	},
	data: {},
} as const satisfies UserConfig;

export const extensions = {
	...deployExtension,
	...readExecuteExtension,
};

export type Extensions = typeof extensions;
export type Accounts = typeof config.accounts;
export type Data = typeof config.data;
