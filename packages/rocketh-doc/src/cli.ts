#! /usr/bin/env node
import {run} from './index.js';
import {Command} from 'commander';
import pkg from '../package.json' with {type: 'json'};
import {RunOptions} from './index.js';
import {readAndResolveConfig} from '@rocketh/node';
import type {ConfigOverrides} from '@rocketh/core/types';

const commandName = 'rocketh-doc';

const program = new Command();
program
	.name(commandName)
	.description('generate doc from deployments and provided templates')
	.version(pkg.version)
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.option('-o, --output <value>', 'folder where to generate docs')
	.option('-t, --template <value>', 'template used to generate docs')
	.option('--except-suffix <suffix, suffix....>', 'ignore contract that ends with the provided suffixes')
	.requiredOption('-e, --environment <value>', 'environment context to use')
	.parse(process.argv);

const {environment, ...options} = program.opts();
options.exceptSuffix = options.exceptSuffix?.split(',') || [];
const resolvedConfig = await readAndResolveConfig({...(options as ConfigOverrides)});
run(resolvedConfig, environment, options as RunOptions);
