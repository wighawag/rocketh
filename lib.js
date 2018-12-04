const Web3 = require('web3'); // TODO use lightweight http provider
const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const semver = require('semver');

function requireLocal(moduleName) {
    // TODO go up the file hierarchy and then require the moduleName if all else fails. rocketh could provide a default
    return require(path.resolve('./node_modules/' + moduleName));
}


const traverse = function(dir, result = []) {
    fs.readdirSync(dir).forEach((name) => {
        const fPath = path.resolve(dir, name);
        const stats = fs.statSync(fPath);
        const fileStats = { name, path: fPath, mtimeMs: stats.mtimeMs };
        if (stats.isDirectory()) {
            result.push(fileStats);
            return traverse(fPath, result)
        }
        result.push(fileStats);
    });
    return result;
};

// TODO : config to allow specify non-default paths
const contractSrcPath = 'src';
const contractBuildPath = 'build';
const cachePath = contractBuildPath + '/.compilationOutput.json';
const cacheCompilationResult = true;
const showErrorsFromCache = false;
const stagesPath = 'stages';
const deploymentsPath = 'deployments';
let deploymentsFolderCreated = false;
let contractBuildFolderCreated = false;

let artifacts = {}
let contractInfos = {}
let compilationDone = false;
let initialised = false;
let provider;
let deployments = {};

const rocketh = {
    runStages: () => runStages(false),
    artifact: (name) => {
        if (!initialised) {
            console.error(colors.red('rocketh is not fully initialised yet, in mocha it can only be used in hooks or it, as describe is run before rocketh can be setup'));
            console.trace();
            process.exit(1);
        }
        return artifacts[name];
    },
    contractInfo: (name) => {
        if (!compilationDone) {
            console.error(colors.red('rocketh is not fully initialised yet, in mocha it can only be used in hooks or it, as describe is run before rocketh can be setup'));
            console.trace();
            process.exit(1);
            return null;
        }
        return contractInfos[name];
    }
}

function setupGlobals(config) {
    config = config || {};
    provider = config.provider || provider;
    if (!provider) {
        const ethereumNodeURl = process.env.ROCKETH_NODE_URL
        if(ethereumNodeURl && ethereumNodeURl !== '') {
            console.log('connecting to ROCKETH_NODE_URL=' + ethereumNodeURl);
            provider = new Web3.providers.HttpProvider(ethereumNodeURl);
        } else {
            console.log('ganache...');
            try{
                ganache = requireLocal('ganache-cli');
                console.log(colors.green('using ganache-cli from dependencies'));
            } catch(e) {
                console.error(colors.red('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli"'));
                // TODO config own provider + defaults like nodeUrl, ganache-cli with privateKey signer...
                process.exit(1);
            }
            provider = ganache.provider({debug: true}); //, vmErrorsOnRPCResponse: false}); //, logger: console});
            provider.setMaxListeners(400); // TODO is there a leak or do we need to up that limit (warning was at 11)
        }
    }

    rocketh.ethereum = provider;
    global.ethereum = provider;

    if(config.addRocketh) {
        global.rocketh = rocketh;
    }
    return rocketh;
}

