#!/usr/bin/env node

const {
    attach,
    compile,
    runStages,
    runNode,
    rocketh
} = require('./run');

let config = null;
try{
    config = require('./rocketh.config.js')
} catch(e) {
    config = {};
}

if(require.main === module) {
    const minimist = require('minimist'); 
    const spawn = require('cross-spawn');
    const {onExit} = require('@rauschma/stringio');

    const argv = process.argv.slice(2);
    const parsedArgv = minimist(argv);
    const command = parsedArgv._[0];
    let commandIndex = argv.indexOf(command,0);
    while(commandIndex % 2 != 0) {
        commandIndex = argv.indexOf(command, commandIndex+1);
    }
    
    execute(argv[commandIndex+1], ...argv.slice(commandIndex+2));
    
    async function execute(command, ...args) {
        const contractInfos = await compile(config);
        const {chainId, url, accounts} = await runNode(config);
        console.log('running stages on node at ' + url + ' ...');
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
        process.exit(exitCode);
    }

} else {
    attach(config, {}); 
}

module.exports = rocketh;
