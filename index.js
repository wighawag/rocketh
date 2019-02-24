#!/usr/bin/env node

const {
    attach,
    compile,
    runStages,
    runNode,
    rocketh,
    cleanDeployments
} = require('./run');

let config = null;
try{
    config = require('./rocketh.config.js')
} catch(e) {
    config = {};
}

const deploymentChainIds = ['1','3','4','42', '1550250818351']; // TODO config

if(require.main === module) {
    const minimist = require('minimist'); 
    const spawn = require('cross-spawn');
    const {onExit} = require('@rauschma/stringio');

    const argv = process.argv.slice(2);
    const parsedArgv = minimist(argv);
    const command = parsedArgv._[0];
    // console.log(argv);
    // console.log(parsedArgv);
    let commandIndex = argv.indexOf(command,0);
    while(commandIndex % 2 != 0) {
        commandIndex = argv.indexOf(command, commandIndex+1);
    }
    // console.log('commandIndex', commandIndex);

    const start = parsedArgv._[1];
    let startIndex = argv.indexOf(start,0);
    while(startIndex % 2 != 1) {
        startIndex = argv.indexOf(start, startIndex+1);
    }
    
    // console.log('startIndex', startIndex);

    const generalOptions = minimist(argv.slice(0, commandIndex));
    // console.log('generalOptions', generalOptions);
    const commandOptions = minimist(argv.slice(commandIndex+1, startIndex));
    // console.log('commandOptions', commandOptions);
    
    execute(argv[startIndex], ...argv.slice(startIndex+1));
    
    let _chainId;
    async function execute(command, ...args) {
        process.stdin.resume();//so the program will not close instantly

        function cleanup(exitCode) {
            if(_chainId && deploymentChainIds.indexOf(chainId) == -1) {
                cleanDeployments();
            }
            process.exit(exitCode);
        }

        //do something when app is closing
        process.on('exit', cleanup);
        //catches ctrl+c event
        process.on('SIGINT', cleanup);
        // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR1', cleanup);
        process.on('SIGUSR2', cleanup);
        //catches uncaught exceptions
        process.on('uncaughtException', cleanup);

        if(commandOptions.n) {
            config.url = commandOptions.n;
        }

        // console.log('execute', command, ...args);
        const contractInfos = await compile(config);
        const {chainId, url, accounts} = await runNode(config);
        _chainId = chainId;
        
        const result = attach(config, {chainId, url, accounts}, contractInfos);
        await runStages(result.rocketh.ethereum, config, contractInfos, result.deployments);
        const childProcess = spawn(
            command,
            args,
            {
                stdio: [process.stdin, process.stdout, process.stderr],
                env:{
                    _ROCKETH_NODE_URL: url,
                    _ROCKETH_CHAIN_ID: chainId,
                    _ROCKETH_ACCOUNTS: accounts.join(',')
                }
            }
        );
        const exitCode = await onExit(childProcess);
        cleanup(exitCode)
    }

} else {
    attach(config, {}); 
}

module.exports = rocketh;
