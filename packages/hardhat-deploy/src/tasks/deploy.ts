import {NewTaskActionFunction} from 'hardhat/types/tasks';
import {loadAndExecuteDeploymentsFromFiles, packagesWithLogsEnabled, parseFeeOption} from '@rocketh/node';
import type {UnknownSignerPolicy} from 'rocketh/types';
import {generateForkConfig} from '../helpers.js';
import {setupLogger} from 'named-logs-console';
import {HardhatPluginError} from 'hardhat/plugins';
import {resolveRunFeeDefaults} from 'rocketh';
import {reportingUnresolvableAccounts} from '../account-errors.js';

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
	gasPrice?: string;
	maxFeePerGas?: string;
	maxPriorityFeePerGas?: string;
	// TODO? export?: string;
	// TODO? watch?: boolean;
}

/**
 * The run-level fee defaults the task's `--gas-price`, `--max-fee-per-gas` and
 * `--max-priority-fee-per-gas` options ask for, as core's `ExecutionParams` takes them. Each value
 * is read by `parseFeeOption` from `@rocketh/node`, exactly as the `rocketh` CLI reads its own, and
 * only the options given become keys, so a run that sets none sends what it always did.
 *
 * A `--gas-price` together with an EIP-1559 one is refused by core's `resolveRunFeeDefaults`,
 * called here so the refusal comes before compiling; `resolveExecutionParams` runs it again for
 * every caller, the `rocketh` CLI and programmatic ones included.
 */
export function resolveRunFeeOptions(
	args: Pick<RunActionArguments, 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'>,
): {gasPrice?: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint} {
	try {
		return resolveRunFeeDefaults({
			gasPrice: parseFeeOption('--gas-price', args.gasPrice),
			maxFeePerGas: parseFeeOption('--max-fee-per-gas', args.maxFeePerGas),
			maxPriorityFeePerGas: parseFeeOption('--max-priority-fee-per-gas', args.maxPriorityFeePerGas),
		});
	} catch (err) {
		throw new HardhatPluginError('hardhat-deploy', err instanceof Error ? err.message : String(err));
	}
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
	// Segments are TRIMMED and empty ones dropped, so `--tags "a, b"` selects `a` and `b` rather
	//  than `a` and the unmatchable `" b"`. Everything collapsing to nothing means NO filter, not a
	//  filter matching nothing, which is why `''` cannot be allowed to become `['']`. `@rocketh/node`
	//  parses `--tags` identically (`parseTags` in its `cli-options.ts`): the two entry points must
	//  not disagree about what a tag is.
	const tagList = args.tags
		?.split(',')
		.map((tag) => tag.trim())
		.filter((tag) => tag !== '');
	const tags = tagList && tagList.length > 0 ? tagList : undefined;

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

	// Parsed BEFORE compiling, so a mistyped fee fails in an instant rather than after a build.
	const runFees = resolveRunFeeOptions(args);

	if (!args.noCompile) {
		await hre.tasks.getTask('build').run({
			quiet: true,
			noTests: true,
			defaultBuildProfile: args.defaultBuildProfile || 'production',
		});
	}

	// Named accounts that cannot be resolved (above all: an index on a network with no keys
	//  configured) are reported as a plugin error with the hardhat-side fix, not as a crash.
	await reportingUnresolvableAccounts(connection, () =>
		loadAndExecuteDeploymentsFromFiles({
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
			tags,
			defaultPollingInterval,
			reportGasUse: args.reportGasUsed,
			extra: {connection},
			reset: args.reset,
			onUnknownSigner,
			...runFees,
		}),
	);
};
export default runScriptWithHardhat;
