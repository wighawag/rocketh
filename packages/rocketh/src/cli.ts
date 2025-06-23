#! /usr/bin/env node
import {loadEnv} from 'ldenv';
import {ConfigOptions, loadAndExecuteDeployments} from './index.js';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};

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
	.option('--skip-prompts', 'if set skip any prompts')
	.option('--save-deployments', 'if set, save deployments')
	.requiredOption('-n, --network <value>', 'network context to use')
	.parse(process.argv);

const options = program.opts();


loadAndExecuteDeployments({
	...(options as ConfigOptions),
	logLevel: 1,
	askBeforeProceeding: options.skipPrompts ? false : true,
	reportGasUse: options.skipGasReport ? false : true,
	saveDeployments: options.saveDeployments,
});
