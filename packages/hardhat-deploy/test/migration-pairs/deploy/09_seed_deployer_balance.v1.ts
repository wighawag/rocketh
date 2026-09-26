// deploy/09_seed_deployer_balance.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {execute} = deployments;
	const {deployer, tokenOwner} = await getNamedAccounts();

	await execute('Token', {from: tokenOwner, log: true}, 'transfer', deployer, parseEther('100'));

	return true; // records `func.id`: this script never runs again on this network
};
export default func;
func.id = 'seed_deployer_balance';
func.tags = ['Seed'];
func.dependencies = ['Token'];
