// deploy/04b_proxy_erc173_with_receive.ts (hardhat-deploy v1)
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();

	await deploy('GreetingsRegistry', {
		from: deployer,
		args: ['hello: '],
		proxy: {
			proxyContract: 'EIP173ProxyWithReceive',
		},
		log: true,
	});
};
export default func;
func.tags = ['GreetingsRegistry'];
