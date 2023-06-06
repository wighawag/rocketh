#! /usr/bin/env node
import {loadEnv} from 'ldenv';
import {readAndResolveConfig} from 'rocketh';
import {run} from '.';
import {Command, Option} from 'commander';
import pkg from '../package.json';
import {ConfigOptions} from 'rocketh';
loadEnv();

const commandName = `rocketh`;

const program = new Command();
program
	.name(commandName)
	.description('submit contract for verification')
	.version(pkg.version)
	.option('-s, --scripts <value>', 'path the folder containing the deploy scripts to execute')
	.option('-t, --tags <value>', 'comma separated list of tags to execute')
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.requiredOption('-n, --network <value>', 'network context to use');

program
	.command('etherscan')
	.description('submit contract for verification to etherscan')
	.action(() => {
		const options = program.opts() as ConfigOptions;
		const resolvedConfig = readAndResolveConfig(options, {ignoreMissingRPC: true});
		run(resolvedConfig, {verifier: {type: 'etherscan', apiKey: process.env['ETHERSCAN_API_KEY']}});
	});

program
	.command('sourcify')
	.description('submit contract for verification to etherscan')
	.action(() => {
		const options = program.opts() as ConfigOptions;
		const resolvedConfig = readAndResolveConfig(options, {ignoreMissingRPC: true});
		run(resolvedConfig, {verifier: {type: 'sourcify'}});
	});

program.parse(process.argv);
