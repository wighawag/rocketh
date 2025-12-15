#! /usr/bin/env node
import {loadEnv} from 'ldenv';
import {run} from './index.js';
import {Command, Option} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {exportMetadata} from './metadata.js';
import { readAndResolveConfig } from 'rocketh';
loadEnv();

const commandName = `rocketh-verify`;

const program = new Command();
program
	.name(commandName)
	.description('submit contract for verification')
	.version(pkg.version)

	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.requiredOption('-e, --environment <value>', 'environment context to use');

program
	.command('etherscan')
	.description('submit contract for verification to etherscan')
	.option('--endpoint <value>', 'endpoint to connect to')
	.option('--license <value>', 'source code license')
	.option('--force-license', 'force the use of the license provided')
	.option('--min-interval <value>', 'min interval between request in ms')
	.option('--fix-mispell', 'if set, will use correct spelling of form field')
	.action(async (options: {endpoint?: string; forceLicense: boolean; license: string, minInterval?: string, fixMispell?: boolean}) => {
		const {environment, ...programOptions} = program.opts();;
		const resolvedConfig = await readAndResolveConfig({...programOptions});
		run(resolvedConfig, environment, {
			verifier: {
				type: 'etherscan',
				apiKey: process.env['ETHERSCAN_API_KEY'],
				endpoint: options.endpoint,
				forceLicense: options.forceLicense,
				license: options.license,
				fixMispell: options.fixMispell
			},
			minInterval: options.minInterval? parseInt(options.minInterval): undefined,
		});
	});

program
	.command('sourcify')
	.description('submit contract for verification to sourcify')
	.option('--endpoint <value>', 'endpoint to connect to')
	.option('--min-interval <value>', 'min interval between request in ms')
	.action(async (options: {endpoint?: string, minInterval?: string}) => {
		const {environment, ...programOptions} = program.opts();;
		const resolvedConfig = await readAndResolveConfig({...programOptions});
		run(resolvedConfig, environment,  {
			verifier: {
				type: 'sourcify',
				endpoint: options.endpoint
			}, 
			minInterval: options.minInterval? parseInt(options.minInterval): undefined
		});
	});

program
	.command('blockscout')
	.description('submit contract for verification to blockscout')
	.option('--endpoint <value>', 'endpoint to connect to')
	.option('--min-interval <value>', 'min interval between request in ms')
	// .option('--api <value>', 'api version (default to v2)')
	.action(async (options: {endpoint?: string, minInterval?: string}) => {
		const {environment, ...programOptions} = program.opts();;
		const resolvedConfig = await readAndResolveConfig({...programOptions});
		run(resolvedConfig, environment, {
			verifier: {
				type: 'blockscout',
				endpoint: options.endpoint
			},
			minInterval: options.minInterval? parseInt(options.minInterval): undefined
		});
	});

program
	.command('metadata')
	.description('export metadata')
	.option('--out <value>', 'folder to write metadata into')
	.action(async (options: {out?: string}) => {
		const {environment, ...programOptions} = program.opts();;
		const resolvedConfig = await readAndResolveConfig({...programOptions});
		await exportMetadata(resolvedConfig, environment, {out: options.out || '_metadata'});
	});

program.parse(process.argv);
