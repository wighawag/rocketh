#!/usr/bin/env node

const {
    attach,
    compile,
    runStages,
    runNode,
    rocketh,
    cleanDeployments
} = require('./run');

const fs=require('fs');

function onExit(childProcess) {
    return new Promise((resolve, reject) => {
        childProcess.once('exit', (code, signal) => {
        if (code === 0) {
            resolve();
        } else {
            reject({error: new Error('Exit with error code: '+code), code});
        }
        });
        childProcess.once('error', (err) => {
            reject(err);
        });
    });
}

let configFromFile;
try{
    configFromFile = require('./rocketh.config.js')
} catch(e) {
    configFromFile = {};
}
const config = Object.assign(configFromFile, {
    node: 'ganache'
});

const deploymentChainIds = ['1','3','4','42', '1550250818351']; // TODO config


let _chainId;
let _accounts;
let _url;
let _exposedMnemonic;

if(require.main === module) {
    const minimist = require('minimist'); 
    const spawn = require('cross-spawn');

    const argv = process.argv.slice(2);
    const parsedArgv = minimist(argv);
    const command = parsedArgv._[0];
    // console.log('COMMAND', command);
    // console.log(argv);
    // console.log(parsedArgv);
    
    if(command == 'launch') {
        let commandIndex = argv.indexOf(command,0);
        while(commandIndex % 2 != 0) {
            commandIndex = argv.indexOf(command, commandIndex+1);
        }
        // console.log('commandIndex', commandIndex);

        let start
        if(parsedArgv._.length > 1) {
            start = parsedArgv._[1];
        }
        let startIndex = argv.indexOf(start,0);
        while(startIndex % 2 != 1) {
            startIndex = argv.indexOf(start, startIndex+1);
        }
        
        // console.log('startIndex', startIndex);

        const generalOptions = minimist(argv.slice(0, commandIndex));
        // console.log('generalOptions', generalOptions);
        const commandOptions = minimist(argv.slice(commandIndex+1, startIndex));
        // console.log('commandOptions', commandOptions);
    
        let _stopNode;
        let _cleaning = false;
        async function execute(command, ...args) {
            process.stdin.resume();//so the program will not close instantly

            async function cleanup(exitCode) {
                if(_cleaning) {return;}
                _cleaning = true;
                
                if(_chainId && deploymentChainIds.indexOf(chainId) == -1) {
                    cleanDeployments();
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

            if(commandOptions.n) {
                if(['geth', 'ganache'].indexOf(commandOptions.n) != -1) {
                    config.node = commandOptions.n;
                } else {
                    config.url = commandOptions.n;
                }
                
            }

            // TODO remove
            if(commandOptions.l) {
                config.log = true;
            }

            // console.log('execute', command, ...args);

            let compileResult;
            try{
                compileResult = await compile(config);
            }catch(compileError) {
                // console.log(compileError);
                process.exit();
            }

            const {contractInfos} = compileResult;
            const {chainId, url, accounts, stop, exposedMnemonic} = await runNode(config);
            _exposedMnemonic = exposedMnemonic
            _chainId = chainId;
            _accounts = accounts;
            _url = url;
            _stopNode = stop;
            
            if(config.log) {
                console.log('attaching with ', {chainId, url, accounts, mnemonic: _exposedMnemonic});
            }
            const result = attach(config, {chainId, url, accounts, mnemonic: _exposedMnemonic}, contractInfos);
            try{
                await runStages(result.rocketh.ethereum, config, contractInfos, result.deployments);
            }catch(stageError) {
                console.log(stageError);
                process.exit(1);
            }
            
            const childProcess = spawn(
                command,
                args,
                {
                    stdio: [process.stdin, process.stdout, process.stderr],
                    env:{
                        _ROCKETH_NODE_URL: url,
                        _ROCKETH_CHAIN_ID: chainId,
                        _ROCKETH_ACCOUNTS: accounts.join(','), // TODO get rif of accounts
                        _ROCKETH_MNEMONIC: _exposedMnemonic ? _exposedMnemonic.split(' ').join(',') : undefined
                    }
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
            cleanup(exitCode)
        }
        execute(argv[startIndex], ...argv.slice(startIndex+1));
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
    console.log('direct attaching', {chainId: _chainId, url: _url, accounts: _accounts, mnemonic: _exposedMnemonic});
    attach(config, {chainId: _chainId, url: _url, accounts: _accounts, mnemonic: _exposedMnemonic}); 
}

module.exports = rocketh;
