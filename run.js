const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const semver = require('semver');
const portfinder = require('portfinder');
const Web3 = require('web3'); // for provider and solidity-sha3
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
    fetchTransaction,
    fetchAccounts,
} = require('./utils');

if(!global._rocketh_session) {
    global._rocketh_session = {};
}
const session = global._rocketh_session;

const cleanDeployments = () => {
    try{
        rimraf.sync(path.join(deploymentsPath, deploymentsSubPath));
    }catch(e){

    }
}

const registerDeployment = (name, deploymentInfo) => {
    if(session.currentDeployments[name]){
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
        if(!deploymentInfo.transactionHash) {
            errors.push(colors.red('deploymentInfo requires field "transactionHash" of the deployed contract'));
        }
        if(errors.length > 0 ){
            for(const error of errors) {
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
            
            if(!disableDeploymentSave) {
                if(!deploymentsFolderCreated) {
                    try { fs.mkdirSync(deploymentsPath); } catch(e) {}
                    try { fs.mkdirSync(path.join(deploymentsPath, deploymentsSubPath)); } catch(e) {}
                    deploymentsFolderCreated = true;
                }
                const content = JSON.stringify(deploymentInfoToSave, null, '  ');
                const filepath = path.join(deploymentsPath, deploymentsSubPath, name + '.json');
                fs.writeFileSync(filepath, content);

                if(initialRun) {
                    const address = deploymentInfoToSave.address;
                    console.log('CONTRACT ' + name + ' DEPLOYED AT : ' + address);
                }
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
let contractBuildFolderCreated = false;

function compile(config) {
    return new Promise((resolve, reject) => {
        let solc;
        try{
            solc = requireLocal('solc');
        } catch(e) {
            reject('you need to install your desired solc (>= 0.4.11) compiler in your own project: "npm install solc');
            return;
        }
        compileWithSolc(solc, resolve, reject, config);
    });
}

async function runNode(config) {
    let url = config.url; 
    let requireTesting = false;

    _chainId = null;
    if(url) {
        _chainId = await fetchChainId(new Web3.providers.HttpProvider(url));
    }

    const result = getAccountsFromConfig(config, _chainId);
    _accounts = result.accounts;
    const privateKeys = result.privateKeys;
    const exposedMnemonic = result.exposedMnemonic;

    let stop = () => {};

    if(!url) {
        const port = await portfinder.getPortPromise({
            port: 8545,    // minimum port
            stopPort: 9999 // maximum port
        });

        const wsPort = await portfinder.getPortPromise({
            port: port+1,    // minimum port
            stopPort: 9999 // maximum port
        });

        if(config.node == 'ganache') {
            const ganacheOptions = config.ganacheOptions || {debug: true, vmErrorsOnRPCResponse: true};
            if(config.chainId) {
                ganacheOptions.network_id = config.chainId;
            }
            const ganacheAccounts = [];
            for(let i = 0; i < privateKeys.length; i ++) {
                ganacheAccounts.push({
                    balance: "0x56BC75E2D63100000", // TODO config
                    secretKey: privateKeys[i]
                });
            }
            ganacheOptions.accounts = ganacheAccounts;
            await runGanache(port, wsPort, ganacheOptions);
        } else if(config.node == 'geth') {
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

    const provider = getProvider(config, url, _chainId);

    if(requireTesting) {
        let success = false
        
        while(!success) {
            try{
                _chainId = await fetchChainId(provider);
                success = true;
            } catch(e) {}
        } // TODO timeout
    } else {
        _chainId = await fetchChainId(provider);
    }
    
    return {url, chainId: _chainId, accounts: _accounts, stop, exposedMnemonic};
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
    
    log.green('using solc : ' + solcVersion);

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
            log.log('config changed...');
        } else {
            usingCache = true;
            // TODO expose the info that cache is being used so that test runner can skip test that did not change
        }
    }

    if(!usingCache) {
        log.green('########################################### COMPILING #############################################################');
        if(pre_0_5_0_solc && !pre_0_4_11_solc) {
            rawOutput = solc.compileStandardWrapper(solcConfig);
        } else {
            rawOutput = solc.compile(solcConfig);
        }
    } else {
        log.blue('########################################## FROM CACHE ############################################################');
        rawOutput = fs.readFileSync(cacheOutputPath).toString();
    }

    const output = JSON.parse(rawOutput);    
    
    const warnings = [];
    const errors = [];
    const others = []; // TODO
    if(output.errors && (!usingCache || config.showErrorsFromCache)) {
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
            log.red(error.formattedMessage);
        }
        log.red('###################################################################################################################');
        reject(errors);
    } else {
        
        if (config.cacheCompilationResult) {
            if(!contractBuildFolderCreated) {
                try { fs.mkdirSync(contractBuildPath); } catch(e) {}
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
        if(usingCache) {

            if(config.showErrorsFromCache) {
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
                if(contractName === "") {
                    contractName = filePath.substr(filePath.lastIndexOf('/')); // TODO remove extension?
                }
                
                if(!contractBuildFolderCreated) {
                    try { fs.mkdirSync(contractBuildPath); } catch(e) {}
                    contractBuildFolderCreated = true;
                }
                fs.writeFileSync(contractBuildPath + '/' + contractName + '.json', content);
                
                if(config.generateTruffleBuildFiles && contractInfo.evm.bytecode.object && contractInfo.evm.bytecode.object != '') {
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

// cache
let _chainId;
let _accounts;
let disableDeploymentSave;
let initialRun;
async function runStages(config, contractInfos, deployments) {
    disableDeploymentSave = !deployments;

    initialRun = typeof deployments != 'undefined';
    session.deployments = deployments || {}; // override 

    const stagesPath = path.join(config.rootPath || './', config.stagesPath || 'stages');
    // log.green('######################################### STAGES ##############################################################');
    let fileNames;
    try{
        fileNames = fs.readdirSync(stagesPath);
    } catch(e) {
        log.green('no stages folder at ./' + stagesPath);
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

    session.currentDeployments = {};

    let argsForStages = [{
        contractInfo: (name) => contractInfos[name],
        accounts: _accounts,
        chainId: _chainId,
        registerDeployment,
        deployment: function(name) {return session.currentDeployments[name]},
        namedAccounts: rocketh.namedAccounts,
        initialRun,
    }];
    
    for (const fileName of fileNames) {
        const migrationFilePath = path.resolve(".") + '/' + stagesPath + '/' + fileName;
        log.log('running ' + migrationFilePath);
        const stageFunc = require(migrationFilePath);
        try{
            await stageFunc.apply(null, argsForStages);
        }catch(e) {
            console.error('ERROR processing ' + migrationFilePath, e);
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
    contractInfo: (name) => {
        return _contractInfos[name];
    },
    registerDeployment
}

let deploymentsPath;
let deploymentsSubPath;


let _accountsUsed;
function getAccountsFromConfig(config, chainId) {
    if(_accountsUsed) {
        return _accountsUsed;
    }
    
    let mnemonic;
    let accounts;
    let privateKeys;
    
    let accountsConfig;
    if(chainId && config.accounts[""+ chainId]) {
        accountsConfig = config.accounts[""+ chainId];
    } else {
        accountsConfig = config.accounts["default"];
    }
    const type = accountsConfig.type

    let numWallets = 10; // default mnemonic when taken form _ROCKETH_MNEMONIC env (see below)
    if(type == 'node') {
        //TODO
    }else if(type == 'mnemonic') {
        numWallets = accountsConfig.num;
        try{
            mnemonic = fs.readFileSync('./.mnemonic').toString();
        } catch(e) {}
    } else if(type == 'privateKeys') {
        privateKeys = JSON.parse(fs.readFileSync('./.priv').toString());
        accounts = [];
        for(let i = 0; i < privateKeys.length; i++) {
            const wallet = new ethers.Wallet(privateKeys[i]);
            accounts.push(wallet.address);
        }
    } else if(type == 'bitski') {
        const bitskiConfig = JSON.parse(fs.readFileSync('./.bitski').toString());
        accounts = bitskiConfig.accounts;
    }
    
    let exposedMnemonic;
    if((!accounts ||  accounts.length == 0) && !mnemonic) {
        if(process.env._ROCKETH_MNEMONIC && process.env._ROCKETH_MNEMONIC != "") {
            mnemonic = process.env._ROCKETH_MNEMONIC.split(',').join(' ');
        } else {
            mnemonic = bip39.generateMnemonic()
            exposedMnemonic = mnemonic;
        }
    }

    if(mnemonic) {
        privateKeys = [];
        accounts = [];
        for(let i = 0; i < numWallets; i++) {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/"+i);
            accounts.push(wallet.address);
            privateKeys.push(wallet.privateKey);
        }
    }

    _accountsUsed =  {exposedMnemonic, privateKeys, accounts};
    return _accountsUsed;
}

function getProvider(config, url, chainId) {
    let accountsConfig;
    if(chainId && config.accounts[""+ chainId]) {
        accountsConfig = config.accounts[""+ chainId];
    } else {
        accountsConfig = config.accounts["default"];
    }
    const type = accountsConfig.type

    const subProviders = [];
    if(type == "bitski") {
        const bitskiConfig = JSON.parse(fs.readFileSync('./.bitski').toString());

        const BitskiSubProvider = require('./bitski_subprovider');
        const bitskiWalletSubProvider = new BitskiSubProvider(
            bitskiConfig.clientID,
            bitskiConfig.credentials.ID,
            bitskiConfig.credentials.secret,
            bitskiConfig.accounts,
            chainId,
        );
        subProviders.push(bitskiWalletSubProvider)
    } else {
        const {privateKeys} = getAccountsFromConfig(config);
        const walletProvider = new WalletSubprovider(privateKeys);
        subProviders.push(walletProvider)
    }
    
    return new Provider(new Web3.providers.HttpProvider(url), subProviders);
}

let attached;


function attach(config, {url, chainId, accounts}, contractInfos, deployments) {

    const ethereumNodeURl = url || process.env._ROCKETH_NODE_URL;
    rocketh.chainId = _chainId = chainId || process.env._ROCKETH_CHAIN_ID;
    rocketh.accounts = _accounts = accounts;
    if(!rocketh.accounts && process.env._ROCKETH_ACCOUNTS) {
        rocketh.accounts = _accounts = process.env._ROCKETH_ACCOUNTS.split(',');
    }
    deploymentsPath = (process.env._ROCKETH_DEPLOYMENTS && process.env._ROCKETH_DEPLOYMENTS) != "" ? process.env._ROCKETH_DEPLOYMENTS : undefined;
    deploymentsSubPath = _chainId;

    const isDeploymentChainId = config.deploymentChainIds.indexOf('' + _chainId) != -1;
    
    _savedConfig = config;
    if(!deploymentsPath) {
        if(isDeploymentChainId) {
            deploymentsPath = path.join(config.rootPath || './', config.deploymentsPath || 'deployments');
        } else {
            if(typeof config.keepRunning == 'string') {
                deploymentsPath = config.keepRunning;
                deploymentsSubPath = '';
            } else {
                const tmpobj = tmp.dirSync({keep:true});
                deploymentsPath = tmpobj.name;
            }
        }
    }
    log.log('using deployments at ' + deploymentsPath, deploymentsSubPath);


    const namedAccounts = {}
    // TODO transform into checksum  address
    if(config.namedAccounts) {
        log.log('namedAccount')
        const nameConfig = config.namedAccounts;
        const accountNames = Object.keys(nameConfig);
        function parseSpec(spec) {
            let address;
            switch(typeof spec) {
                case "string":
                    if(spec.slice(0,5) == "from:") {
                        const from = parseInt(spec.substr(5));
                        address = [];
                        for(let j = from; j < _accounts.length; j++) {
                            address.push(_accounts[j]);
                        }
                    } else if(spec.slice(0,2).toLowerCase() == "0x") {
                        address = spec;
                    } else {
                        address = parseSpec(nameConfig[spec])
                    }
                break;
                case "number":
                    address = _accounts[spec];
                break;
                case "undefined":
                break;
                case "object":
                    if(spec) {
                        if(spec.type == 'object') {
                            address = spec;
                        } else if(Array.isArray(spec)) {
                            address = [];
                            for(let j = 0; j < spec.length; j++) {
                                address.push(parseSpec(spec[j]));
                            }   
                        } else if(spec[""+_chainId]) {
                            if(spec[""+_chainId] != "") {
                                address = parseSpec(spec[""+_chainId]);
                            }
                        } else if(isDeploymentChainId && spec['deployments']) {
                            if(spec['deployments'] != "") {
                                address = parseSpec(spec['deployments']);
                            }
                        } else {
                            address = parseSpec(spec['default']);
                        }
                    }
                break;
            }
            return address;
        }

        for(let i = 0; i < accountNames.length; i++) {
            const accountName = accountNames[i];
            const spec = nameConfig[accountName];
            namedAccounts[accountName] = parseSpec(spec);
        }
    }
    rocketh.namedAccounts = namedAccounts;
    
    if(attached) {
        //already setup
        return attached;
    }

    if(!_contractInfos) {
        _contractInfos = contractInfos;
    }

    let compilationInput;
    if(!_contractInfos){
        // TODO remove duplic :
        const contractBuildPath = path.join(config.rootPath || './', config.contractBuildPath || 'build');
        const cacheOutputPath = contractBuildPath + '/.compilationOutput.json';
        _contractInfos = extractContractInfos(JSON.parse(fs.readFileSync(cacheOutputPath).toString()), contractBuildPath);

        const intputPath = contractBuildPath + '/.compilationInput.json';
        compilationInput = JSON.parse(fs.readFileSync(intputPath).toString());
    }
    
    log.log('deployments', session.deployments);
    if(!session.deployments) {
        log.log('no deployments', deployments);
        session.deployments = deployments;
    }

    if(!session.deployments){
        log.log('extracting deployments for chainId', _chainId);
        session.deployments = extractDeployments(path.join(deploymentsPath, deploymentsSubPath));
    }

    let provider;
    if(ethereumNodeURl && ethereumNodeURl !== '') {
        if(url) {
            log.log('using node at ' + url + ' (' + _chainId + ')' + ' ...');
        }
        
        provider = getProvider(config, ethereumNodeURl, _chainId); // TODO for sol-trace _contractInfos, compilationInput, config.rootPath || './', config.contractSrcdPath || 'src');
    } else {
        console.error(colors.red('ROCKETH_NODE_URL not set'));
        process.exit(1);
    }

    rocketh.ethereum = provider;
    global.ethereum = provider;

    if(config.addRocketh) {
        global.rocketh = rocketh;
    }

    attached = {
        rocketh,
        contractInfos: _contractInfos,
        deployments: session.deployments,
        deploymentsPath
    };

    return attached;
}


module.exports = {
    runStages,
    runNode,
    compile,
    attach,
    rocketh,
    cleanDeployments
}