function compile(solc, resolve, reject, runAsScript) {
    const files = traverse(contractSrcPath);
    const sources = {};
    let latestMtimeMs = 0;
    for (const file of files) {
        if(file.name.indexOf('.sol') === file.name.length - 4) {
            latestMtimeMs = Math.max(latestMtimeMs, file.mtimeMs);
            const relativePath = path.relative(contractSrcPath, file.path).replace(/\\/g, '/');
            sources[relativePath] = {
                content: fs.readFileSync(file.path).toString()
            };
        }
    }
    
    //TODO latestMtimeMs will need to take into account compiler version change / config change ....

    
    // TODO : config // merge from File ? add sources...
    let solcConfig = JSON.stringify({
        language: "Solidity",
        sources,
        settings: {
            optimizer: {
                enabled: true,
                runs: 2000
            },
            outputSelection: {
                "*": {
                    "*": [ "abi", "evm.bytecode" ]
                }
            }
        }
    });

    const solcVersion = solc.semver();
    let optimize = undefined;
    const pre_0_5_0_solc = semver.lt(solcVersion, '0.5.0');
    const pre_0_4_11_solc = semver.lt(solcVersion, '0.4.11');
    if (pre_0_4_11_solc) {
        console.error(colors.red('you are using a too old solc version, rocketh only support solc >= 0.4.11'));
        process.exit(1);

        // TODO remove ?

        solcConfig = { sources : {} };
        for (const filePath of Object.keys(sources)) {
            solcConfig.sources[filePath] = sources[filePath].content;
        }
        optimize = 1;
    }
    
    console.log(colors.green('using solc : ' + solcVersion));

    
    let rawOutput;
    let cachePathMTimeMS = 0;
    let usingCache = false;
    try{
        cachePathMTimeMS = fs.statSync(cachePath).mtimeMs;
    } catch(e) {}
    if(latestMtimeMs < cachePathMTimeMS) {
        console.log(colors.blue('########################################## FROM CACHE ############################################################'));
        rawOutput = fs.readFileSync(cachePath).toString();
        usingCache = true;
    } else {
        console.log(colors.green('########################################### COMPILING #############################################################'));
        if(pre_0_5_0_solc && !pre_0_4_11_solc) {
        rawOutput = solc.compileStandardWrapper(solcConfig, optimize);
        } else {
            rawOutput = solc.compile(solcConfig, optimize);
        }
    }

    const output = JSON.parse(rawOutput);    
    
    const warnings = [];
    const errors = [];
    const others = []; // TODO
    if(output.errors && (!usingCache || showErrorsFromCache)) {
        for(const error of output.errors) {
            if(error.severity === 'warning') {
                //TODO filter warning based on // ignore comments , example "// ignore:26:5: Warning: Function state mutability can be restricted to pure"
                // read file content, get the line, find the // ignore: pattern and disable warning if match
                warnings.push(error);
            } else if(error.severity === 'error') {
                errors.push(error);
            } else {
                others.push(error);
            }
        }
    }
    
    if(errors.length > 0) {
        for (const error of errors) {
            console.log(colors.red(error.formattedMessage));
        }
        console.log(colors.red('###################################################################################################################'));
        reject();
    } else {
        for (const warning of warnings) {
            console.log(colors.yellow(warning.formattedMessage));
        }
        for (const other of others) {
            console.log(colors.cyan(other.formattedMessage));
        }
        const bar = '###################################################################################################################';
        if(usingCache) {

            if(showErrorsFromCache) {
                console.log(colors.blue('########################################## FROM CACHE ############################################################'));
            }
        } else {
            console.log(colors.green(bar));
        }
        
        for (const fileName of Object.keys(output.contracts)) {
            for (const contractName of Object.keys(output.contracts[fileName])) {
                const contractInfo = output.contracts[fileName][contractName];
                const content = JSON.stringify(contractInfo, null, '  ');
                if(contractName === "") {
                    contractName = fileName; // TODO remove extension ?
                }
                if (cacheCompilationResult) {
                    if(!contractBuildFolderCreated) {
                        try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                        contractBuildFolderCreated = true;
                    }
                    fs.writeFileSync(cachePath, rawOutput);
                }
                if (runAsScript) {
                    if(!contractBuildFolderCreated) {
                        try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                        contractBuildFolderCreated = true;
                    }
                    fs.writeFileSync(contractBuildPath + '/' + contractName + '.json', content);
                }
                contractInfos[contractName] = contractInfo;
            }
        }
        compilationDone = true;
        resolve();
    }
}


