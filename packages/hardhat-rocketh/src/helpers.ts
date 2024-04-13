import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {Environment, ProvidedContext, UnknownArtifacts, UnresolvedUnknownNamedAccounts, loadEnvironment} from 'rocketh';

export function loadEnvironmentFromHardhat<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts
>(hre: HardhatRuntimeEnvironment, context: ProvidedContext<Artifacts, NamedAccounts>): Promise<Environment> {
	return loadEnvironment(
		{
			provider: hre.network.provider as any, // TODO wrap so it gives the expected chainID even in fork
			network: process.env.HARDHAT_FORK
				? {
						fork: process.env.HARDHAT_FORK,
				  }
				: hre.network.name,
		},
		context
	);
}
