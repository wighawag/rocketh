const Web3 = require('web3'); // TODO use lightweight http provider
const colors = require('colors/safe');
const {runStages, extractContractInfos, extractDeployment} = require('./run.js');
const path = require('path');
const fs = require('fs');

let _contractInfos;
let _deployments;


// TODO remove duplication
let silent = false;
function log(...args) {
    if(silent) { return; }
    console.log.apply(console, args);
}

let savedConfig;
let rocketh;
let chainId;
let _ethereum;

rocketh = {
    runStages: () => runStages(_ethereum, savedConfig, _contractInfos), // empty deployment for running Stages : blank canvas for testing
    deployment: (name, chainId) => {
        return _deployments[name][chainId];
    },
    contractInfo: (name) => {
        return _contractInfos[name];
    }
}

function attach(config, url, contractInfos, deployments) {
    
    savedConfig = config;
    
    if(rocketh.ethereum) {
        //already setup
        log('aleready setup');
        return rocketh;
    }

    if(!_contractInfos) {
        _contractInfos = contractInfos;
    }

    if(!_contractInfos){
        // TODO remove duplic :
        const contractBuildPath = path.join(config.rootPath || './', config.contractBuildPath || 'build');
        const cacheOutputPath = contractBuildPath + '/.compilationOutput.json';
        _contractInfos = extractContractInfos(JSON.parse(fs.readFileSync(cacheOutputPath).toString()), contractBuildPath);
    }

    if(!_deployments) {
        _deployments = deployments;
    }

    if(!_deployments){
        // TODO remove duplic :
        const deploymentsPath = path.join(config.rootPath || './', config.deploymentsPath || 'deployments');
        _deployments = extractDeployments(deploymentsPath);
    }

    const ethereumNodeURl = url || process.env.ROCKETH_NODE_URL;
    let provider;
    if(ethereumNodeURl && ethereumNodeURl !== '') {
        log('connecting to ROCKETH_NODE_URL=' + ethereumNodeURl);
        provider = new Web3.providers.HttpProvider(ethereumNodeURl);
    } else {
        console.error(colors.red('ROCKETH_NODE_URL not set'));
        process.exit(1);
        // log('ganache...', ganacheOptions);
        // try{
        //     ganache = requireLocal('ganache-cli');
        //     log(colors.green('using ganache-cli from dependencies'));
        // } catch(e) {
        //     console.error(colors.red('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli"'));
        //     // TODO config own provider + defaults like nodeUrl, ganache-cli with privateKey signer...
        //     process.exit(1);
        // }
        // provider = ganache.provider(ganacheOptions); //, vmErrorsOnRPCResponse: false}); //, logger: console});
        // provider.setMaxListeners(1000000); // TODO is there a leak or do we need to up that limit (warning was at 11)
    }

    _ethereum = provider;
    rocketh.ethereum = provider;
    global.ethereum = provider;

    if(config.addRocketh) {
        global.rocketh = rocketh;
    }
    return {
        rocketh,
        contractInfos: _contractInfos,
        deployments: _deployments
    };
}


module.exports = {
    attach
}
