// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

export const config = {
	accounts: {
		deployer: 0,
		// the Registry's owner: a Safe, declared by address, an account rocketh cannot sign for
		admin: '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe',
	},
	environments: {
		mainnet: {
			// a hardhat fork reports chain 31337: this says what a fork of `mainnet` is a fork OF
			chain: 1,
			// on a fork the impersonated Safe sends its own calls: lend it their gas
			whenForked: {fundImpersonatedAccounts: true},
		},
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
