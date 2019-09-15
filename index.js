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

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

if (!global._rocketh_session) {
    global._rocketh_session = {};
}
const session = global._rocketh_session;

function pause(duration) {
    return new Promise((res) => setTimeout(res, duration * 1000));
}

let configFromFile;
try {
    configFromFile = require(path.resolve('./rocketh.config.js'));
} catch (e) {
    // console.error(e); // TODO check existence and show error if exists
    configFromFile = {};
}

// TODO improve :
const config = Object.assign(configFromFile, {
    silent: typeof configFromFile.silent != 'undefined' ? configFromFile.silent : true,
    node: typeof configFromFile.node != 'undefined' ? configFromFile.node : 'ganache',
    deploymentChainIds: typeof configFromFile.deploymentChainIds != 'undefined' ? configFromFile.deploymentChainIds : [
        '1', '3', '4', '5', '6', '30', '31', '42', '60', '61', '62', '77', '99', '100', '108',
    ],
    showErrorsFromCache: typeof configFromFile.showErrorsFromCache != 'undefined' ? configFromFile.showErrorsFromCache : false,
    generateTruffleBuildFiles: typeof configFromFile.generateTruffleBuildFiles != 'undefined' ? configFromFile.generateTruffleBuildFiles : false,
    cacheCompilationResult: typeof configFromFile.cacheCompilationResult != 'undefined' ? configFromFile.cacheCompilationResult : true,
    accounts: Object.assign({
        "default": {
            type: 'node'
        }
    }, configFromFile.accounts || {})
});


function setupAnd(func) {
    return (...args) => {
        // const cmdObj = args[args.length-1];
        config.silent = !program.verbose;
        log.setSlient(config.silent);
        log.log(config);
        if (require.main === module) {
            func(...args);
        } else {
            const session = global._rocketh_session;
            attach(config, { chainId: session.chainId, url: session.url, accounts: session.accounts });
        }
    }
}

