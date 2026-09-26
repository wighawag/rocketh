// deploy/10_faucet.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy, get} = deployments;
	const {faucetOwner} = await getNamedAccounts();

	const token = await get('Token');
	await deploy('Faucet', {from: faucetOwner, args: [token.address], log: true});
};
export default func;
func.tags = ['Faucet'];
func.dependencies = ['Token'];
// no faucet where `faucetOwner` is null (mainnet, see the named accounts)
func.skip = async (hre: HardhatRuntimeEnvironment) => !(await hre.getNamedAccounts()).faucetOwner;
