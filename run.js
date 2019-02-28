const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const semver = require('semver');
const portfinder = require('portfinder');
const Web3 = require('web3'); // for provider and solidity-sha3
const HDWalletProvider = require('truffle-hdwallet-provider'); // fro provider
const ProviderBridge = require('ethers-web3-bridge'); // for provider
const ethers = require('ethers'); // for provider
const Provider = require('./provider');
const rimraf = require('rimraf');
const spawn = require('cross-spawn');
const {onExit} = require('@rauschma/stringio');
const terminate = require('terminate');
const tmp = require('tmp');
const bip39 = require('bip39');

const isAlreadyDeployed = (name, bytecode, args) => {
    const currentDeployment = _deployments[name];
    if(currentDeployment && currentDeployment.contractInfo.evm.bytecode.object == bytecode && Web3.utils.soliditySha3(...currentDeployment.args) == Web3.utils.soliditySha3(...args)){
        return true;
    }
};

const cleanDeployments = () => {
    try{
        rimraf.sync(path.join(deploymentsPath, _chainId));
    }catch(e){

    }
}

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
            
            _deployments[name] = deploymentInfoToSave;
            currentDeployments[name] = deploymentInfoToSave;
            
            // if (runAsScript) {
            if(!disableDeploymentSave) {
                // TODO different folder for test blockchain
                // log('contract ' + name + ' deployed at ' + deploymentInfo.address);
                if(!deploymentsFolderCreated) {
                    try { fs.mkdirSync(deploymentsPath); } catch(e) {}
                    try { fs.mkdirSync(path.join(deploymentsPath, _chainId)); } catch(e) {}
                    deploymentsFolderCreated = true;
                }
                const content = JSON.stringify(deploymentInfoToSave, null, '  ');
                const filepath = path.join(deploymentsPath, _chainId, name + '.json');
                fs.writeFileSync(filepath, content);
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

let silent = true;


function log(...args) {
    if(silent) { return; }
    console.log.apply(console, args);
}

function errored(...args) {
    console.error.apply(console, args);
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

function spawnGeth(gethPath, args, hookStd, logFile) {

    let stdio;
    if(logFile) {
        fs.writeFileSync(logFile, '');
        var output = fs.openSync(logFile, 'a');
        var output2 = fs.openSync(logFile, 'a');
        stdio = ['ignore', output, output2];
    } else {
        if(hookStd) {
            stdio = [process.stdin, process.stdout, process.stderr];
        } else {
            // const devnull = require('dev-null');
            stdio = ['ignore', 'ignore', 'ignore'];
        }
    }
    return spawn(
        gethPath,
        args,
        {
            stdio,
            env:{
                _GETH_CMD_ARGUMENTS: args.join(' ')
            }
        }
    );
}

async function runNode(config) {
    let url = config.url;
    let mnemonic;
    let exposedMnemonic;
    try{
        mnemonic = fs.readFileSync('./.mnemonic').toString();
    } catch(e) {
        mnemonic = bip39.generateMnemonic()
        exposedMnemonic = mnemonic;
        console.log('mnemonic', mnemonic);
    }

    _accounts = [];
    for(let i = 0; i < 10; i++) { // TODO 10 is config of number of accounts
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/"+i);
        _accounts.push(wallet.address);
        // console.log(wallet.address);
    }
    

    let stop = () => {};

    if(url) {
    } else {
        const port = await portfinder.getPortPromise({
            port: 8545,    // minimum port
            stopPort: 9999 // maximum port
        });

        const wsPort = await portfinder.getPortPromise({
            port: port+1,    // minimum port
            stopPort: 9999 // maximum port
        });

        if(config.node == 'ganache') {
            const ganacheOptions = config.ganacheOptions || {debug: true};
            ganacheOptions.mnemonic = mnemonic;
            log('fireing up ganache...', ganacheOptions);
            try{
                ganache = requireLocal('ganache-cli');
                log(colors.green('using ganache-cli from dependencies'));
            } catch(e) {
                // console.error(colors.red('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli"'));
                console.error(colors.red(e));
                // TODO config own provider + defaults like nodeUrl, ganache-cli with privateKey signer...
                reject('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli')
            }
            
            const server = ganache.server(ganacheOptions);
            await executeServer(server, port);
        } else if(config.node == 'geth') {
            let gethBinary;
            try{
                gethBinary = requireLocal('geth-binary');
            }catch(e) {}
            let gethPath = gethBinary ? gethBinary.path : 'geth';
            console.log('geth path', gethPath);

            /*
            rm -Rf .geth
            <generate .geth/genesis.json>
            printf sesame > .geth/pass
            printf 2bd8fd4e7c04075345677d3127842e737a62db1918beef4cbea6cbc95db0cbdb > .geth/priv
            geth --datadir .geth init .geth/genesis.json
            geth --datadir .geth account import --password .geth/pass .geth/priv
            geth --datadir .geth --syncmode full  --networkid 110 --gasprice 1 --password .geth/pass --unlock 30cb8ee8b1bfacdd5edf8ae9f82e59925263c966 --mine --targetgaslimit 6000000 --rpc --rpcaddr localhost --rpcport 8502 --rpcapi eth,net,web3
            */
            
            var tmpobj = tmp.dirSync();
            const gethDataPath = tmpobj.name;
            rimraf.sync(gethDataPath);
            try { fs.mkdirSync(gethDataPath); } catch(e) {}
            const genesisPath = path.join(gethDataPath, 'genesis.json');
            
            const gethPort = await portfinder.getPortPromise({
                port: 30310,    // minimum port
                stopPort: 39999 // maximum port
            });
            const genesis = {
                config: {
                    chainId:Math.floor(Date.now() / 1000),
                    homesteadBlock: 1,
                    eip150Block: 2,
                    eip150Hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    eip155Block: 3,
                    eip158Block: 3,
                    byzantiumBlock: 4,
                    clique: {
                        period: 0,
                        epoch: 30000
                    }
                },
                nonce: "0x0000000000000042",
                timestamp: "0x00",
                extraData: "0x000000000000000000000000000000000000000000000000000000000000000030cb8ee8b1bfacdd5edf8ae9f82e59925263c9660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                gasLimit: "0x59A5380",
                difficulty: "0x1",
                mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                coinbase: "0x0000000000000000000000000000000000000000",
                alloc: {},
                number: "0x0",
                gasUsed: "0x0",
                parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
            };

            for(let i = 0; i < _accounts.length; i++) {
                genesis.alloc[_accounts[i]] = {
                    balance: "0x200000000000000000000000000000000000000000000000000000000000000"
                };
            }

            fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, '  '));
            console.log('Initialising geth using genesis file...');
            const initProcess = spawnGeth(
                gethPath,
                ['--datadir', gethDataPath, 'init', genesisPath],
                // true
            );
            await onExit(initProcess)
            
            const passPath = path.join(gethDataPath, 'pass');
            fs.writeFileSync(passPath,'sesame');


            //////////////////////////////////////////////////////////////////////////////////////////////////////
            // sealer account is pregenerated :

            // const privPath = path.join(gethDataPath, 'priv');
            // fs.writeFileSync(privPath,'2bd8fd4e7c04075345677d3127842e737a62db1918beef4cbea6cbc95db0cbdb');
            // console.log('Initialising account....');
            // const accountCreationProcess = spawnGeth(
            //     gethPath,
            //     ['--datadir', gethDataPath, 'account', 'import', '--password', passPath, privPath],
            //     // true
            // );
            // await onExit(accountCreationProcess)

            const keystorePath = path.join(gethDataPath, 'keystore');
            keystoreFilepath = path.join(keystorePath, 'UTC--2019-02-26T12-51-20.735389900Z--30cb8ee8b1bfacdd5edf8ae9f82e59925263c966');
            try { fs.mkdirSync(keystorePath); } catch(e) {}
            fs.writeFileSync(keystoreFilepath, '{"address":"30cb8ee8b1bfacdd5edf8ae9f82e59925263c966","crypto":{"cipher":"aes-128-ctr","ciphertext":"e1140b6de3997af4605cc378f08bd58f6b2f1637dbc1bfcdbef93a31665fbedb","cipherparams":{"iv":"e9751ae14e68c9327b6aed03654c2eee"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"d00a5afd0b8decca4a65d8da30fa20419bbacc663213b7368d268f4a0997f8bf"},"mac":"e9ba6a86129f9fbd02ea287fd6eea47e9543d5c3257a4440499b5bcb314251ce"},"id":"4ea8a249-40af-44db-ba7a-d56a239add7e","version":3}');
            //////////////////////////////////////////////////////////////////////////////////////////////////////

            console.log('starting geth on port ' + port + '(' + wsPort + ')');
            const gethProcess = spawnGeth(
                gethPath,
                [
                    '--datadir', gethDataPath,
                    '--syncmode', 'full',
                    '--networkid', genesis.config.chainId,
                    '--password', passPath,
                    '--unlock', '30cb8ee8b1bfacdd5edf8ae9f82e59925263c966',
                    '--mine',
                    '--gasprice', '1', // 2000000000
                    '--targetgaslimit', '0x4c4b400000', // 6000000
                    '--rpc',
                    '--rpcaddr', 'localhost', // 0.0.0.0 for public
                    // '--rpcvhosts', '*',
                    '--rpcport', '' + port,
                    '--rpcapi', 'eth,net,web3,personal,db,txpool,miner,debug',
                    '--ws',
                    '--wsaddr', 'localhost', // 0.0.0.0 for public
                    '--wsport', '' + wsPort,
                    // '--wsorigins', '*',
                    '--wsapi', 'eth,net,web3,personal,db,txpool,miner,debug',
                    // '--vmdebug',
                    '--nat', 'none',
                    '--nodiscover',
                    '--port', '' + gethPort,
                    '--txpool.journal', "''",
                ],
                // false,// true // TODO remove
                // '.geth.log'
            );
            
            let success = false
            let provider = getProvider(mnemonic, "http://localhost:" + port);
            while(!success) {
                try{
                    success = await fetchChainId(provider);
                } catch(e) {}
            }
            stop = () => {
                return new Promise((resolve, reject) => {
                    try {
                        terminate(gethProcess.pid, (err) => {
                            if(err) {
                                reject(err);
                            } else {
                                setTimeout(() => {
                                    try{rimraf.sync(gethDataPath);}catch(e){console.error(e);}
                                    resolve();
                                }, 1000);
                            }
                        })
                    } catch(e) {
                        reject(e);
                    }
                });
                // const promise = onExit(gethProcess);
                
                // gethProcess.kill("SIGINT");
                // // process.kill(-gethProcess.pid);

                // try{
                //     await promise;
                // } catch(e) {
                //     console.error(e);
                // }
            }
        } else {
            const message = 'node type not supprted : ' + config.node;
            console.error(colors.red(message));
            reject(message)
        }
        url = "http://localhost:" + port;
    }
    
    let provider = getProvider(mnemonic, url);
    
    try{
        _chainId = await fetchChainId(provider);
    }catch(e){console.error('chainId error', e)}
    
    return {url, chainId: _chainId, accounts: _accounts, stop, exposedMnemonic: exposedMnemonic};
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
        const message = 'you are using a too old solc version, rocketh only support solc >= 0.4.11';
        console.error(colors.red(message));
        reject(message);
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
            errored(colors.red(error.formattedMessage));
        }
        errored(colors.red('###################################################################################################################'));
        reject(errors);
    } else {
        
        if (cacheCompilationResult) {
            if(!contractBuildFolderCreated) {
                try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                contractBuildFolderCreated = true;
            }
            fs.writeFileSync(cacheOutputPath, JSON.stringify(output, null, '  '));
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
        resolve({contractInfos, solcOutput: output, solcConfig: JSON.parse(solcConfig)});
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

    let files;
    try{
        files = traverse(deploymentsPath);
    } catch(e) {
        files = [];
    }
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
    // if(disableDeploymentSave) {console.log('will not save deployments')}
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
        // console.log('processing ' + fileName + '...', argsForStages);
        try{
            await stageFunc.apply(null, argsForStages);
        }catch(e) {
            console.log('ERROR processing ' + migrationFilePath, e);
        }
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
        return _deployments[name];
    },
    deployments: () => _deployments, // TODO remove ?
    contractInfo: (name) => {
        return _contractInfos[name];
    },
    unlessAlreadyDeployed,
    isAlreadyDeployed,
    registerDeployment
}

