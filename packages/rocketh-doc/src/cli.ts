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
	.description('generate doc from deployments and provided templates')
	.version(pkg.version)
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	.option('-o, --output <value>', 'folder where to generate docs')
	.option('-t, --template <value>', 'template used to generate docs')
	.requiredOption('-n, --network <value>', 'network context to use')
	.parse(process.argv);

const options = program.opts();
const resolvedConfig = readAndResolveConfig(options as ConfigOptions, {ignoreMissingRPC: true});
run(resolvedConfig, options);
