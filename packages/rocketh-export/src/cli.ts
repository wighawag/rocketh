#! /usr/bin/env node
import {readAndResolveConfig} from '@rocketh/node';
import type {ConfigOverrides} from '@rocketh/core/types';
import {NoDeploymentsError, run} from './index.js';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};

const commandName = 'rocketh-export';

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
		'list of filepath where the typescript export with individual export will be written, separated by commas',
	)
	.option(
		'--jsm <value>',
		'list of filepath where the javascript export  with individual exportwill be written, separated by commas',
	)
	.option('-b, --bytecode', 'if set, the bytecode will also be part of the output')
	.requiredOption('-e, --environment <value>', 'environment context to use')
	.parse(process.argv);

const {environment, ...options} = program.opts();
const resolvedConfig = await readAndResolveConfig({...(options as ConfigOverrides)});
try {
	// Awaited, unlike before: an un-awaited rejection is an unhandled rejection, which is a
	// stack trace on stderr rather than a message a user can act on.
	await run(resolvedConfig, environment, {
		tots: options.ts ? options.ts.split(',') : undefined,
		tojson: options.json ? options.json.split(',') : undefined,
		tojs: options.js ? options.js.split(',') : undefined,
		totsm: options.tsm ? options.tsm.split(',') : undefined,
		tojsm: options.jsm ? options.jsm.split(',') : undefined,
		includeBytecode: options.bytecode,
	});
} catch (err) {
	// An environment with nothing in it is a user-facing condition, not a bug: report it as a
	// message on stderr with a non-zero exit, so a `deploy && export && dev` chain stops here
	// instead of launching against whatever the output file happened to hold before.
	if (err instanceof NoDeploymentsError) {
		console.error(`${commandName}: ${err.message}`);
		process.exit(1);
	}
	throw err;
}
