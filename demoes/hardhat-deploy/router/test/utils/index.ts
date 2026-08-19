import {EthereumProvider} from 'hardhat/types/providers';
import {loadAndExecuteDeploymentsFromFiles} from '../../rocketh/environment.js';
import {Abi_GetMessage} from '../../generated/abis/GetMessage.js';
import {Abi_SetMessage} from '../../generated/abis/SetMessage.js';

export function setupFixtures(provider: EthereumProvider) {
	return {
		async deployAll() {
			const env = await loadAndExecuteDeploymentsFromFiles({
				provider: provider,
			});

			// Deployment are inherently untyped since they can vary from network or even before different from current artifacts
			// so here we type them manually assuming the artifact is still matching
			const GreetingsRegistryRead =
				env.get<Abi_GetMessage>('GreetingsRegistry');
			const GreetingsRegistryWrite =
				env.get<Abi_SetMessage>('GreetingsRegistry');

			return {
				env,
				GreetingsRegistryRead,
				GreetingsRegistryWrite,
				namedAccounts: env.namedAccounts,
				unnamedAccounts: env.unnamedAccounts,
			};
		},
	};
}
