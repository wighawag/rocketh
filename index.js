#!/usr/bin/env node
const Web3 = require('web3'); // TODO use lightweight http provider
const {
    setupGlobals,
    setup,
    runStages,
    rocketh
} = require('./lib');


if(require.main === module) {
    const yargs = require('yargs');
    yargs.command('launch [nodeUrl]', 'run stages on node ', (yargs) => {
        yargs
        .positional('nodeUrl', {
            describe: 'nodeUrl to bind on',
            default: 'http://localhost:8545'
        })
        }, (argv) => {

            let configFromFile = null;
            try{
                configFromFile = require('./rocketh.config.js')
            } catch(e) {

            }

            if(configFromFile) {
                setupGlobals(configFromFile);
                setup(configFromFile);
            } else {
                if (argv.verbose) console.info(`connect on :${argv.nodeUrl}`);
                setupGlobals({
                    provider: new Web3.providers.HttpProvider(argv.nodeUrl) // TODO pass node uri in arguments
                });
                setup({runAsScript: true});
            }
            
        })
    .option('verbose', {
        alias: 'v',
        default: false
    })
    .argv
} else {
    if (!global.ethereum) { // not setup yet
        rocketh.launch = (config) => {
            if(!config) {
                config = {};
            } else if(typeof config === 'string') {
                config = {
                    nodeUrl: config
                }
            }
            if (config.nodeUrl) {
                config.provider = new Web3.providers.HttpProvider(config.nodeUrl);
            }
            setupGlobals(config); // TODO merge the two
            return setup(config);
        }
    }
}

module.exports = rocketh;
