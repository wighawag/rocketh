// deploy/06a_treasury.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();

	await deploy('Treasury', {
		from: deployer,
		contract: 'Treasury',
		args: [1000],
		proxy: {upgradeIndex: 0}, // step 0: the first deployment, never repeated
		log: true,
	});
};
export default func;
func.tags = ['Treasury'];