async function runStages(runAsScript) {
    // console.log(colors.green('######################################### STAGES ##############################################################'));
    let fileNames;
    try{
        fileNames = fs.readdirSync(stagesPath);
    } catch(e) {
        console.log(colors.green('no stages folder at ./' + stagesPath));
        return artifacts;
    }
    fileNames = fileNames.filter((fileName) => {
        return (!fs.statSync(path.resolve(stagesPath, fileName)).isDirectory());
    });
    fileNames = fileNames.sort((a,b)=>{
        if(a < b) { return -1; }
        if(a > b) { return 1; }
        return 0;
    });
    artifacts= {};
    // console.log('running stage with accounts', rocketh.accounts);
    let argsForStages = [{
        accounts: rocketh.accounts,
        networkId: rocketh.networkId,
        registerArtifact: (name, artifact, deploymentInfo) => {
            if(artifacts[name]){
                console.error(colors.red('artifact with same name ('+name+') exists'));
            } else {
                artifacts[name] = artifact;
                if(deploymentInfo) {
                    const errors = [];
                    if(!deploymentInfo.contractInfo) {
                        errors.push(colors.red('deploymentInfo request field "contractInfo" that was for deployment' ));
                    }
                    if(!deploymentInfo.arguments) {
                        errors.push(colors.red('deploymentInfo request field "arguments" that was used for deployment'));
                    }
                    if(!deploymentInfo.address) {
                        errors.push(colors.red('deploymentInfo request field "address" of the deployed contract'));
                    }
                    if(errors.length > 0 ){
                        for(const error of errors) {
                            console.error(error);
                        }
                    } else {
                        // TODO clone info passed in
                        deploymentInfo.networks = {};
                        deploymentInfo.networks[rocketh.networkId] = deploymentInfo.address;
                        delete deploymentInfo.address
                        deployments[name] = deploymentInfo;
                        if (runAsScript) {
                            console.log('contract ' + name + ' deployed at ' + deploymentInfo.address);
                            if(!deploymentsFolderCreated) {
                                try { fs.mkdirSync(deploymentsPath); } catch(e) {}
                                deploymentsFolderCreated = true;
                            }
                            const content = JSON.stringify(deploymentInfo, null, '  ');
                            fs.writeFileSync(deploymentsPath + '/' + name + '.json', content);
                        }
                    }
                }
            }
        } 
    }];
    
    for (const fileName of fileNames) {
        const migrationFilePath = path.resolve(".") + '/' + stagesPath + '/' + fileName;
        // console.log('running ' + migrationFilePath);
        const stageFunc = require(migrationFilePath);
        await stageFunc.apply(null, argsForStages);
    }
    // console.log(colors.green('###################################################################################################################'));
    return artifacts;
}

function deployContract(contractInfo, arguments) {
    provider.send({id:1, method:'eth_sendTransaction', params:[{
        from:rocketh.accounts[0],
        gas: options.gas || 0x6691b7, //TODO configure default gas
        value: options.value,
        data: contractInfo.evm.bytecode.object // TODO required o be enabled // TODO add arguments
    }]}, (error, txHash) => {
        if (error) {
            reject(error);
        } else {
            provider.send({id:1, method:'eth_sendTransaction', params:[{}]}, (error, receipt) => {
                //TODO wait until it succeed
                if (error) {
                    reject(error);
                } else {
                    resolve(receipt);
                }
            });
        }
        // TODO get eth_transactionReceipt to save contract data
    });
}

function fetchAccounts() {
    return new Promise((resolve, reject) => {
        provider.send({id:1, method:'eth_accounts', params:[]}, (error, json) => {
            if (error) {
                reject(error);
            } else {
                rocketh.accounts = json.result;
                resolve(json.result);
            }
        })
    })
}

function fetchNetwork() {
    return new Promise((resolve, reject) => {
        provider.send({id:2, method:'net_version', params:[]}, (error, json) => {
            if (error) {
                reject(error);
            } else {
                rocketh.networkId = json.result;
                resolve(json.result);
            }
        })
    })
}

let promise
function setup(runAsScript) {
    if(promise) {
        throw new Error('already setup in progress');
    }

    // compilation :
    promise = new Promise((resolve, reject) => {
        let solc;
        try{
            solc = requireLocal('solc');
        } catch(e) {
            console.error(colors.red('you need to install your desired solc compiler in your own project: "npm install solc"'));
            process.exit(1);
        }
        
        compile(solc, resolve, reject, runAsScript);
    });

    promise = promise.then(fetchAccounts);

    promise = promise.then(fetchNetwork);

    promise = promise.then(() => runStages(runAsScript));

    promise = promise.then(() => { 
        initialised = true;
        return {
            networkId: rocketh.networkId,
            accounts : rocketh.accounts,
            deployments,
            artifacts,
            contractInfos
        };
    })

    return promise;
}

function waitForMocha(doSomething) { // TODO rename to setupAndWaitForMocha
    promise = setup()
    if(doSomething) {
        promise = promise.then(doSomething)
    }
    promise.then(() => {
        if(global.run) {
            global.run();
        } else {
            let intervalId;
            intervalId = setInterval(() =>{ // wait for global.run to be available
                if(global.run) {
                    clearInterval(intervalId);
                    global.run();
                }
            }, 200)
        }
    });
}

module.exports = {
    setup,
    setupGlobals,
    runStages,
    waitForMocha,
    rocketh,
    requireLocal
}
