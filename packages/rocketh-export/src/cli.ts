#! /usr/bin/env node
import {readAndResolveConfig} from 'rocketh';
import {run} from './index.js';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {ConfigOptions} from 'rocketh';

const commandName = "rocketh-export";

const program = new Command();
program
	.name(commandName)
	.description('export deployments to consume elswhere')
	.version(pkg.version)
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.option('--ts <value>', 'list of filepath where the typescript export will be written, separated by commas')
	.option('--js <value>', 'list of filepath where the javascript export will be written, separated by commas')
	.option('--json <value>', 'list of filepath where the json export will be written, separated by commas')
	.option(
		'--tsm <value>',
		'list of filepath where the typescript export with individual export will be written, separated by commas'
	)
	.option(
		'--jsm <value>',
		'list of filepath where the javascript export  with individual exportwill be written, separated by commas'
	)
	.option('-b, --bytecode', 'if set, the bytecode will also be part of the output')
	.requiredOption('-n, --network <value>', 'network context to use')
	.parse(process.argv);

const options = program.opts();
const resolvedConfig = await readAndResolveConfig({...(options as ConfigOptions), ignoreMissingRPC: true});
run(resolvedConfig, {
	tots: options.ts ? options.ts.split(',') : undefined,
	tojson: options.json ? options.json.split(',') : undefined,
	tojs: options.js ? options.js.split(',') : undefined,
	totsm: options.tsm ? options.tsm.split(',') : undefined,
	tojsm: options.jsm ? options.jsm.split(',') : undefined,
	includeBytecode: options.bytecode,
});