let deploymentsPath;

function getProvider(mnemonic, url) {
    return new Provider(new Web3.providers.HttpProvider(url), mnemonic);
    // let provider;
    // if(mnemonic) {
    //     // const ethersSigner = ethers.Wallet.fromMnemonic(mnemonic);
    //     // const ethersProvider = new ethers.providers.JsonRpcProvider(url);
    //     // provider = new ProviderBridge(ethersProvider, ethersSigner);
    //     provider = new HDWalletProvider(mnemonic, url, 0, 10, false);
    // } else {
    //     // const ethersProvider = new ethers.providers.JsonRpcProvider(url);
    //     // provider = new ProviderBridge(ethersProvider, null);
    //     provider = new Web3.providers.HttpProvider(url);
    // }
    // return provider;
}

function attach(config, {url, chainId, accounts, mnemonic}, contractInfos, deployments) {
    
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

    
    const ethereumNodeURl = url || process.env._ROCKETH_NODE_URL;
    rocketh.chainId = _chainId = chainId || process.env._ROCKETH_CHAIN_ID;
    rocketh.accounts = _accounts = accounts;
    if(!rocketh.accounts && process.env._ROCKETH_ACCOUNTS) {
        rocketh.accounts = _accounts = process.env._ROCKETH_ACCOUNTS.split(',');
    }
    
    
    if(!_deployments) {
        _deployments = deployments;
    }

    if(!_deployments){
        _deployments = extractDeployments(path.join(deploymentsPath, _chainId));
    }

    let provider;
    if(ethereumNodeURl && ethereumNodeURl !== '') {
        if(url) {
            log('using node at ' + url + ' (' + _chainId + ')' + ' ...');
        }
        
        // TODO remove deuplication (see runNode)
        if(!mnemonic) {
            try{
                mnemonic = fs.readFileSync('./.mnemonic').toString();
            } catch(e) {
                mnemonic = process.env._ROCKETH_MNEMONIC.split(',').join(' ');
            }
        }
        
        provider = getProvider(mnemonic, ethereumNodeURl);
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
    rocketh,
    cleanDeployments
}
