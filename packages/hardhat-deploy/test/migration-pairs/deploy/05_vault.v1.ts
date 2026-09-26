// deploy/05_vault.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();

	await deploy('Vault', {
		from: deployer,
		proxy: {
			execute: {
				init: {methodName: 'initialize', args: [deployer]}, // on the first deployment
				onUpgrade: {methodName: 'migrate', args: [2]}, // on every later upgrade
			},
		},
		log: true,
	});
};
export default func;
func.tags = ['Vault'];
