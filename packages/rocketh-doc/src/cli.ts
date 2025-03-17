#! /usr/bin/env node
import {readAndResolveConfig} from 'rocketh';
import {run} from './index.js';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {ConfigOptions} from 'rocketh';
import {RunOptions} from './index.js';

const commandName = "rocketh-doc";

const program = new Command();
program
	.name(commandName)
	.description('generate doc from deployments and provided templates')
	.version(pkg.version)
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.option('-o, --output <value>', 'folder where to generate docs')
	.option('-t, --template <value>', 'template used to generate docs')
	.option('--except-suffix <suffix, suffix....>', 'ignore contract that ends with the provided suffixes')
	.requiredOption('-n, --network <value>', 'network context to use')
	.parse(process.argv);

const options = program.opts();
options.exceptSuffix = options.exceptSuffix?.split(',') || [];
const resolvedConfig = await readAndResolveConfig({...(options as ConfigOptions), ignoreMissingRPC: true});
run(resolvedConfig, options as RunOptions);
