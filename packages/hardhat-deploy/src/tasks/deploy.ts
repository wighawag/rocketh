import {NewTaskActionFunction} from 'hardhat/types/tasks';
import {loadAndExecuteDeploymentsFromFiles, packagesWithLogsEnabled} from '@rocketh/node';
import type {UnknownSignerPolicy} from 'rocketh/types';
import {generateForkConfig} from '../helpers.js';
import {setupLogger} from 'named-logs-console';
import {HardhatPluginError} from 'hardhat/plugins';

interface RunActionArguments {
	skipPrompts: boolean;
	saveDeployments?: string;
	tags?: string;
	pollingInterval?: string;
	reportGasUsed: boolean;
	noCompile?: boolean;
	defaultBuildProfile?: string;
	reset?: boolean;
	onUnknownSigner?: string;
	// TODO? export?: string;
	// TODO? watch?: boolean;
}

const runScriptWithHardhat: NewTaskActionFunction<RunActionArguments> = async (args, hre) => {
	let saveDeployments = true;
	let skipPrompts = args.skipPrompts ? true : false;

	const {connection, environment, isFork, provider} = await generateForkConfig({hre});

	const isMemoryNetwork = connection.networkConfig.type == 'edr-simulated';
	if (isMemoryNetwork) {
		skipPrompts = true;
		saveDeployments = false;
	}
	if (args.saveDeployments) {
		saveDeployments = args.saveDeployments == 'true' ? true : false;
	}
	const tags = args.tags && args.tags != '' ? args.tags : undefined;

	setupLogger(packagesWithLogsEnabled, {
		enabled: true,
		level: 3,
	});

	const defaultPollingInterval = args.pollingInterval ? parseInt(args.pollingInterval) : undefined;

	if (defaultPollingInterval !== undefined && isNaN(defaultPollingInterval)) {
		throw new HardhatPluginError('hardhat-deploy', `invalid pollingInterval value : ${args.pollingInterval}`);
	}

	// `--skip-prompts` says "skip any prompts", and the interactive unknown-signer resolver IS a
	//  prompt, so it must force `throw` rather than only silencing the reset/gas-price
	//  confirmations. Note `skipPrompts` is also forced on for an in-memory network above, which
	//  is right: there is no Safe to execute anything on there.
	let onUnknownSigner: UnknownSignerPolicy | undefined;
	if (skipPrompts) {
		onUnknownSigner = 'throw';
	} else if (args.onUnknownSigner !== undefined) {
		if (args.onUnknownSigner !== 'throw' && args.onUnknownSigner !== 'ask' && args.onUnknownSigner !== 'auto') {
			throw new HardhatPluginError(
				'hardhat-deploy',
				`invalid onUnknownSigner value : ${args.onUnknownSigner}. Expected one of: throw, ask, auto.`,
			);
		}
		onUnknownSigner = args.onUnknownSigner;
	}
	// left `undefined` when the flag is omitted, so config (chain, then top-level) still decides

	if (!args.noCompile) {
		await hre.tasks.getTask('build').run({
			quiet: true,
			noTests: true,
			defaultBuildProfile: args.defaultBuildProfile || 'production',
		});
	}

	await loadAndExecuteDeploymentsFromFiles({
		provider,
		environment: environment,
		// This guard STAYS, although core now defaults a fork to not saving, because this task never
		//  leaves the value undefined: `saveDeployments` above is an explicit boolean by construction
		//  (it starts at `true`), and an explicit value outranks every default, fork-awareness
		//  included. So core's rule cannot reach this call site, and dropping the guard would turn a
		//  `HARDHAT_FORK` run into an explicit `true` and write into the forked network's records.
		//  It also keeps `--save-deployments true` inert on a fork, exactly as today; making that flag
		//  the fork escape hatch would be a user-visible change to the flag, not to this task.
		saveDeployments: isFork ? false : saveDeployments,
		askBeforeProceeding: skipPrompts ? false : true,
		tags: tags?.split(','),
		defaultPollingInterval,
		reportGasUse: args.reportGasUsed,
		extra: {connection},
		reset: args.reset,
		onUnknownSigner,
	});
};
export default runScriptWithHardhat;
