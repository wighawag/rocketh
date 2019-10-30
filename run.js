const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const semver = require('semver');
const portfinder = require('portfinder');
const Provider = require('./provider');
const rimraf = require('rimraf');
const bip39 = require('bip39');
const geth = require('./geth_test_server');
const runGanache = require('./run_ganache');
const tmp = require('tmp');
const ethers = require('ethers');
const WalletSubprovider = require('./walletprovider');

const {
    requireLocal,
    log,
    traverse,
    fetchChainId,
    fetchReceiptViaWeb3Provider,
    fetchAccounts,
    fetchChainIdViaWeb3Provider,
    pause,
    mergeConfig,
} = require('./utils');

if (!global._rocketh_session) {
    global._rocketh_session = {};
}
const session = global._rocketh_session;

const cleanDeployments = () => {
    try {
        rimraf.sync(path.join(writeDeploymentsPath, deploymentsSubPath));
    } catch (e) {

    }
}

const unRegisterDeployment = (name) => {
    const filepath = path.join(writeDeploymentsPath, deploymentsSubPath, name + '.json');
    try {
        fs.unlinkSync(filepath);
    } catch(e) {
        console.error('could not delete ' + filepath);
    }
}

const registerDeployment = (name, deploymentInfo, force) => {
    const conflict = !force && session.currentDeployments[name] && !(deploymentInfo.transactionHash == session.currentDeployments[name].transactionHash);
    if (conflict) {
        console.error(colors.red('deployment with same name (' + name + ') exists'));
    } else {
        const errors = [];
        if (!deploymentInfo.contractInfo) {
            errors.push(colors.red('deploymentInfo requires field "contractInfo" that was for deployment'));
        }
        if (!deploymentInfo.args) {
            errors.push(colors.red('deploymentInfo requires field "args" that was used for deployment'));
        }
        // if (!deploymentInfo.address) {
        //     errors.push(colors.red('deploymentInfo requires field "address" of the deployed contract'));
        // }
        if (!deploymentInfo.transactionHash) {
            errors.push(colors.red('deploymentInfo requires field "transactionHash" of the deployed contract'));
        }
        if (errors.length > 0) {
            for (const error of errors) {
                console.error(error);
            }
        } else {
            const deploymentInfoToSave = {
                contractInfo: deploymentInfo.contractInfo,
                args: deploymentInfo.args,
                address: deploymentInfo.address,
                transactionHash: deploymentInfo.transactionHash,
            };

            session.deployments[name] = deploymentInfoToSave;
            session.currentDeployments[name] = deploymentInfoToSave;

            if (!disableDeploymentSave) {
                if (!deploymentsFolderCreated) {
                    try { fs.mkdirSync(writeDeploymentsPath); } catch (e) { }
                    try { fs.mkdirSync(path.join(writeDeploymentsPath, deploymentsSubPath)); } catch (e) { }
                    deploymentsFolderCreated = true;
                }
                const content = JSON.stringify(deploymentInfoToSave, null, '  ');
                const filepath = path.join(writeDeploymentsPath, deploymentsSubPath, name + '.json');
                
                let inputString;
                let solcVersion;
                if (deploymentInfoToSave.contractInfo.metadata) {
                    const metadata = JSON.parse(deploymentInfoToSave.contractInfo.metadata);
                    const settings = metadata.settings;
                    delete settings.compilationTarget;
                    inputString = JSON.stringify({
                        language: metadata.language,
                        settings,
                        sources: metadata.sources,
                    });
                    solcVersion = metadata.compiler ? metadata.compiler.version : '';
                    if(!inputFolderCreated) {
                        try { fs.mkdirSync(path.join(writeDeploymentsPath, deploymentsSubPath, 'inputs')); } catch (e) { }
                        inputFolderCreated = true;
                    }
                }
                fs.writeFileSync(filepath, content);
                if(inputString) {
                    fs.writeFileSync(path.join(writeDeploymentsPath, deploymentsSubPath, 'inputs', name + '_' + solcVersion + '.json'), inputString);
                }

                // if (initialRun) {
                //     const address = deploymentInfoToSave.address;
                //     if(address) {
                //         console.log('CONTRACT ' + name + ' DEPLOYED AT : ' + address);
                //     }
                // }
            }

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


let deploymentsFolderCreated = false;
let inputFolderCreated = false;
let contractBuildFolderCreated = false;

function compile(config) {
    return new Promise((resolve, reject) => {
        const rootPath = config.rootPath || './';
        let contractSrcPaths;
        if (typeof config.contractSrcPath == 'undefined') {
            contractSrcPaths = ['src'];
        } else if (typeof config.contractSrcPath == 'string') {
            contractSrcPaths = [config.contractSrcPath];
        } else {
            contractSrcPaths = config.contractSrcPath;
        }
        contractSrcPaths = contractSrcPaths.map((elem) => path.join(rootPath, elem));

        contractSrcPaths = contractSrcPaths.filter(fs.existsSync);
        if (contractSrcPaths.length == 0) {
            resolve({ contractInfos: {}, solcOutput: null, solcConfig: null });
            return;
        }

        let solc;
        try {
            solc = requireLocal('solc');
        } catch (e) {
            reject('you need to install your desired solc (>= 0.4.11) compiler in your own project: "npm install solc');
            return;
        }
        compileWithSolc(solc, contractSrcPaths, resolve, reject, config);
    });
}

async function runNode(config) {
    let url = config.url;
    let requireTesting = false;

    _chainId = null;
    if (url) {
        try {
            _chainId = await fetchChainId(url, config.useNetVersionAsChainId);
        } catch(e) {
            console.error('failed to get chainId from ' + url);
            if(!config.useNetVersionAsChainId) {
                console.log('trying with net_version...');
                config.useNetVersionAsChainId = true;
                _chainId = await fetchChainId(url, config.useNetVersionAsChainId);
            }
        }
        
    }

    const forceAccounts = !url;

    const result = getAccountsFromConfig(config, _chainId, forceAccounts);
    let privateKeys;
    let exposedMnemonic;
    if (result.accounts) {
        _accounts = result.accounts;
        privateKeys = result.privateKeys;
        exposedMnemonic = result.exposedMnemonic;
    } else {
        _accounts = await fetchAccounts(url)
    }

    let stop = () => { };

    if (!url) {
        const port = await portfinder.getPortPromise({
            port: 8545,    // minimum port
            stopPort: 9999 // maximum port
        });

        const wsPort = await portfinder.getPortPromise({
            port: port + 1,    // minimum port
            stopPort: 9999 // maximum port
        });

        if (config.node == 'ganache') {
            const ganacheOptions = config.ganacheOptions || { debug: true, vmErrorsOnRPCResponse: true };
            if (config.chainId) {
                ganacheOptions.network_id = config.chainId;
            }
            if (config.blockTime) {
                ganacheOptions.blockTime = config.blockTime; // TODO for geth
            }
            const ganacheAccounts = [];
            for (let i = 0; i < privateKeys.length; i++) {
                ganacheAccounts.push({
                    balance: "0x56BC75E2D63100000", // TODO config
                    secretKey: privateKeys[i]
                });
            }
            ganacheOptions.accounts = ganacheAccounts;
            await runGanache(port, wsPort, ganacheOptions);
        } else if (config.node == 'geth') {
            const runningGeth = await geth.serve(port, wsPort, _accounts, config.chainId);
            stop = runningGeth.stop;
        } else {
            const message = 'node type not supprted : ' + config.node;
            console.error(colors.red(message));
            reject(message)
        }
        url = "http://localhost:" + port;
        requireTesting = true;
    }

    const provider = getWeb3Provider(config, url, _chainId, forceAccounts);

    if (requireTesting) {
        let success = false
        // TODO failed after few tries ?
        while (!success) {
            try {
                _chainId = await fetchChainIdViaWeb3Provider(provider, config.useNetVersionAsChainId);
                success = true;
            } catch (e) {
                const errorMessage = e.message || e.error ? e.error.message : undefined;
                if(errorMessage && errorMessage.indexOf('eth_chainId not supported') != -1) {
                    if(!config.useNetVersionAsChainId) {
                        console.log('eth_chainId not supported, falling back to net_version...');
                        config.useNetVersionAsChainId = true;
                    }
                } else {
                    // log.error(e);
                }
            }
        } // TODO timeout
    } else {
        _chainId = await fetchChainIdViaWeb3Provider(provider, config.useNetVersionAsChainId);
    }

    return { url, chainId: _chainId, accounts: _accounts, stop, exposedMnemonic };
}

function compileWithSolc(solc, contractSrcPaths, resolve, reject, config) {
    const rootPath = config.rootPath || './';

    // console.log({contractSrcPaths});

    const contractBuildPath = path.join(rootPath, config.contractBuildPath || 'build');
    const cacheOutputPath = contractBuildPath + '/.compilationOutput.json';
    const cacheInputPath = contractBuildPath + '/.compilationInput.json';

    const sources = {};
    let latestMtimeMs = 0;
    for (let contractSrcPath of contractSrcPaths) {
        // console.log(contractSrcPath);
        const files = traverse(contractSrcPath);
        for (const file of files) {
            if (file.name.indexOf('.sol') === file.name.length - 4) {
                latestMtimeMs = Math.max(latestMtimeMs, file.mtimeMs);
                const relativePath = path.relative(rootPath, file.path).replace(/\\/g, '/');
                // console.log(relativePath);
                sources[relativePath] = {
                    content: fs.readFileSync(file.path).toString()
                };
            }
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

    log.green('using solc : ' + solcVersion);

    // TODO : config // merge from File ? add sources...
    const solcConfigObj = {
        language: "Solidity",
        //TODO add compiler info in some way to not use cache when compiler version is different // extra fields were fine prior to 0.5.1 or 0.5.2
        // compiler: {
        //     name: "solc",
        //     version: solcVersion
        // },
        sources,
        settings: mergeConfig({
            optimizer: {
                enabled: true,
                runs: 200,
            },
            outputSelection: {
                '*': {
                    '*': [
                        'abi',
                        // 'devdoc',
                        'userdoc',
                        'metadata',
                        // 'evm.assembly',
                        // 'evm.legacyAssembly',
                        'evm.bytecode',
                        'evm.deployedBytecode',
                        'evm.methodIdentifiers',
                        // 'evm.gasEstimates',
                        // 'ir', fails with the following:
                        // { component: 'general',
                        //     formattedMessage:
                        //     'UnimplementedFeatureError: Array conversion not implemented.\n',
                        //    message:
                        //     'Unimplemented feature (/root/project/libsolidity/codegen/YulUtilFunctions.cpp:819):Array conversion not implemented.',
                        //    severity: 'error',
                        //    type: 'UnimplementedFeatureError' }
                    ],
                    // "": ["ast", "legacyAST"]
                },
            },
            metadata: {
                useLiteralContent: true
            },
        }, config.solcSettings || {})
    };
    // TODO check for evm.bytecode as it is required for rocketh
    
    const solcConfig = JSON.stringify(solcConfigObj, null, '  ');

    
    let rawOutput;
    let cachePathMTimeMS = 0;
    let usingCache = false;
    try {
        cachePathMTimeMS = fs.statSync(cacheOutputPath).mtimeMs;
    } catch (e) { }
    if (latestMtimeMs < cachePathMTimeMS) {
        let lastInput = '';
        try {
            lastInput = fs.readFileSync(cacheInputPath).toString(); // TODO buffer and stream check checksum
        } catch (e) { }
        const sameInput = lastInput === solcConfig;
        if (!sameInput) {
            log.log('config changed...');
        } else {
            usingCache = true;
            // TODO expose the info that cache is being used so that test runner can skip test that did not change
        }
    }

    const imports = {}; // TODO import saving to import.json or .compilationInput.json
    function findImport(importPath) {
        // console.log('trying to import : ' + importPath);

        if (path.isAbsolute(importPath)) {
            return { error: 'Absolute path not supported : ' + importPath };
        }
        try {
            const data = { contents: fs.readFileSync(importPath).toString() };
            imports[importPath] = data;
            return data;
        } catch (e) {
            try {
                const modulePath = path.join('./node_modules', importPath);
                const data = { contents: fs.readFileSync(modulePath).toString() };
                imports[importPath] = data;
                return data;
            } catch (e) {
                return { error: 'File not found ' + importPath };
            }
        }
    }

    if (!usingCache) {
        log.green('########################################### COMPILING #############################################################');
        if (pre_0_5_0_solc && !pre_0_4_11_solc) {
            rawOutput = solc.compileStandardWrapper(solcConfig);
        } else {
            rawOutput = solc.compile(solcConfig, findImport);
        }
    } else {
        log.blue('########################################## FROM CACHE ############################################################');
        rawOutput = fs.readFileSync(cacheOutputPath).toString();
    }

    const output = JSON.parse(rawOutput);

    const warnings = [];
    const errors = [];
    const others = []; // TODO
    if (output.errors && (!usingCache || config.showErrorsFromCache)) {
        for (const error of output.errors) {
            if (error.severity === 'warning') {
                //TODO filter warning based on // ignore comments , example "// ignore:26:5: Warning: Function state mutability can be restricted to pure"
                // read file content, get the line, find the // ignore: pattern and disable warning if match
                warnings.push(error);
            } else if (error.severity === 'error') {
                errors.push(error);
            } else {
                others.push(error);
            }
        }
    }

    if (errors.length > 0) {
        for (const error of errors) {
            log.red(error.formattedMessage);
        }
        log.red('###################################################################################################################');
        reject(errors);
    } else {

        if (config.cacheCompilationResult) {
            if (!contractBuildFolderCreated) {
                try { fs.mkdirSync(contractBuildPath); } catch (e) { }
                contractBuildFolderCreated = true;
            }
            fs.writeFileSync(cacheOutputPath, JSON.stringify(output, null, '  '));
            fs.writeFileSync(cacheInputPath, solcConfig);
        }

        for (const warning of warnings) {
            log.yellow(warning.formattedMessage);
        }
        for (const other of others) {
            log.cyan(other.formattedMessage);
        }
        const bar = '###################################################################################################################';
        if (usingCache) {

            if (config.showErrorsFromCache) {
                log.blue('########################################## FROM CACHE ############################################################');
            }
        } else {
            log.green(bar);
        }

        const contractInfos = {};
        for (const filePath of Object.keys(output.contracts)) {
            for (const contractName of Object.keys(output.contracts[filePath])) {
                const contractInfo = output.contracts[filePath][contractName];
                const content = JSON.stringify(contractInfo, null, '  ');
                if (contractName === "") {
                    contractName = filePath.substr(filePath.lastIndexOf('/')); // TODO remove extension?
                }

                if (!contractBuildFolderCreated) {
                    try { fs.mkdirSync(contractBuildPath); } catch (e) { }
                    contractBuildFolderCreated = true;
                }
                fs.writeFileSync(contractBuildPath + '/' + contractName + '.json', content);

                if (config.generateTruffleBuildFiles && contractInfo.evm.bytecode.object && contractInfo.evm.bytecode.object != '') {
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
                    try { fs.mkdirSync('build'); } catch (e) { }
                    try { fs.mkdirSync('build/contracts'); } catch (e) { }
                    fs.writeFileSync('build/contracts/' + contractName + '.json', JSON.stringify(truffleBuildFile, null, '  '));
                }
                contractInfos[contractName] = contractInfo;
                // if (contractInfo.evm
                //     && contractInfo.evm.bytecode
                //     && contractInfo.evm.bytecode.object === '') { // TODO config to skip error
                //     console.warn(colors.yellow('contract ' + contractName + ' do not have bytecode generated'))
                // }
            }
        }
        compilationDone = true;
        resolve({ contractInfos, solcOutput: output, solcConfig: JSON.parse(solcConfig), solcVersion, contractSrcPaths });
    }
}

function extractContractInfos(output) {
    const contractInfos = {};
    for (const filePath of Object.keys(output.contracts)) {
        for (const contractName of Object.keys(output.contracts[filePath])) {
            const contractInfo = output.contracts[filePath][contractName];
            if (contractName === "") {
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
    try {
        files = traverse(deploymentsPath, [], null, (name, stats) => name != 'inputs');
    } catch (e) {
        files = [];
    }
    for (const file of files) {
        if (file.name.indexOf('.json') === file.name.length - 5) {
            deployments[file.name.substr(0, file.name.length - 5)] = JSON.parse(fs.readFileSync(file.path).toString());
        }
    }
    return deployments;
}

function chainConfig(config, object, chainId) {
    const isDeploymentChainId = config.deploymentChainIds && config.deploymentChainIds.indexOf('' + chainId) != -1;
    if (typeof object["" + chainId] != 'undefined') {
        return object["" + _chainId];
    } else if (typeof object[_chainId] != 'undefined') {
        return object[_chainId];
    } else if (isDeploymentChainId && typeof object['deployments'] != 'undefined') {
        return object['deployments'];
    } else {
        return object['default'];
    }
}

// cache
let _chainId;
let _accounts;
let disableDeploymentSave;
let initialRun;
async function runStages(config, contractInfos, deployments) {
    disableDeploymentSave = !deployments;

    session.currentDeployments = {};

    if(deployments) {
        for(let contractName of Object.keys(deployments)) {
            const deployment = deployments[contractName];
            if(deployment.transactionHash && !deployment.address) {
                console.log('waiting for transaction ' + deployment.transactionHash + ' to be mined');
                let contractAddress;
                while(!contractAddress) {
                    const receipt = await fetchReceiptViaWeb3Provider(global.ethereum, deployment.transactionHash);
                    if(!receipt) {
                        log.log('no receipt yet for ' + deployment.transactionHash);
                    } else if(typeof receipt.status != 'undefined' && receipt.status == 0) {
                        console.log('transaction ' + deployment.transactionHash + ' failed.');
                        unRegisterDeployment(contractName);
                        break;
                    } else if(receipt.contractAddress) {
                        contractAddress = receipt.contractAddress;
                        break;
                    }
                    await pause(2);
                }
                if(contractAddress) {
                    deployment.address = contractAddress;
                    console.log(' transaction ' + deployment.transactionHash + ' successful');
                    registerDeployment(contractName, deployment, true);
                } 
            }
        }
    }

    initialRun = typeof deployments != 'undefined';
    session.deployments = deployments || {}; // override 

    const stagesPath = path.join(config.rootPath || './', config.stagesPath || 'stages');
    // log.green('######################################### STAGES ##############################################################');
    
    let filesStats;
    try {
        filesStats = traverse(stagesPath);
    } catch (e) {
        log.green('no stages folder at ./' + stagesPath);
        return session.deployments;
    }

    let stagesFilter;
    if (config.stages) {
        stagesFilter = chainConfig(config, config.stages, _chainId);
        if(stagesFilter === 'all') {
            stagesFilter = undefined;
        }
    }
    filesStats = filesStats.filter((fileStat) => {
        const filepath =  fileStat.relativePath.replace(/\\/g, '/');
        let matches = true;
        if(stagesFilter) {
            if(stagesFilter.matchRule === 'startsWith') {
                matches = false;
                for (let elem of stagesFilter.list) {
                    if(filepath.startsWith(elem)){
                        
                        matches = true;
                        break;
                    }
                }
            } // TODO more rules
        }
        return matches && !fileStat.directory;
    });
    let fileNames = filesStats.map(a => a.relativePath);
    fileNames = fileNames.sort((a, b) => {
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
    });
    

    let argsForStages = [{
        ethereum,
        rocketh,
        contractInfo: (name) => contractInfos[name],
        accounts: _accounts,
        chainId: _chainId,
        registerDeployment,
        deployment: function (name) { return session.currentDeployments[name] },
        namedAccounts: rocketh.namedAccounts,
        sendTxAndWait,
        call,
        estimateGas,
        initialRun,
        isDeploymentChainId: config.deploymentChainIds.indexOf('' + _chainId) != -1,
        deploy,
        deployIfNeverDeployed,
        deployIfDifferent,
        fetchIfDifferent,
        getDeployedContract,
        registerContract,
    }];

    for (const fileName of fileNames) {
        const migrationFilePath = path.resolve(".") + '/' + stagesPath + '/' + fileName;
        if (initialRun) {
            log.log('running ' + migrationFilePath);
        }
        const stageFunc = require(migrationFilePath);
        let skip = false;
        if (stageFunc.skip) {
            try {
                skip = await stageFunc.skip.apply(null, argsForStages);
            } catch (e) {
                throw 'ERROR processing skip func of ' + migrationFilePath + ':\n' + (e.stack || e);            
            }    
        }
        if (!skip) {
            try {
                await stageFunc.apply(null, argsForStages);
            } catch (e) {
                throw 'ERROR processing ' + migrationFilePath + ':\n' + (e.stack || e);            
            }
        } else {
            if (initialRun) {
                log.log('skipping ' + migrationFilePath);
            }
        }
    }
    // log.green('###################################################################################################################');
    return session.deployments;
}


let _savedConfig;
let _contractInfos;

const rocketh = {
    runStages: () => runStages(_savedConfig, _contractInfos), // empty deployment for running Stages : blank canvas for testing
    deployment: (name) => {
        return session.deployments[name];
    },
    deployments: () => session.deployments, // TODO remove ?
    getDeployedContract: getDeployedContract,
    contractInfo: (name) => {
        return _contractInfos[name];
    },
    registerDeployment
}

let ethersProvider;

let deploymentsPath;
let writeDeploymentsPath;
let deploymentsSubPath;


let _accountsUsed;
function getAccountsFromConfig(config, chainId, forceAccounts) {
    if (_accountsUsed) {
        return _accountsUsed;
    }
    
    // log.log('getting account for chainId ' + chainId);

    let mnemonic;
    let accounts;
    let privateKeys;

    let accountsConfig;
    if (chainId && config.accounts["" + chainId]) {
        accountsConfig = config.accounts["" + chainId];
    } else {
        accountsConfig = config.accounts["default"];
    }
    const type = accountsConfig.type

    let numWallets = 10; // default mnemonic when taken form _ROCKETH_MNEMONIC env (see below)

    forceAccounts = forceAccounts || (process.env._ROCKETH_MNEMONIC && process.env._ROCKETH_MNEMONIC != "");
    if (type == 'node') {
        log.log('using node\'s accounts');
        if (!forceAccounts) {
            return {};
        }
    } else if (type == 'mnemonic') {
        log.log('using mnemonic');
        numWallets = accountsConfig.num || 10;
        const mnemonicPath = accountsConfig.path || './.mnemonic';
        try {
            mnemonic = fs.readFileSync(mnemonicPath).toString();
        } catch (e) { }
    } else if (type == 'privateKeys') {
        log.log('using privateKeys');
        privateKeys = JSON.parse(fs.readFileSync('./.priv').toString());
        accounts = [];
        for (let i = 0; i < privateKeys.length; i++) {
            const wallet = new ethers.Wallet(privateKeys[i]);
            accounts.push(wallet.address);
        }
    } else if (type == 'bitski') {
        log.log('using bitski');
        try {
            const bitskiConfig = JSON.parse(fs.readFileSync('./.bitski').toString());
            accounts = bitskiConfig.accounts;
        } catch (e) {
            log.error('cannot read .bitski');
        }
    }

    let exposedMnemonic;
    if ((!accounts || accounts.length == 0) && !mnemonic) {
        if (process.env._ROCKETH_MNEMONIC && process.env._ROCKETH_MNEMONIC != "") {
            mnemonic = process.env._ROCKETH_MNEMONIC.split(',').join(' ');
        } else {
            mnemonic = bip39.generateMnemonic()
            exposedMnemonic = mnemonic;
        }
    }

    if (mnemonic) {
        privateKeys = [];
        accounts = [];
        for (let i = 0; i < numWallets; i++) {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + i);
            accounts.push(wallet.address);
            privateKeys.push(wallet.privateKey);
        }
    }

    _accountsUsed = { exposedMnemonic, privateKeys, accounts };
    return _accountsUsed;
}

function getWeb3Provider(config, url, chainId, forceAccounts) {
    let accountsConfig;
    if (chainId && config.accounts["" + chainId]) {
        accountsConfig = config.accounts["" + chainId];
    } else {
        accountsConfig = config.accounts["default"];
    }
    const type = accountsConfig.type

    const subProviders = [];
    let subProvidersConfigured = false;
    if (type == "bitski") {
        try {
            const bitskiConfig = JSON.parse(fs.readFileSync('./.bitski').toString());

            const BitskiSubProvider = require('./bitski_subprovider');
            const bitskiWalletSubProvider = new BitskiSubProvider(
                bitskiConfig.clientID,
                bitskiConfig.credentials.ID,
                bitskiConfig.credentials.secret,
                bitskiConfig.accounts,
                chainId,
                config,
            );
            subProviders.push(bitskiWalletSubProvider);
            subProvidersConfigured = true;
        } catch (e) {
            log.error('cannot read .bitski');
        }
    }

    if (!subProvidersConfigured) {
        const { privateKeys } = getAccountsFromConfig(config, chainId, forceAccounts);
        if (privateKeys) {
            const walletProvider = new WalletSubprovider(privateKeys);
            subProviders.push(walletProvider)
        }
    }

    return new Provider(url, subProviders);
}

let attached;


function attach(config, { url, chainId, accounts }, contractInfos, deployments) {

    const ethereumNodeURl = url || process.env._ROCKETH_NODE_URL;
    rocketh.chainId = _chainId = chainId || process.env._ROCKETH_CHAIN_ID;
    rocketh.accounts = _accounts = accounts;
    if (!rocketh.accounts && process.env._ROCKETH_ACCOUNTS) {
        rocketh.accounts = _accounts = process.env._ROCKETH_ACCOUNTS.split(',');
    }
    deploymentsPath = (process.env._ROCKETH_DEPLOYMENTS && process.env._ROCKETH_DEPLOYMENTS) != "" ? process.env._ROCKETH_DEPLOYMENTS : undefined;
    deploymentsSubPath = _chainId;
    const isDeploymentChainId = config.deploymentChainIds.indexOf('' + _chainId) != -1;

    _savedConfig = config;
    if (!deploymentsPath) {
        if (config.deploymentsPath) {
            deploymentsPath = config.deploymentsPath;
            deploymentsSubPath = '';
        } else {
            deploymentsPath = path.join(config.rootPath || './', config.deploymentsPath || 'deployments');
            
        }
        writeDeploymentsPath = deploymentsPath;
        if (!isDeploymentChainId) {
            const tmpobj = tmp.dirSync({ keep: true });
            writeDeploymentsPath = tmpobj.name;
        }
    } else {
        writeDeploymentsPath = deploymentsPath;    
    }
    log.log('using deployments at ' + deploymentsPath, deploymentsSubPath, 'writing at ' + writeDeploymentsPath);
    
    const namedAccounts = {}
    // TODO transform into checksum  address
    if (config.namedAccounts) {
        log.log('namedAccount')
        const nameConfig = config.namedAccounts;
        const accountNames = Object.keys(nameConfig);
        function parseSpec(spec) {
            let address;
            switch (typeof spec) {
                case "string":
                    if (spec.slice(0, 5) == "from:") {
                        const from = parseInt(spec.substr(5));
                        address = [];
                        if (_accounts) {
                            for (let j = from; j < _accounts.length; j++) {
                                address.push(_accounts[j]);
                            }
                        }
                    } else if (spec.slice(0, 2).toLowerCase() == "0x") {
                        address = spec;
                    } else {
                        address = parseSpec(nameConfig[spec])
                    }
                    break;
                case "number":
                    if (_accounts) {
                        address = _accounts[spec];
                    }
                    break;
                case "undefined":
                    break;
                case "object":
                    if (spec) {
                        if (spec.type == 'object') {
                            address = spec;
                        } else if (Array.isArray(spec)) {
                            address = [];
                            for (let j = 0; j < spec.length; j++) {
                                address.push(parseSpec(spec[j]));
                            }
                        } else {
                            const newSpec = chainConfig(config, spec, _chainId);
                            if(typeof newSpec != 'undefined') {
                                address = parseSpec(newSpec);
                            }
                        }
                    }
                    break;
            }
            return address;
        }

        for (let i = 0; i < accountNames.length; i++) {
            const accountName = accountNames[i];
            const spec = nameConfig[accountName];
            namedAccounts[accountName] = parseSpec(spec);
        }
    }
    rocketh.namedAccounts = namedAccounts;

    if (attached) {
        //already setup
        return attached;
    }

    if (!_contractInfos) {
        _contractInfos = contractInfos;
    }

    let compilationInput;
    if (!_contractInfos) {
        // TODO remove duplic :
        try {
            const contractBuildPath = path.join(config.rootPath || './', config.contractBuildPath || 'build');
            const cacheOutputPath = contractBuildPath + '/.compilationOutput.json';
            _contractInfos = extractContractInfos(JSON.parse(fs.readFileSync(cacheOutputPath).toString()), contractBuildPath);

            const intputPath = contractBuildPath + '/.compilationInput.json';
            compilationInput = JSON.parse(fs.readFileSync(intputPath).toString());
        } catch (e) {
            console.log('no contracts');
        }
    }

    log.log('deployments', session.deployments);
    if (!session.deployments) {
        log.log('no deployments', deployments);
        session.deployments = deployments;
    }

    if (!session.deployments) {
        log.log('extracting deployments for chainId', _chainId);
        session.deployments = extractDeployments(path.join(deploymentsPath, deploymentsSubPath));
    }

    if(writeDeploymentsPath != deploymentsPath || isDeploymentChainId) {
        let deploymentsFolderCreated = false;
        for (let name of Object.keys(session.deployments)) {
            if (!deploymentsFolderCreated) {
                try { fs.mkdirSync(writeDeploymentsPath); } catch (e) { }
                try { fs.mkdirSync(path.join(writeDeploymentsPath, deploymentsSubPath)); } catch (e) { }
                deploymentsFolderCreated = true;
            }
            const content = JSON.stringify(session.deployments[name], null, '  ');
            const filepath = path.join(writeDeploymentsPath, deploymentsSubPath, name + '.json');
            fs.writeFileSync(filepath, content);
        }
    }

    let provider;
    if (ethereumNodeURl && ethereumNodeURl !== '') {
        if (url) {
            log.log('using node at ' + url + ' (' + _chainId + ')' + ' ...');
        }

        provider = getWeb3Provider(config, ethereumNodeURl, _chainId); // TODO for sol-trace _contractInfos, compilationInput, config.rootPath || './', config.contractSrcdPath || 'src');
    } else {
        console.error(colors.red('ROCKETH_NODE_URL not set'));
        process.exit(1);
    }

    rocketh.ethereum = provider;
    rocketh.sendTxAndWait = sendTxAndWait;
    rocketh.estimateGas = estimateGas;
    rocketh.call = call;
    global.ethereum = provider;

    ethersProvider = new ethers.providers.Web3Provider(rocketh.ethereum);

    if (config.addRocketh) {
        global.rocketh = rocketh;
    }

    attached = {
        rocketh,
        contractInfos: _contractInfos,
        deployments: session.deployments,
        deploymentsPath: writeDeploymentsPath,
    };

    return attached;
}

function getIndex(from) {
    let i = 0;
    for (const account of rocketh.accounts) {
        if(account.toLowerCase() == from.toLowerCase()) {
            return i;
        }
        i++;
    }
    throw new Error('no account found for ' + from);
}

function getEthersSigner(from) {
    let accountIndex = 0;
    if(from) {
        accountIndex = getIndex(from);
    }
    return ethersProvider.getSigner(accountIndex);
}

async function sendTxAndWait(options, contractName, methodName, ...args) {
    let from = options.from;
    let ethersSigner;
    if(from.length >= 64) {
        if(from.length == 64) {
            from = '0x' + from;
        }
        ethersSigner = new Wallet(from);
        from = ethersSigner.address;
    } else {
        ethersSigner = getEthersSigner(from);
    }
    let tx;
    if (contractName) {
        const deployment = rocketh.deployment(contractName);
        const abi = deployment.contractInfo.abi
        const overrides = {
            gas: options.gas,
            gasprice: options.gasPrice,
            value: options.value,
            nonce: options.nonce,
            chainId: options.chainId,
        }
        const ethersContract = new ethers.Contract(deployment.address, abi, ethersSigner);
        tx = await ethersContract.functions[methodName](...args, overrides);
    } else {
        // TODO send simple tx from options;
    }
    return tx.wait();
}

async function call(options, contractName, methodName, ...args) {
    if (typeof options == 'string') {
        if (typeof args == 'undefined') {
            args = [];
            if(typeof methodName != 'undefined') {
                args.push(methodName);
            }
        }
        methodName = contractName;
        contractName = options;
        options = {};
    }
    if (typeof args == 'undefined') {
        args = [];
    }
    let from = options.from;
    let ethersSigner;
    if(from && from.length >= 64) {
        if(from.length == 64) {
            from = '0x' + from;
        }
        ethersSigner = new Wallet(from);
        from = ethersSigner.address;
    }
    const deployment = rocketh.deployment(contractName);
    const abi = deployment.contractInfo.abi
    const overrides = {
        gas: options.gas,
        gasprice: options.gasPrice,
        value: options.value,
        nonce: options.nonce,
        chainId: options.chainId,
    }
    const ethersContract = new ethers.Contract(deployment.address, abi, ethersSigner);
    return ethersContract.callStatic[methodName](...args, overrides);
}

async function estimateGas(options, contractName, methodName, ...args) {
    if (typeof options == 'string') {
        if (typeof args == 'undefined') {
            args = [];
            if(typeof methodName != 'undefined') {
                args.push(methodName);
            }
        }
        methodName = contractName;
        contractName = options;
        options = {};
    }
    if (typeof args == 'undefined') {
        args = [];
    }
    let from = options.from;
    let ethersSigner;
    if(from && from.length >= 64) {
        if(from.length == 64) {
            from = '0x' + from;
        }
        ethersSigner = new Wallet(from);
        from = ethersSigner.address;
    }
    const deployment = rocketh.deployment(contractName);
    const abi = deployment.contractInfo.abi
    const overrides = {
        gas: options.gas,
        gasprice: options.gasPrice,
        value: options.value,
        nonce: options.nonce,
        chainId: options.chainId,
    }
    const ethersContract = new ethers.Contract(deployment.address, abi, ethersSigner);
    return ethersContract.estimate[methodName](...args, overrides);
}

async function deploy(name, options, contractName, ...args) {
    let register = true;
    if (typeof name != 'string') {
        register = false;
        args.unshift(contractName);
        contractName = options;
        options = name;
    }
    let from = options.from;
    let ethersSigner;
    if(from.length >= 64) {
        if(from.length == 64) {
            from = '0x' + from;
        }
        ethersSigner = new Wallet(from);
        from = ethersSigner.address;
    } else {
        ethersSigner = getEthersSigner(from);
    }
    const ContractInfo = rocketh.contractInfo(contractName);
    const abi = ContractInfo.abi;
    const factory = new ethers.ContractFactory(abi, '0x' + ContractInfo.evm.bytecode.object, ethersSigner);
    
    const overrides = {
        gas: options.gas,
        gasprice: options.gasPrice,
        value: options.value,
        nonce: options.nonce,
        chainId: options.chainId,
    }
    const ethersContract = await factory.deploy(...args, overrides);
    const tx = ethersContract.deployTransaction;
    const transactionHash = tx.hash;
    if (register) {
        rocketh.registerDeployment(name, {
            contractInfo: ContractInfo,
            transactionHash,
            args
        });
    }
    const receipt = await tx.wait(); // TODO return tx.wait
    const address = receipt.contractAddress;
    const contract = {address, abi};

    if (register) {
        rocketh.registerDeployment(name, {
            contractInfo: ContractInfo,
            address: contract.address,
            transactionHash,
            args
        });
    }
    return {
        contract,
        transactionHash,
        receipt
    };
}

async function deployIfNeverDeployed(name, options, contractName, ...args) {
    const deployment = rocketh.deployment(name);
    if (!deployment) {
        return deploy(name, options, contractName, ...args);
    } else {
        return getDeployedContractWithTransactionHash(name);
    }
}

async function fetchIfDifferent(fieldsToCompare, name, options, contractName, ...args) {
    const deployment = rocketh.deployment(name);
    if (deployment) {
        const transaction = await ethersProvider.getTransaction(deployment.transactionHash);
        if (transaction) {
            const ContractInfo = rocketh.contractInfo(contractName);
            const abi = ContractInfo.abi;
            const factory = new ethers.ContractFactory(abi, '0x' + ContractInfo.evm.bytecode.object, getEthersSigner(options.from));

            const compareOnData = fieldsToCompare.indexOf('data') != -1;
            const compareOnInput = fieldsToCompare.indexOf('input') != -1;

            let data;
            if (compareOnData || compareOnInput) {
                data = factory.getDeployTransaction(...args);
                console.log(JSON.stringify(data, null, '  '));
            }
            const newTransaction = {
                data: compareOnData ? data : undefined,
                input: compareOnInput ? data : undefined,
                gas: options.gas,
                gasPrice: options.gasPrice,
                value: options.value,
                from: options.from
            };

            transaction.data = transaction.input;
            for (let i = 0; i < fieldsToCompare.length; i++) {
                const field = fieldsToCompare[i];
                if (typeof newTransaction[field] == 'undefined') {
                    throw new Error('field ' + field + ' not specified in new transaction, cant compare');
                }
                if (transaction[field] != newTransaction[field]) {
                    return true;
                }
            }
            return false;
        }
    }
    return true;
}

async function deployIfDifferent(fieldsToCompare, name, options, contractName, ...args) {
    const differences = await fetchIfDifferent(fieldsToCompare, name, options, contractName, ...args);
    if (differences) {
        return deploy(name, options, contractName, ...args);
    } else {
        return getDeployedContractWithTransactionHash(name);
    }

};

function fromDeployment(deployment) {
    return { address: deployment.address, abi: deployment.contractInfo.abi};
}

async function getDeployedContractWithTransactionHash(name) {
    const deployment = rocketh.deployment(name);
    if (!deployment) {
        return null;
    }
    const receipt = await fetchReceipt(deployment.transactionHash);
    return { contract: fromDeployment(deployment), transactionHash: deployment.transactionHash, receipt };
}

function getDeployedContract(name) {
    const deployment = rocketh.deployment(name);
    if (!deployment) {
        return null;
    }
    return fromDeployment(deployment)
}

function registerContract(name, address, txHash, contractName, ...args) {
    const ContractInfo = rocketh.contractInfo(contractName);
    rocketh.registerDeployment(name, {
        contractInfo: ContractInfo,
        address,
        transactionHash: txHash,
        args
    });
    return { addresss, abi: ContractInfo.abi };
}

module.exports = {
    runStages,
    runNode,
    compile,
    attach,
    rocketh,
    cleanDeployments,
    extractDeployments,
}
