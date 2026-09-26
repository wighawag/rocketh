// deploy/03_registry.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const SALT = '0x0000000000000000000000000000000000000000000000000000000000000001';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();

	await deploy('Registry', {
		from: deployer,
		deterministicDeployment: SALT, // or `true` for the zero salt
		log: true,
	});
};
export default func;
func.tags = ['Registry'];
