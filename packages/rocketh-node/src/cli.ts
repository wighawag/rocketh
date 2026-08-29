#! /usr/bin/env node
import {hookup, setupLogger} from 'named-logs-console';
import {loadEnv} from 'ldenv';
import pkg from '../package.json' with {type: 'json'};
import {loadAndExecuteDeploymentsFromFiles} from './executor/index.js';
import {ExecutionParams} from 'rocketh/types';
import {packagesWithLogsEnabled} from './index.js';
import {buildCLIProgram, toExecutionParams, type RockethCLIOptions} from './cli-options.js';

hookup();
loadEnv();

const program = buildCLIProgram(pkg.version);
program.parse(process.argv);

const options = program.opts<RockethCLIOptions>();

let logLevelAsNumber = 3;
if (options.logLevel) {
	logLevelAsNumber = parseInt(options.logLevel);
	if (isNaN(logLevelAsNumber)) {
		switch (options.logLevel) {
			case 'error':
				logLevelAsNumber = 1;
				break;
			case 'warn':
				logLevelAsNumber = 2;
				break;
			case 'info':
				logLevelAsNumber = 3;
				break;
			case 'debug':
				logLevelAsNumber = 4;
				break;
			case 'trace':
				logLevelAsNumber = 5;
				break;
		}
	}
}

setupLogger(packagesWithLogsEnabled, {
	enabled: true,
	level: logLevelAsNumber,
});

// The whole boundary, in one typed call (see `toExecutionParams`). It REFUSES an option value core
//  cannot accept by throwing, and reporting that refusal is the bin script's job: a bad flag is a
//  message on stderr and a non-zero exit, not a stack trace.
let executionParams: ExecutionParams;
try {
	executionParams = toExecutionParams(options);
} catch (err) {
	console.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
}

loadAndExecuteDeploymentsFromFiles(executionParams);
