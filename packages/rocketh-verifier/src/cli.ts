#! /usr/bin/env node
import {loadEnv} from 'ldenv';
import {run} from './index.js';
import {Command, Option} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {exportMetadata} from './metadata.js';
import { ConfigOverrides, readConfig } from 'rocketh';
loadEnv();

const commandName = `rocketh-verify`;

const program = new Command();
program
	.name(commandName)
	.description('submit contract for verification')
	.version(pkg.version)

	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.requiredOption('--target <value>', 'target context to use');

program
	.command('etherscan')
	.description('submit contract for verification to etherscan')
	.option('--endpoint <value>', 'endpoint to connect to')
	.option('--license <value>', 'source code license')
	.option('--force-license', 'force the use of the license provided')
	.action(async (options: {endpoint?: string; forceLicense: boolean; license: string}) => {
		const {target, ...programOptions} = program.opts();;
		const resolvedConfig = await readConfig({...programOptions});
		run(resolvedConfig, target, {
			verifier: {
				type: 'etherscan',
				apiKey: process.env['ETHERSCAN_API_KEY'],
				endpoint: options.endpoint,
				forceLicense: options.forceLicense,
				license: options.license,
			},
		});
	});

program
	.command('sourcify')
	.description('submit contract for verification to sourcify')
	.option('--endpoint <value>', 'endpoint to connect to')
	.action(async (options: {endpoint?: string}) => {
		const {target, ...programOptions} = program.opts();;
		const resolvedConfig = await readConfig({...programOptions});
		run(resolvedConfig, target,  {verifier: {type: 'sourcify', endpoint: options.endpoint}});
	});

program
	.command('blockscout')
	.description('submit contract for verification to blockscout')
	.option('--endpoint <value>', 'endpoint to connect to')
	// .option('--api <value>', 'api version (default to v2)')
	.action(async (options: {endpoint?: string}) => {
		const {target, ...programOptions} = program.opts();;
		const resolvedConfig = await readConfig({...programOptions});
		run(resolvedConfig, target, {verifier: {type: 'blockscout', endpoint: options.endpoint}});
	});

program
	.command('metadata')
	.description('export metadata')
	.option('--out <value>', 'folder to write metadata into')
	.action(async (options: {out?: string}) => {
		const {target, ...programOptions} = program.opts();;
		const resolvedConfig = await readConfig({...programOptions});
		exportMetadata(resolvedConfig, target, {out: options.out || '_metadata'});
	});

program.parse(process.argv);
