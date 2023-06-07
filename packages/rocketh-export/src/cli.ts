#! /usr/bin/env node
import {readAndResolveConfig} from 'rocketh';
import {run} from '.';
import {Command} from 'commander';
import pkg from '../package.json';
import {ConfigOptions} from 'rocketh';

const commandName = pkg.name;

const program = new Command();
program
	.name(commandName)
	.description('export deployments to consume elswhere')
	.version(pkg.version)
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.option('--ts <value>', 'list of filepath where the typescript export will be written, separated by commas')
	.option('--js <value>', 'list of filepath where the typescript export will be written, separated by commas')
	.option('--json <value>', 'list of filepath where the typescript export will be written, separated by commas')
	.requiredOption('-n, --network <value>', 'network context to use')
	.parse(process.argv);

const options = program.opts();
const resolvedConfig = readAndResolveConfig(options as ConfigOptions, {ignoreMissingRPC: true});
run(resolvedConfig, {
	tots: options.ts ? options.ts.split(',') : undefined,
	tojson: options.json ? options.json.split(',') : undefined,
	tojs: options.js ? options.js.split(',') : undefined,
});
