// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

export const config = {
	accounts: {
		deployer: 0,
		// the Registry's owner: a Safe, an account rocketh cannot sign for
		admin: '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe',
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
