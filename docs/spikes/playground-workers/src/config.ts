// The project's rocketh/config.ts, as a playground app would ship it: accounts as private keys
// (webevm signs nothing), the in-tab chain declared, and the extensions the scripts use.
import type {UserConfig} from 'rocketh/types';
import {privateKey} from '@rocketh/signer';
import * as deployExtension from '@rocketh/deploy';
import {setupDeployScripts} from 'rocketh';

export const CHAIN_ID = 31337;
// anvil's first test key: a well-known throwaway, never a real account
export const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export const config = {
	accounts: {deployer: {default: `privateKey:${DEPLOYER_KEY}`}},
	chains: {
		[CHAIN_ID]: {
			info: {
				id: CHAIN_ID,
				name: 'In-browser EVM',
				nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
				rpcUrls: {default: {http: []}},
				testnet: true,
			},
		},
	},
	data: {},
	signerProtocols: {privateKey},
} as const satisfies UserConfig;

export const extensions = {...deployExtension};
export const {deployScript} = setupDeployScripts(extensions);
