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
const cacheOutputPath = contractBuildPath + '/.compilationOutput.json';
const cacheInputPath = contractBuildPath + '/.compilationInput.json';
const cacheCompilationResult = true;
const showErrorsFromCache = false;
const stagesPath = 'stages';
const deploymentsPath = 'deployments';
let silent = false;
const generateTruffleBuildFiles = true;

function log(...args) {
    if(silent) { return; }
    console.log.apply(console, args);
}


// TODO
// const showContractWithNoByteCode = false;
// const doNotIncludeContractWithoutByteCode = false; // TODO better : const excludeEmptyContract (abstract and interface)
// TODO warn of non-used interface and abstract contract (at least those located in src folder)

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
    silent = config.silent;
    provider = config.provider || provider;
    if (!provider) {
        const ethereumNodeURl = process.env.ROCKETH_NODE_URL
        if(ethereumNodeURl && ethereumNodeURl !== '') {
            log('connecting to ROCKETH_NODE_URL=' + ethereumNodeURl);
            provider = new Web3.providers.HttpProvider(ethereumNodeURl);
        } else {
            log('ganache...');
            try{
                ganache = requireLocal('ganache-cli');
                log(colors.green('using ganache-cli from dependencies'));
            } catch(e) {
                console.error(colors.red('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli"'));
                // TODO config own provider + defaults like nodeUrl, ganache-cli with privateKey signer...
                process.exit(1);
            }
            provider = ganache.provider({debug: true}); //, vmErrorsOnRPCResponse: false}); //, logger: console});
            provider.setMaxListeners(1000000); // TODO is there a leak or do we need to up that limit (warning was at 11)
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

    
    const solcVersion = solc.semver();
    const pre_0_5_0_solc = semver.lt(solcVersion, '0.5.0');
    const pre_0_4_11_solc = semver.lt(solcVersion, '0.4.11');
    if (pre_0_4_11_solc) {
        console.error(colors.red('you are using a too old solc version, rocketh only support solc >= 0.4.11'));
        process.exit(1);
    }
    
    log(colors.green('using solc : ' + solcVersion));

    // TODO : config // merge from File ? add sources...
    const solcConfig = JSON.stringify({
        language: "Solidity",
        //TODO add compiler info in some way to not use cache when compiler version is different // extra fields were fine prior to 0.5.1 or 0.5.2
        // compiler: {
        //     name: "solc",
        //     version: solcVersion
        // },
        sources,
        settings: {
            optimizer: {
                enabled: true,
                runs: 2000
            },
            outputSelection: {
                "*": {
                    "*": [ "abi", "evm.bytecode", "metadata", "evm.deployedBytecode"],
                    "": [ "ast" ]
                },
            }
        }
    }, null, '  ');
    
    let rawOutput;
    let cachePathMTimeMS = 0;
    let usingCache = false;
    try{
        cachePathMTimeMS = fs.statSync(cacheOutputPath).mtimeMs;
    } catch(e) {}
    if(latestMtimeMs < cachePathMTimeMS) {
        let lastInput = '';
        try{ 
            lastInput = fs.readFileSync(cacheInputPath).toString(); // TODO buffer and stream check checksum
        } catch(e) {}
        const sameInput = lastInput === solcConfig;
        if(!sameInput) {
            log('config changed...');
        } else {
            usingCache = true;
            // TODO expose the info that cache is being used so that test runner can skip test that did not change
        }
    }

    if(!usingCache) {
        log(colors.green('########################################### COMPILING #############################################################'));
        if(pre_0_5_0_solc && !pre_0_4_11_solc) {
            rawOutput = solc.compileStandardWrapper(solcConfig);
        } else {
            rawOutput = solc.compile(solcConfig);
        }
    } else {
        log(colors.blue('########################################## FROM CACHE ############################################################'));
        rawOutput = fs.readFileSync(cacheOutputPath).toString();
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
            log(colors.red(error.formattedMessage));
        }
        log(colors.red('###################################################################################################################'));
        reject();
    } else {
        
        if (cacheCompilationResult) {
            if(!contractBuildFolderCreated) {
                try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                contractBuildFolderCreated = true;
            }
            const solcOutput = JSON.parse(rawOutput);
            fs.writeFileSync(cacheOutputPath, JSON.stringify(solcOutput, null, '  '));
            fs.writeFileSync(cacheInputPath, solcConfig);
        }

        for (const warning of warnings) {
            log(colors.yellow(warning.formattedMessage));
        }
        for (const other of others) {
            log(colors.cyan(other.formattedMessage));
        }
        const bar = '###################################################################################################################';
        if(usingCache) {

            if(showErrorsFromCache) {
                log(colors.blue('########################################## FROM CACHE ############################################################'));
            }
        } else {
            log(colors.green(bar));
        }
        
        for (const filePath of Object.keys(output.contracts)) {
            for (const contractName of Object.keys(output.contracts[filePath])) {
                const contractInfo = output.contracts[filePath][contractName];
                const content = JSON.stringify(contractInfo, null, '  ');
                if(contractName === "") {
                    contractName = filePath.substr(filePath.lastIndexOf('/')); // TODO remove extension?
                }
                if (runAsScript) {
                    if(!contractBuildFolderCreated) {
                        try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                        contractBuildFolderCreated = true;
                    }
                    fs.writeFileSync(contractBuildPath + '/' + contractName + '.json', content);
                }
                if(generateTruffleBuildFiles && contractInfo.evm.bytecode.object && contractInfo.evm.bytecode.object != '') {
                    const truffleBuildFile = {
                        bytecode: contractInfo.evm.bytecode.object,
                        sourceMap: contractInfo.evm.bytecode.sourceMap,
                        deployedBytecode: contractInfo.evm.deployedBytecode.object,
                        deployedSourceMap: contractInfo.evm.deployedBytecode.sourceMap,
                        source: sources[filePath].content,
                        sourcePath: filePath,
                        ast: output.contracts[filePath].ast,
                        networks: {}, // TODO 
                        contractName
                    };
                    try { fs.mkdirSync('build'); } catch(e) {}
                    try { fs.mkdirSync('build/contracts'); } catch(e) {}
                    fs.writeFileSync('build/contracts/' + contractName + '.json', JSON.stringify(truffleBuildFile, null, '  '));
                }
                // log('' + contractName + ' compiled');
                contractInfos[contractName] = contractInfo;
                // if (contractInfo.evm
                //     && contractInfo.evm.bytecode
                //     && contractInfo.evm.bytecode.object === '') { // TODO config to skip error
                //     console.warn(colors.yellow('contract ' + contractName + ' do not have bytecode generated'))
                // }
            }
        }
        compilationDone = true;
        resolve();
    }
}


