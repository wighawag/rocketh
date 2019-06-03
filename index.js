#!/usr/bin/env node

const {
    attach,
    compile,
    runStages,
    runNode,
    rocketh,
    cleanDeployments,
    extractDeployments,
} = require('./run');

const {
    log,
    onExit
} = require('./utils');

const fs=require('fs');
const path=require('path');
const rimraf = require('rimraf');

if(!global._rocketh_session) {
    global._rocketh_session = {};
}
const session = global._rocketh_session;


let configFromFile;
try{
    configFromFile = require(path.resolve('./rocketh.config.js'));
} catch(e) {
    // console.error(e); // TODO check existence and show error if exists
    configFromFile = {};
}

// TODO improve :
const config = Object.assign(configFromFile, {
    silent: typeof configFromFile.silent != 'undefined' ? configFromFile.silent : true,
    node: typeof configFromFile.node != 'undefined' ? configFromFile.node : 'ganache',
    deploymentChainIds: typeof configFromFile.deploymentChainIds != 'undefined' ? configFromFile.deploymentChainIds : [
        '1','3','4','5','6','30','31','42','60','61','62','77','99','100','108',
    ],
    showErrorsFromCache: typeof configFromFile.showErrorsFromCache != 'undefined' ? configFromFile.showErrorsFromCache : false,
    generateTruffleBuildFiles: typeof configFromFile.generateTruffleBuildFiles != 'undefined' ? configFromFile.generateTruffleBuildFiles : false,
    cacheCompilationResult: typeof configFromFile.cacheCompilationResult != 'undefined' ? configFromFile.cacheCompilationResult : true,
    accounts: Object.assign(configFromFile.accounts || {}, {
        "default": {
            type: 'mnemonic', // TODO default type : "node" that make rocketh use unlocked accounts
            num: 10
        }
    })
});

const minimist = require('minimist');
const argv = (process.env._ROCKETH_ARGS && process.env._ROCKETH_ARGS != "") ? process.env._ROCKETH_ARGS.split(',') : process.argv.slice(2);

const parsedArgv = minimist(argv);
const command = parsedArgv._[0];
// console.log('COMMAND', command);
// console.log(argv);
// console.log(parsedArgv);
let commandIndex = argv.indexOf(command,0);
while(commandIndex % 2 != 0) {
    commandIndex = argv.indexOf(command, commandIndex+1);
}
// console.log('commandIndex', commandIndex);

const generalOptions = minimist(argv.slice(0, commandIndex));
// console.log('generalOptions', generalOptions);

const commandOptions = {
    
};

let i = commandIndex+1
for(; i < argv.length; i ++) {
    if(argv[i] == '-k') {
        commandOptions.k = argv[i+1];
        i++;
    } else if(argv[i] == '-n') {
        commandOptions.n = argv[i+1];
        i++;
    } else if(argv[i] == '-q') {
        commandOptions.q = argv[i+1];
        i++;
    } else {
        break;
    }
}
// console.log('commandOptions', commandOptions);
commandIndex = i;
const execution = argv.slice(commandIndex, argv.length);
// console.log({execution});


if(command == 'launch') {    
    if(commandOptions.q) {
        config.keepRunning = true;
        config.exportChains = commandOptions.q;
    }

    if(commandOptions.k) {
        config.keepRunning = commandOptions.k == 'true' ? true : commandOptions.k;
    }
    
    if(commandOptions.n) {
        if(['geth', 'ganache'].indexOf(commandOptions.n) != -1) {
            config.node = commandOptions.n;
        } else {
            config.url = commandOptions.n;
        }
    }
}

if(typeof generalOptions.l != 'undefined') {
    config.silent = !generalOptions.l;
}

log.setSlient(typeof config.silent != 'undefined' ? config.silent : true);

log.log(config);