function executeOrAttach(execution, willRunStages) {
    const spawn = require('cross-spawn');
    let _stopNode;
    let _cleaning = false;
    async function execute(command, ...args) {
        process.stdin.resume();//so the program will not close instantly

        async function cleanup(exitCode) {
            if (_cleaning) { return; }
            _cleaning = true;

            if (session.chainId && config.deploymentChainIds.indexOf(session.chainId) == -1) {
                cleanDeployments();
            }
            // if (config.exportContracts) {
            //     try {
            //         rimraf.sync(config.exportContracts);
            //     } catch (e) {

            //     }
            // }
            if (_stopNode) {
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
        try {
            compileResult = await compile(config);
        } catch (compileError) {
            console.error(compileError); // TODO compile error shown by compile itself ?
            process.exit(1);
        }

        const { contractInfos } = compileResult;
        const { chainId, url, accounts, stop, exposedMnemonic } = await runNode(config);

        session.chainId = chainId;
        session.url = url;
        session.accounts = accounts;

        _stopNode = stop;
        const result = attach(config, { chainId, url, accounts }, contractInfos);

        let newDeployments = {};
        if (willRunStages) {
            
            try {
                // console.log('running stages...');
                newDeployments = await runStages(config, contractInfos, result.deployments);
            } catch (stageError) {
                console.error(stageError);
                process.exit(1);
            }
        }

        if (config.exportContracts) {
            const savedDeploymentPath = path.join(config.rootPath || './', config.deploymentsPath || 'deployments');
            const chainFolders = [];
            try {
                fs.readdirSync(savedDeploymentPath).forEach((name) => {
                    const fPath = path.resolve(savedDeploymentPath, name);
                    const stats = fs.statSync(fPath);
                    if (name != chainId && stats.isDirectory()) {
                        chainFolders.push({ path: fPath, chainId: name });
                    }
                });
            } catch (e) {
                // console.error(e);
            }
            const chainDeployments = {};
            for (let folder of chainFolders) {
                chainDeployments[folder.chainId] = extractDeployments(folder.path);
            }
            chainDeployments[chainId] = newDeployments;

            const content = JSON.stringify(chainDeployments, null, '  ');
            fs.writeFileSync(config.exportContracts, content);
            console.log('contracts info saved at ' + config.exportContracts);
        }

       
        let exitCode = 0;
        if (command) {
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
            try {
                exitCode = await onExit(childProcess);
            } catch (e) {
                if (e.code) {
                    exitCode = e.code;
                } else {
                    console.error('ERROR onExit', e);
                }
            }
        }

        if (config.keepRunning) {
            console.log('node running at ' + url);
        } else {
            cleanup(exitCode);
        }
    }
    if(execution && execution.length > 0) {
        execute(execution[0], ...execution.slice(1));
    } else {
        execute();
    }
    
}

function verify(contractNameOrUUID, willCheckUUID) {
    let mythx_credentials;
    try {
        mythx_credentials = JSON.parse(fs.readFileSync('./.mythx_credentials').toString());
    } catch (e) { console.error(e) }

    if (!mythx_credentials) {
        console.log(".mythx_credentials not found");
        process.exit(1);
    }

    const MythX = require('mythxjs');
    const client = new MythX.Client(mythx_credentials.ethAddress, mythx_credentials.password, 'rocketh');

    runVerify();

    async function runVerify() {
        let tokens;
        try {
            tokens = await client.login();
        } catch (e) {
            console.log('error logging in ', e);
            process.exit(1);
        }
        if (willCheckUUID) {
            await checkUUID(contractNameOrUUID);
        } else {
            if (contractNameOrUUID) {
                verify(contractNameOrUUID); // TODO use option for main
            } else {
                console.log("need to specify contract name");
                process.exit(1);
            }
        }

        async function checkUUID(uuid) {
            console.log('uuid : ' + uuid);

            let status;
            while (status !== 'Finished' && status !== 'Error') {
                let statusResponse;
                try {
                    statusResponse = await client.getAnalysisStatus(uuid);
                } catch (e) {
                    console.error(e);
                    await client.login();
                }
                if (statusResponse) {
                    if (status !== statusResponse.status) {
                        status = statusResponse.status;
                        console.log(status);
                    }
                }
                if (status !== 'Finished' && status !== 'Error') {
                    await pause(60);
                    //TODO
                    // try{
                    //     await client.refreshToken();    
                    // } catch(e) {
                    //     console.error(e);
                    // }

                } else {
                    console.log(status);
                }
            }
            console.log('fetching issues...');
            const issues = await client.getDetectedIssues(uuid);
            console.log('issues', JSON.stringify(issues, null, '  '));
        }


        async function verify(contractName, pathToMain) {
            const { contractInfos, solcConfig, solcVersion, contractSrcPaths } = await compile(config);
            const sourceList = Object.keys(solcConfig.sources);
            const sources = {};
            for (let i = 0; i < sourceList.length; i++) {
                const source = solcConfig.sources[sourceList[i]].content;
                sources[sourceList[i]] = {
                    source
                };
            }
            // const contractNames = Object.keys(contractInfos);
            // for(let i = 0; i < contractNames.length; i++) {
            //     const contractName = contractNames[i];
            const contractInfo = contractInfos[contractName];
            if (!contractInfo) {
                console.log('no contract with name : ' + contractName);
                process.exit(1);
            }
            if (!contractInfo.evm || !contractInfo.evm.bytecode || !contractInfo.evm.bytecode.object || contractInfo.evm.bytecode.object == "") {
                // continue;
                console.log('no evm code for ' + contractName);
                process.exit(1);
            }
            console.log('verifying ' + contractName + ' ...');
            const data = {
                toolName: 'rocketh',
                mainSource: pathToMain || (contractSrcPaths[0] + '/' + contractName + '.sol'),
                contractName,
                abi: contractInfo.abi,
                bytecode: '0x' + contractInfo.evm.bytecode.object,
                deployedBytecode: '0x' + contractInfo.evm.deployedBytecode.object,
                sourceMap: contractInfo.evm.bytecode.sourceMap,
                deployedSourceMap: contractInfo.evm.deployedBytecode.sourceMap,
                sourceList,
                sources,
                analysisMode: 'full',
                // solcVersion, // TODO use package present
            };

            console.log({ solcVersion });
            // console.log(JSON.stringify(data,null,'  '));
            // console.log(JSON.stringify(data.sources,null,'  '));
            // process.exit(0);

            try {
                const response = await client.analyze(data);
                const uuid = response.uuid;
                await checkUUID(uuid)
            } catch (e) {
                console.log('err', e)
            }
            // }
        }
    }
}

const program = require('commander');
const pkg = require('./package.json')
program.version(pkg.version);
let argv;
if (process.env._ROCKETH_ARGS && process.env._ROCKETH_ARGS != "") {
    argv = process.env._ROCKETH_ARGS.split(',');
} else {
    argv = process.argv;
}

program.option("-v, --verbose", 'more verbose output');

program.command('launch [cmd]')
.description('launch a node and execute cmd')
.option('-n, --node <node>', 'specify a node type (geth|ganache) or a url')
.option('-q, --export-contracts <path>', 'export contractsInfo in <path>')
.option('-k, --keep-running', 'do not stop the node once stages executed (not for url)')
.option('-b, --block-time <blockTime>', 'specify a block time at which the node launched (not for url) will be mining')
.action(setupAnd(function(cmd, cmdObj){
    // if(!cmdObj) {
    //     console.error('launch cmd argument missing ')
    //     process.exit(1);
    // }

    if(cmdObj.keepRunning) {
        config.keepRunning = true;
    }
    
    if (['geth', 'ganache'].indexOf(cmdObj.node) != -1) {
        config.node = cmdObj.node;
        if(cmdObj.blockTime) {
            config.blockTime = parseInt(cmdObj.blockTime);
        }
    } else {
        config.url = cmdObj.node;
        config.keepRunning = false;
    }

    if(cmdObj.exportContracts) {
        config.exportContracts = cmdObj.exportContracts;
    }
    
    executeOrAttach(cmd ? cmd.split(' ') : undefined, true); // TODO split even with more spaces
}));

program.command('attach <url> [cmd]')
.description('attach to a url and execute cmd')
.option('-q, --export-contracts <path>', 'export contractsInfo in <path>')
.action(setupAnd(function(url, cmd, cmdObj){
    config.url = url;
    if(cmdObj.exportContracts) {
        config.exportContracts = cmdObj.exportContracts;
    }
    executeOrAttach(cmd ? cmd.split(' ') : undefined, false); // TODO split even with more spaces
}));

program.command('verify <contractName>')
.action(setupAnd(function(contractName, cmdObj){
    verify(contractName, false);
}));

program.command('verifyStatus <uuid>')
.action(setupAnd(function(uuid, cmdObj){
    verify(uuid, true);
}));

program.on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
});


program.parse(argv);

module.exports = rocketh;