async function runStages(runAsScript) {
    // log(colors.green('######################################### STAGES ##############################################################'));
    let fileNames;
    try{
        fileNames = fs.readdirSync(stagesPath);
    } catch(e) {
        log(colors.green('no stages folder at ./' + stagesPath));
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
    // log('running stage with accounts', rocketh.accounts);
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
                        errors.push(colors.red('deploymentInfo requires field "contractInfo" that was for deployment' ));
                    }
                    if(!deploymentInfo.arguments) {
                        errors.push(colors.red('deploymentInfo requires field "arguments" that was used for deployment'));
                    }
                    if(!deploymentInfo.address) {
                        errors.push(colors.red('deploymentInfo requires field "address" of the deployed contract'));
                    }
                    if(errors.length > 0 ){
                        for(const error of errors) {
                            console.error(error);
                        }
                    } else {
                        const deploymentInfoToSave = {
                            contractInfo: deploymentInfo.contractInfo,
                            arguments: deploymentInfo.arguments,
                            networks: {}
                        };
                        deploymentInfoToSave.networks[rocketh.networkId] = deploymentInfo.address;
                        deployments[name] = deploymentInfoToSave;
                        if (runAsScript) {
                            log('contract ' + name + ' deployed at ' + deploymentInfo.address);
                            if(!deploymentsFolderCreated) {
                                try { fs.mkdirSync(deploymentsPath); } catch(e) {}
                                deploymentsFolderCreated = true;
                            }
                            const content = JSON.stringify(deploymentInfoToSave, null, '  ');
                            fs.writeFileSync(deploymentsPath + '/' + name + '.json', content);
                        }
                        if(generateTruffleBuildFiles) {
                            let truffleBuildFile = null;
                            try{
                                truffleBuildFile = JSON.parse(fs.readFileSync('build/contracts/' + name + '.json').toString());
                            } catch(e) {}
                            if(truffleBuildFile) {
                                truffleBuildFile.networks[rocketh.networkId] = {
                                    // "events": {}, // TODO ?
                                    // "links": {}, // TODO ?
                                    address: deploymentInfo.address.toLowerCase()
                                    // transactionHash:  // TODO ?
                                };
                                fs.writeFileSync('build/contracts/' + name + '.json', JSON.stringify(truffleBuildFile, null, '  '));
                            }
                        }
                    }
                }
            }
        },
        artifact: function(name) {return artifacts[name]}
    }];
    
    for (const fileName of fileNames) {
        const migrationFilePath = path.resolve(".") + '/' + stagesPath + '/' + fileName;
        // log('running ' + migrationFilePath);
        const stageFunc = require(migrationFilePath);
        await stageFunc.apply(null, argsForStages);
    }
    // log(colors.green('###################################################################################################################'));
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