if(require.main === module) {
    
    const spawn = require('cross-spawn');

    if(command == 'launch') {
        let _stopNode;
        let _cleaning = false;
        async function execute(command, ...args) {
            process.stdin.resume();//so the program will not close instantly

            async function cleanup(exitCode) {
                if(_cleaning) {return;}
                _cleaning = true;
                
                if(session.chainId && config.deploymentChainIds.indexOf(session.chainId) == -1) {
                    cleanDeployments();
                }
                if(config.exportChains) {
                    try{
                        rimraf.sync(config.exportChains);
                    }catch(e){
                
                    }
                }
                if(_stopNode) {
                    await _stopNode();
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

            
            let compileResult;
            try{
                compileResult = await compile(config);
            }catch(compileError) {
                console.error(compileError); // TODO compile error shown by compile itself ?
                process.exit(1);
            }

            const {contractInfos} = compileResult;
            const {chainId, url, accounts, stop, exposedMnemonic} = await runNode(config);
            
            session.chainId = chainId;
            session.url = url;
            session.accounts = accounts;
            
            _stopNode = stop;
            const result = attach(config, {chainId, url, accounts}, contractInfos);
            let newDeployments;
            try{
                newDeployments = await runStages(config, contractInfos, result.deployments);
            }catch(stageError) {
                console.error(stageError);
                process.exit(1);
            }

            if(config.exportChains) {
                const savedDeploymentPath = path.join(config.rootPath || './', config.deploymentsPath || 'deployments');
                const chainFolders = [];
                try{
                    fs.readdirSync(savedDeploymentPath).forEach((name) => {
                        const fPath = path.resolve(savedDeploymentPath, name);
                        const stats = fs.statSync(fPath);
                        if (name != chainId && stats.isDirectory()) {
                            chainFolders.push({path:fPath, chainId: name});
                        }
                    });
                } catch(e) {
                    // console.error(e);
                }
                const chainDeployments = {};
                for(let folder of chainFolders) {
                    chainDeployments[folder.chainId] = extractDeployments(folder.path);
                }
                chainDeployments[chainId] = newDeployments;
                
                const content = JSON.stringify(chainDeployments, null, '  ');
                fs.writeFileSync(config.exportChains, content);
                console.log('contracts info saved at ' + config.exportChains);
            }
        
            if(config.keepRunning) {
                console.log('node running at ' + url);
                const deployments = rocketh.deployments();
                for (const name of Object.keys(deployments)) {
                    const deploymentInfo = deployments[name];
                    const address = deploymentInfo.address;
                    // console.log('CONTRACT ' + name + ' DEPLOYED AT : ' + address);
                }
            } else if(command) {
                const childProcess = spawn(
                    command,
                    args,
                    {
                        stdio: [process.stdin, process.stdout, process.stderr],
                        env: Object.assign(Object.assign({}, process.env), {
                            _ROCKETH_NODE_URL: url,
                            _ROCKETH_CHAIN_ID: chainId,
                            _ROCKETH_ACCOUNTS: accounts.join(','), // TODO get rif of accounts
                            _ROCKETH_MNEMONIC: exposedMnemonic ? exposedMnemonic.split(' ').join(',') : undefined,
                            _ROCKETH_DEPLOYMENTS: result.deploymentsPath,
                            _ROCKETH_ARGS: argv.join(','),
                        })
                    }
                );
                try{
                    exitCode = await onExit(childProcess);
                }catch(e) {
                    if(e.code) {
                        exitCode = e.code;
                    } else {
                        console.error('ERROR onExit', e);
                    }
                }
                cleanup(exitCode);
            } else {
                // for (const name of Object.keys(newDeployments)) {
                //     const deploymentInfo = newDeployments[name];
                //     const address = deploymentInfo.address;
                //     console.log('CONTRACT ' + name + ' DEPLOYED AT : ' + address);
                // }                 
                cleanup(0); 
            }
            
        }
        execute(execution[0], ...execution.slice(1));
    } else if(command == "verify") {
        let mythx_credentials;
        try{
            mythx_credentials = JSON.parse(fs.readFileSync('./.mythx_credentials').toString());
        } catch(e) {console.error(e)}
        
        if(!mythx_credentials) {
            console.log(".mythx_credentials not found");
            process.exit(1);
        }

        verify();

        async function verify() {
            const armlet = require('armlet');
            const {contractInfos, solcConfig} = await compile(config);
            const sourceList =  Object.keys(solcConfig.sources);
            const sources = {};
            for(let i = 0; i < sourceList.length; i++) {
                const source = solcConfig.sources[sourceList[i]].content;
                sources[sourceList[i]] = {
                    source
                };
            }
            const client = new armlet.Client(mythx_credentials);
            const contractNames = Object.keys(contractInfos);
            for(let i = 0; i < contractNames.length; i++) {
                const contractName = contractNames[i];
                // TODO remove
                // if(contractName != 'Sand') {
                //     continue;
                // }
                const contractInfo = contractInfos[contractName];
                if(!contractInfo.evm || !contractInfo.evm.bytecode || !contractInfo.evm.bytecode.object || contractInfo.evm.bytecode.object == "") {
                    continue;
                }
                console.log('verifying ' + contractName + ' ...');
                const data = {
                    contractName,
                    abi: contractInfo.abi,
                    bytecode: '0x' + contractInfo.evm.bytecode.object,
                    deployedBytecode: '0x' + contractInfo.evm.deployedBytecode.object,
                    sourceMap: contractInfo.evm.bytecode.sourceMap,
                    deployedSourceMap: contractInfo.evm.deployedBytecode.sourceMap,
                    sourceList,
                    sources,
                    analysisMode: 'full',
                };
                try{
                    const issues = await client.analyzeWithStatus({
                        data,
                        timeout: 10*60*1000,
                        clientToolName: 'rocketh'
                    });
                    console.log('issues', JSON.stringify(issues, null, '  '));
                } catch(e) {
                    console.log('err', e)
                }
            }
        }
    }
} else {
    const session = global._rocketh_session;
    attach(config, {chainId: session.chainId, url: session.url, accounts: session.accounts});
}

module.exports = rocketh;
