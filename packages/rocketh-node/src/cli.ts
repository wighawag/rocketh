#! /usr/bin/env node
import {hookup, setupLogger} from 'named-logs-console';
import {loadEnv} from 'ldenv';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {loadAndExecuteDeploymentsFromFiles} from './executor/index.js';
import {ExecutionParams, UnknownSignerPolicy} from 'rocketh/types';
import {packagesWithLogsEnabled} from './index.js';

hookup();
loadEnv();

const commandName = 'rocketh';
const program = new Command();
program
	.name(commandName)
	.version(pkg.version)
	.usage(`${commandName}`)
	.description('execute deploy scripts and store the deployments')
	.option('-s, --scripts <value>', 'path the folder containing the deploy scripts to execute')
	.option('-t, --tags <value>', 'comma separated list of tags to execute')
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.option('--skip-gas-report', 'if set skip gas report')
	.option('--log-level <value>', 'set the log level')
	.option('--skip-prompts', 'if set skip any prompts (this also forces --on-unknown-signer throw)')
	.option(
		'--on-unknown-signer <value>',
		"what to do when a transaction's `from` cannot be signed for: throw | ask | auto (default: auto)",
	)
	.option('--save-deployments', 'if set, save deployments')
	.option('--reset', 'if set, delete all deployments first')
	.requiredOption('-e, --environment <value>', 'environment to use')
	.parse(process.argv);

const options = program.opts();

let logLevelAsNumber = 3;
if (options.logLevel) {
	logLevelAsNumber = parseInt(options.logLevel);
	if (isNaN(logLevelAsNumber)) {
		switch (options.logLevel) {
			case 'error':
				logLevelAsNumber = 1;
				break;
			case 'warn':
				logLevelAsNumber = 2;
				break;
			case 'info':
				logLevelAsNumber = 3;
				break;
			case 'debug':
				logLevelAsNumber = 4;
				break;
			case 'trace':
				logLevelAsNumber = 5;
				break;
		}
	}
}

setupLogger(packagesWithLogsEnabled, {
	enabled: true,
	level: logLevelAsNumber,
});

const UNKNOWN_SIGNER_POLICIES: readonly UnknownSignerPolicy[] = ['throw', 'ask', 'auto'];

function resolveOnUnknownSigner(): UnknownSignerPolicy | undefined {
	// `--skip-prompts` says "skip any prompts", and the interactive unknown-signer
	//  resolver IS a prompt, so it must force `throw` rather than only silencing the
	//  reset/gas-price confirmations. It wins over an explicit value: asking to be
	//  prompted AND not prompted is a contradiction, and the safe half is not prompting.
	if (options.skipPrompts) {
		return 'throw';
	}
	const value = options.onUnknownSigner;
	if (value === undefined) {
		// leave it unset so config (chain, then top-level) still decides
		return undefined;
	}
	if (!UNKNOWN_SIGNER_POLICIES.includes(value)) {
		console.error(
			`invalid --on-unknown-signer value: ${JSON.stringify(value)}. Expected one of: ${UNKNOWN_SIGNER_POLICIES.join(', ')}.`,
		);
		process.exit(1);
	}
	return value;
}

const onUnknownSigner = resolveOnUnknownSigner();

loadAndExecuteDeploymentsFromFiles({
	...(options as ExecutionParams),
	askBeforeProceeding: options.skipPrompts ? false : true,
	reportGasUse: options.skipGasReport ? false : true,
	saveDeployments: options.saveDeployments,
	reset: options.reset ? true : false,
	// AFTER the spread: commander would otherwise pass the raw, unvalidated string
	//  through, and an omitted flag must stay `undefined` so config still decides.
	onUnknownSigner,
});
