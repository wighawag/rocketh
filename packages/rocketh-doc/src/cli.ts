#! /usr/bin/env node
import {run} from './index.js';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {RunOptions} from './index.js';
import { ConfigOverrides, readAndResolveConfig } from 'rocketh';

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
	.requiredOption('--target <value>', 'target context to use')
	.parse(process.argv);

const {target, ...options} = program.opts();
options.exceptSuffix = options.exceptSuffix?.split(',') || [];
const resolvedConfig = await readAndResolveConfig({...(options as ConfigOverrides)});
run(resolvedConfig, target, options as RunOptions,);
