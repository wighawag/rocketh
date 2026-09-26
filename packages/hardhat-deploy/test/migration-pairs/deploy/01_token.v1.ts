// deploy/01_token.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
	const {deployer, tokenOwner} = await getNamedAccounts();

	await deploy('Token', {
		from: deployer,
		args: [tokenOwner, parseEther('1000000'), 'My Token', 'MTK'],
		log: true,
	});
};
export default func;
func.tags = ['Token'];
