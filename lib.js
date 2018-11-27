const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

function requireLocal(moduleName) {
    // TODO go up the file hierarchy and then require the moduleName if all else fails. rocketh could provide a default
    return require(path.resolve('./node_modules/' + moduleName));
}


const traverse = function(dir, result = []) {
    fs.readdirSync(dir).forEach((name) => {
        const fPath = path.resolve(dir, name);
        const fileStats = { name, path: fPath };
        if (fs.statSync(fPath).isDirectory()) {
            fileStats.type = 'dir';
            fileStats.files = [];
            result.push(fileStats);
            return traverse(fPath, fileStats.files)
        }
        fileStats.type = 'file';
        result.push(fileStats);
    });
    return result;
};

// TODO : config to allow specify non-default paths
const contractSrcPath = 'src';
const contractBuildPath = 'build';
const migrationsPath = 'migrations';

let artifacts = {}
let contractInfos = {}
let compilationDone = false;
let initialised = false;

const rocketh = {
    reRunMigrations: runMigrations,
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

function setupGlobals(addRocketh) {
    try{
        ganache = requireLocal('ganache-cli');
    } catch(e) {
        console.error(colors.red('you need to install your desired ganache-cli version in your own project: "npm install ganache-cli"'));
        // TODO config own provider + defaults like nodeUrl, ganache-cli with privateKey signer...
        process.exit(1);
    }

    global.ethereum = ganache.provider();
    global.ethereum.setMaxListeners(200); // TODO is there a leak or do we need to up that limit (warning was at 11)

    if(addRocketh) {
        global.rocketh = rocketh;
    }
    return rocketh;
}

function compile(solc, resolve, reject, runAsScript) {
    const files = traverse(contractSrcPath);
    const sources = {};
    for (const file of files) {
        if(file.type === 'file' && file.name.indexOf('.sol') === file.name.length - 4) {
            sources[file.name] = {
                content: fs.readFileSync(file.path).toString()
            };
        }
    }

    // TODO : config // merge from File ? add sources...
    const solcConfig = JSON.stringify({
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
    
    console.log(colors.green('########################################### COMPILING #############################################################'));
    const rawOutput = solc.compile(solcConfig);
    const output = JSON.parse(rawOutput);
    
    const warnings = [];
    const errors = [];
    const others = []; // TODO
    if(output.errors) {
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
        console.log(colors.green('###################################################################################################################'));
        reject();
    } else {
        for (const warning of warnings) {
            console.log(colors.yellow(warning.formattedMessage));
        }
        for (const other of others) {
            console.log(colors.cyan(other.formattedMessage));
        }
        console.log(colors.green('###################################################################################################################'));
        for (const fileName of Object.keys(output.contracts)) {
            for (const contractName of Object.keys(output.contracts[fileName])) {
                const contractInfo = output.contracts[fileName][contractName];
                const content = JSON.stringify(contractInfo, null, '  ');
                if(contractName === "") {
                    contractName = fileName; // TODO remove extension ?
                }
                if (runAsScript) {
                    fs.writeFileSync(contractBuildPath + '/' + contractName + '.json', content);
                }
                contractInfos[contractName] = contractInfo;
            }
        }
        compilationDone = true;
        resolve();
    }
}


async function runMigrations() {
    // console.log(colors.green('######################################### MIGRATIONS ##############################################################'));
    let fileNames;
    try{
        fileNames = fs.readdirSync(migrationsPath);
    } catch(e) {
        console.log(colors.green('no migrations folder at ./' + migrationsPath));
        return artifacts;
    }
    fileNames = fileNames.filter((fileName) => {
        return (!fs.statSync(path.resolve(migrationsPath, fileName)).isDirectory());
    });
    fileNames = fileNames.sort((a,b)=>{
        if(a < b) { return -1; }
        if(a > b) { return 1; }
        return 0;
    });
    artifacts= {};
    for (const fileName of fileNames) {
        await require(path.resolve(".") + '/' + migrationsPath + '/' + fileName)({
            accounts: rocketh.accounts,
            registerArtifact: (name, artifact, contractInfo, address) => {
                if(artifacts[name]){
                    console.error(colors.red('artifcat with same name ('+name+') exists'));
                } else {
                    artifacts[name] = artifact;
                }
                //TODO deployment saving using contractInfo and address // even if duplicate name error
            } 
        });
    }
    // console.log(colors.green('###################################################################################################################'));
    return artifacts;
}

function deployContract(contractInfo, arguments) {
    global.ethereum.send({id:1, method:'eth_sendTransaction', params:[{
        from:rocketh.accounts[0],
        gas: options.gas || 0x6691b7, //TODO configure default gas
        value: options.value,
        data: contractInfo.evm.bytecode.object // TODO required o be enabled // TODO add arguments
    }]}, (error, txHash) => {
        if (error) {
            reject(error);
        } else {
            global.ethereum.send({id:1, method:'eth_sendTransaction', params:[{}]}, (error, receipt) => {
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
        global.ethereum.send({id:1, method:'eth_accounts', params:[]}, (error, json) => {
            if (error) {
                reject(error);
            } else {
                rocketh.accounts = json.result;
                resolve(json.result);
            }
        })
    })
}

let promise
function setup() {
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
        
        compile(solc, resolve, reject, require.main === module);
    });

    promise = promise.then(fetchAccounts);

    promise = promise.then(runMigrations);

    promise = promise.then(() => { initialised = true; return rocketh.accounts; })

    return promise;
}

function waitForMocha(doSomething) {
    let intervalId;
    intervalId = setInterval(() =>{ // wait for global.run to be available
        if(global.run) {
            clearInterval(intervalId);
            promise = setup()
            if(doSomething) {
                promise = promise.then(doSomething)
            }
            promise.then(() => global.run());
        }
    }, 200)
}

module.exports = {
    setup,
    setupGlobals,
    runMigrations,
    waitForMocha,
    rocketh,
    requireLocal
}
