import {NewTaskActionFunction} from 'hardhat/types/tasks';
import {ConfigOptions, loadAndExecuteDeployments} from 'rocketh';

interface RunActionArguments {
	saveDeployments: string;
	skipPrompts: boolean;
}

const runScriptWithHardhat: NewTaskActionFunction<RunActionArguments> = async (args, hre) => {
	console.log(args);
	let saveDeployments = args.saveDeployments == '' ? undefined : args.saveDeployments == 'true' ? true : false;
	if (process.env.HARDHAT_FORK) {
		saveDeployments = false;
	}
	const connection = await hre.network.connect();
	await loadAndExecuteDeployments({
		logLevel: 1,
		provider: connection.provider as unknown as any, // TODO type
		network: process.env.HARDHAT_FORK ? {fork: process.env.HARDHAT_FORK} : connection.networkName,
		saveDeployments,
		askBeforeProceeding: args.skipPrompts ? false : true,
		// reportGasUse: args.skipGasReport ? false : true,
	});
};
export default runScriptWithHardhat;
