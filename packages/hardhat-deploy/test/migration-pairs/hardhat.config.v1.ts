// hardhat.config.ts (hardhat-deploy v1), the named accounts only
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';

const config: HardhatUserConfig = {
	namedAccounts: {
		deployer: 0,
		tokenOwner: {
			default: 1,
			sepolia: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
		},
		// `null`: this account does not exist on mainnet, and `getNamedAccounts()` leaves it out
		faucetOwner: {
			default: 2,
			mainnet: null,
		},
	},
	// ... solidity, networks
};
export default config;
