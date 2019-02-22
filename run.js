const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const semver = require('semver');
const portfinder = require('portfinder');
const Web3 = require('web3'); // for provider

const isAlreadyDeployed = (name, bytecode, args) => {
    const currentDeployments = _deployments[name];
    const currentDeployment = currentDeployments && currentDeployments[_chainId] ;
    if(currentDeployment && currentDeployment.contractInfo.evm.bytecode.object == bytecode && Web3.utils.soliditySha3(...currentDeployment.args) == Web3.utils.soliditySha3(...args)){
        return true;
    }
};

const registerDeployment = (name, deploymentInfo) => {
    if(currentDeployments[name]){
        console.error(colors.red('deployment with same name ('+name+') exists'));
    } else {
        const errors = [];
        if(!deploymentInfo.contractInfo) {
            errors.push(colors.red('deploymentInfo requires field "contractInfo" that was for deployment' ));
        }
        if(!deploymentInfo.args) {
            errors.push(colors.red('deploymentInfo requires field "args" that was used for deployment'));
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
                args: deploymentInfo.args,
                address: deploymentInfo.address
            };
            let existingDeployments = _deployments[name];
            if(!existingDeployments) {
                existingDeployments = {};
            }
            existingDeployments[_chainId] = deploymentInfo;
            _deployments[name] = existingDeployments;
            currentDeployments[name] = deploymentInfoToSave;
            
            // if (runAsScript) {
            if(!disableDeploymentSave) {
                // TODO different folder for test blockchain
                // log('contract ' + name + ' deployed at ' + deploymentInfo.address);
                if(!deploymentsFolderCreated) {
                    try { fs.mkdirSync(deploymentsPath); } catch(e) {}
                    // try { fs.mkdirSync(path.join(deploymentsPath, _chainId)); } catch(e) {}
                    deploymentsFolderCreated = true;
                }
                const content = JSON.stringify(existingDeployments, null, '  ');
                fs.writeFileSync(path.join(deploymentsPath, /*chainId,*/ name + '.json'), content);
            }
            // }

            // if(generateTruffleBuildFiles) {
            //     let truffleBuildFile = null;
            //     try{
            //         truffleBuildFile = JSON.parse(fs.readFileSync('build/contracts/' + name + '.json').toString());
            //     } catch(e) {}
            //     if(truffleBuildFile) {
            //         truffleBuildFile.networks[_chainId] = {
            //             // "events": {}, // TODO ?
            //             // "links": {}, // TODO ?
            //             address: deploymentInfo.address.toLowerCase()
            //             // transactionHash:  // TODO ?
            //         };
            //         fs.writeFileSync('build/contracts/' + name + '.json', JSON.stringify(truffleBuildFile, null, '  '));
            //     }
            // }
        }
    }
};

const unlessAlreadyDeployed = async (name, bytecode, args, deploy) =>{
    if(!isAlreadyDeployed(name, bytecode, args)) {
        await deploy(registerDeployment);
    }
};

