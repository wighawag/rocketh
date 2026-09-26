// deploy/02_calculator.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();

	const mathLib = await deploy('MathLib', {from: deployer, log: true});

	await deploy('Calculator', {
		from: deployer,
		args: [10],
		libraries: {MathLib: mathLib.address},
		log: true,
	});
};
export default func;
func.tags = ['Calculator'];
