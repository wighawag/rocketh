// deploy/04d_proxy_transparent.ts (hardhat-deploy v1)
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
			proxyContract: 'OpenZeppelinTransparentProxy',
			viaAdminContract: 'DefaultProxyAdmin',
		},
		log: true,
	});
};
export default func;
func.tags = ['GreetingsRegistry'];