function requireLocal(moduleName) {
    // TODO if all else fails. rocketh could provide a default
    let currentFolder = path.resolve('./')
    // console.log('currentFolder', currentFolder);
    do {
        try{
            const nodeModule = path.join(currentFolder,'node_modules', moduleName);
            // console.log('trying ' + nodeModule + '...');
            return require(nodeModule);
        } catch(e) {
            // console.error(e);
        }
        currentFolder = path.relative(currentFolder, '..');
    } while (path.resolve(['..', currentFolder]) != currentFolder);

    throw(new Error("can't find module " + moduleName));
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


// TODO : finish config to allow specify :
const cacheCompilationResult = true;
const showErrorsFromCache = false;
const generateTruffleBuildFiles = true;

let silent = false;


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

function executeServer(server, port) {
    return new Promise((resolve, reject) => {
        server.listen(port, function(err, blockchain) {
            if(err) {
                reject(err);     
            } else {
                resolve(blockchain)
            }
        });
    });
}

function compile(config) {
    return new Promise((resolve, reject) => {
        let solc;
        try{
            solc = requireLocal('solc');
        } catch(e) {
            reject('you need to install your desired solc compiler in your own project: "npm install solc');
            return;
        }
        compileWithSolc(solc, resolve, reject, config);
    });
}

async function runNode(config) {
    if(config.url) {
        return config.url;
    } else {
        const ganacheOptions = config.ganacheOptions || {debug: true};
        log('ganache...', ganacheOptions);
        try{
            ganache = requireLocal('ganache-cli');
            log(colors.green('using ganache-cli from dependencies'));
        } catch(e) {
            // console.error(colors.red('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli"'));
            console.error(colors.red(e));
            // TODO config own provider + defaults like nodeUrl, ganache-cli with privateKey signer...
            reject('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli')
        }
        const port = await portfinder.getPortPromise({
            port: 8545,    // minimum port
            stopPort: 9999 // maximum port
        });
        const server = ganache.server(ganacheOptions);
        await executeServer(server, port);
        const url = "http://localhost:" + port;

        const provider = new Web3.providers.HttpProvider(url);
        _chainId = await fetchChainId(provider);
        _accounts = await fetchAccounts(provider);

        return {url, chainId: _chainId, accounts: _accounts};
        // return {url, stop: () => {
        //     server.
        // }};
    }
}

function compileWithSolc(solc, resolve, reject, config) {
    const contractSrcPath = path.join(config.rootPath || './', config.contractSrcPath || 'src');
    const contractBuildPath = path.join(config.rootPath || './', config.contractBuildPath || 'build');
    const cacheOutputPath = contractBuildPath + '/.compilationOutput.json';
    const cacheInputPath = contractBuildPath + '/.compilationInput.json';
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
        
        const contractInfos = {};
        for (const filePath of Object.keys(output.contracts)) {
            for (const contractName of Object.keys(output.contracts[filePath])) {
                const contractInfo = output.contracts[filePath][contractName];
                const content = JSON.stringify(contractInfo, null, '  ');
                if(contractName === "") {
                    contractName = filePath.substr(filePath.lastIndexOf('/')); // TODO remove extension?
                }
                // if (config.runAsScript) {
                    if(!contractBuildFolderCreated) {
                        try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                        contractBuildFolderCreated = true;
                    }
                    fs.writeFileSync(contractBuildPath + '/' + contractName + '.json', content);
                // }
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
        resolve(contractInfos);
    }
}

function extractContractInfos(output) {
    const contractInfos = {};
    for (const filePath of Object.keys(output.contracts)) {
        for (const contractName of Object.keys(output.contracts[filePath])) {
            const contractInfo = output.contracts[filePath][contractName];
            if(contractName === "") {
                contractName = filePath.substr(filePath.lastIndexOf('/')); // TODO remove extension?
            }
            contractInfos[contractName] = contractInfo;
        }
    }
    return contractInfos;
}

function extractDeployments(deploymentsPath) {
    const deployments = {};
    const files = traverse(deploymentsPath);
    for (const file of files) {
        if(file.name.indexOf('.json') === file.name.length - 5) {
            deployments[file.name.substr(0,file.name.length - 5)] = JSON.parse(fs.readFileSync(file.path).toString());
        }
    }
    return deployments;
}


function fetchAccounts(provider) {
    return new Promise((resolve, reject) => {
        try{
            provider.send({id:1, method:'eth_accounts', params:[]}, (error, json) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(json.result);
                }
            })
        } catch(e) { // to work with old provider
            provider.sendAsync({id:1, method:'eth_accounts', params:[]}, (error, json) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(json.result);
                }
            })
        }
        
    })
}

function fetchChainId(provider) {
    return new Promise((resolve, reject) => {
        try{
            provider.send({id:2, method:'net_version', params:[]}, (error, json) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(json.result);
                }
            })
        }catch(e) {  // to work with old provider
            provider.sendAsync({id:2, method:'net_version', params:[]}, (error, json) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(json.result);
                }
            })
        }
        
    })
}

// cache
let _chainId;
let _accounts;
let currentDeployments = {};
let disableDeploymentSave;
async function runStages(provider, config, contractInfos, deployments) {

    disableDeploymentSave = !deployments;
    _deployments = deployments || {}; // override 

    const stagesPath = path.join(config.rootPath || './', config.stagesPath || 'stages');
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

    currentDeployments = {};

    // log('running stage with accounts', accounts);
    let argsForStages = [{
        contractInfo: (name) => contractInfos[name],
        accounts: _accounts,
        networkId: _chainId,
        registerDeployment,
        deployment: function(name) {return currentDeployments[name]},
        isAlreadyDeployed,
        unlessAlreadyDeployed
    }];
    
    for (const fileName of fileNames) {
        const migrationFilePath = path.resolve(".") + '/' + stagesPath + '/' + fileName;
        // log('running ' + migrationFilePath);
        const stageFunc = require(migrationFilePath);
        await stageFunc.apply(null, argsForStages);
    }
    // log(colors.green('###################################################################################################################'));
    return _deployments;
}


let _savedConfig;
let _contractInfos;
let _deployments;
let _ethereum;

const rocketh = {
    runStages: () => runStages(_ethereum, _savedConfig, _contractInfos), // empty deployment for running Stages : blank canvas for testing
    deployment: (name) => {
        return _deployments[name][_chainId];
    },
    contractInfo: (name) => {
        return _contractInfos[name];
    },
    unlessAlreadyDeployed,
    isAlreadyDeployed,
    registerDeployment
}

let deploymentsPath;

function attach(config, {url, chainId, accounts}, contractInfos, deployments) {
    
    _savedConfig = config;
    deploymentsPath = path.join(config.rootPath || './', config.deploymentsPath || 'deployments');
    
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
        _deployments = extractDeployments(deploymentsPath);
    }

    const ethereumNodeURl = url || process.env._ROCKETH_NODE_URL;
    rocketh.chainId = _chainId = chainId || process.env._ROCKETH_CHAIN_ID;
    rocketh.accounts = _accounts = accounts || process.env._ROCKETH_ACCOUNTS.split(',');
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
    runStages,
    runNode,
    compile,
    attach,
    rocketh
}
