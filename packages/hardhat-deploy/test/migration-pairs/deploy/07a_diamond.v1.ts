// deploy/07_diamond.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {diamond} = deployments;
	const {deployer} = await getNamedAccounts();

	await diamond.deploy('Diamond', {
		from: deployer,
		owner: deployer,
		facets: ['ERC20Facet'],
		// runs with the deployment, and again with every later cut
		execute: {methodName: 'initialize', args: ['Diamond Token', 'DMT']},
		log: true,
	});
};
export default func;
func.tags = ['Diamond'];
