// deploy/08_greeter.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy, execute, read} = deployments;
	const {deployer} = await getNamedAccounts();

	await deploy('Greeter', {from: deployer, args: ['hi'], log: true});

	const greeting = await read('Greeter', 'greet');
	if (greeting !== 'hello') {
		await execute('Greeter', {from: deployer, log: true}, 'setGreeting', 'hello');
	}
};
export default func;
func.tags = ['Greeter'];
