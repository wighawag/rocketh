#! /usr/bin/env node
import {hookup, setupLogger} from 'named-logs-console';
import {loadEnv} from 'ldenv';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import { loadAndExecuteDeploymentsFromFiles } from './executor/index.js';
import { ExecutionParams } from 'rocketh/types';

hookup();
loadEnv();

const commandName = "rocketh";
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
	.option('--skip-prompts', 'if set skip any prompts')
	.option('--save-deployments', 'if set, save deployments')
	.requiredOption('-e, --environment <value>', 'environment to use')
	.parse(process.argv);

const options = program.opts();

let logLevelAsNumber = 3;
if (options.logLevel) {
	logLevelAsNumber = parseInt(options.logLevel);
	if (isNaN(logLevelAsNumber)) {
		switch(options.logLevel) {
			case 'error': logLevelAsNumber = 1; break;
			case 'warn': logLevelAsNumber = 2; break;
			case 'info': logLevelAsNumber = 3; break;
			case 'debug': logLevelAsNumber = 4; break; 
			case 'trace': logLevelAsNumber = 5; break; 
		}
	}
}

setupLogger(['rocketh', '@rocketh/node'], {
	enabled: true,
	level: logLevelAsNumber
});


loadAndExecuteDeploymentsFromFiles({
	...(options as ExecutionParams),
	askBeforeProceeding: options.skipPrompts ? false : true,
	reportGasUse: options.skipGasReport ? false : true,
	saveDeployments: options.saveDeployments,
});
