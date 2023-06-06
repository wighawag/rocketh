#! /usr/bin/env node
import {loadEnv} from 'ldenv';
import {loadAndExecuteDeployments, readConfig} from '.';
import {Command, Option} from 'commander';
import pkg from '../package.json';
import figlet from 'figlet';

loadEnv();

console.log(`------------------------------------------------`);
console.log(figlet.textSync('rocketh'));
console.log(`------------------------------------------------`);

const commandName = `rocketh`;

const program = new Command();
program
	.name(commandName)
	.version(pkg.version)
	.usage(`${commandName}`)
	.description('execute deploy scripts and store the deployments')
	.option('-s, --scripts <value>', 'path the folder containing the deploy scripts to execute')
	// .addOption(
	// 	new Option('-n, --node-url <value>', `ethereum's node url (fallback on ETHEREUM_NODE env variable)`).env(
	// 		'ETHEREUM_NODE'
	// 	)
	// )
	.option('-t, --tags <value>', 'comma separated list of tags to execute')
	.option('-d, --deployments <value>', 'folder where deployments are saved')
	// .option('-w, --watch', 'watch mode')
	.requiredOption('-n, --network <value>', 'network context to use')
	.parse(process.argv);

const options = program.opts();
const config = readConfig(options as any);

loadAndExecuteDeployments(config);
