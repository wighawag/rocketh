const path = require('path');
const fs = require('fs');
const colors = require('colors/safe');
const ethers = require('ethers');
const deepmerge = require('deepmerge');

function pause(s) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, s*1000);
    });
}

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
        currentFolder = path.resolve(currentFolder, '..');
    } while (path.resolve(currentFolder, '..') != currentFolder);

    throw(new Error("can't find module " + moduleName));
}

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

function getAccountsFromMnemonic(mnemonic, num) {
    const accounts = [];
    for(let i = 0; i < num; i++) { // TODO 10 is config of number of accounts
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/"+i);
        accounts.push(wallet.address);
    }
    return accounts;
}

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

function fetchTransaction(url, hash) {
    const provider = new ethers.providers.JsonRpcProvider(url);
    return provider.send('eth_getTransactionByHash',[hash]);
}

function fetchTransactionViaWeb3Provider(provider, hash) { // TODO remove
    return new Promise((resolve, reject) => {
        provider.send({id:1, method: 'eth_getTransactionByHash', params:[hash], jsonrpc: '2.0'}, (error, json) => {
            if (error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        })
    });
}

function fetchReceiptViaWeb3Provider(provider, hash) { // TODO remove
    return new Promise((resolve, reject) => {
        provider.send({id:1, method: 'eth_getTransactionReceipt', params:[hash], jsonrpc: '2.0'}, (error, json) => {
            if (error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        })
    });
}

function fetchAccounts(url) {
    const provider = new ethers.providers.JsonRpcProvider(url);
    return provider.send('eth_accounts',[]);
}

function parseChainId(chainId) {
    if (typeof chainId === 'string') {
        if(chainId.startsWith('0x') || chainId.startsWith('0X')) {
            return '' + parseInt(chainId.substr(2),16);
        } else {
            return chainId;
        }
    } else if(typeof chainId === 'number') {
        return '' + chainId;
    }
    return null;
}

function fetchChainId(url, use_net_version) {
    const method = use_net_version ? 'net_version' : 'eth_chainId';
    const provider = new ethers.providers.JsonRpcProvider(url);
    return provider.send(method,[]).then((chainId) => {
        return parseChainId(chainId);
    });
}

function fetchChainIdViaWeb3Provider(provider, use_net_version) { // TODO remove
    const method = use_net_version ? 'net_version' : 'eth_chainId';
    return new Promise((resolve, reject) => {
        provider.send({id:1, method, params:[], jsonrpc: '2.0'}, (error, json) => {
            if (error) {
                reject(error);
            } else {
                const result = parseChainId(json.result);
                if(result) {
                    resolve(result);
                } else {
                    reject({message: 'could not decode chainId'});
                }
            }
        })
    });
}

const traverse = function(dir, result = [], topDir, filter) {
    fs.readdirSync(dir).forEach((name) => {
        const fPath = path.resolve(dir, name);
        const stats = fs.statSync(fPath);
        if(!filter || filter(name, stats)) {
            const fileStats = { name, path: fPath, relativePath: path.relative(topDir || dir, fPath), mtimeMs: stats.mtimeMs, directory: stats.isDirectory() };
            if (fileStats.directory) {
                result.push(fileStats);
                return traverse(fPath, result, topDir || dir)
            }
            result.push(fileStats);
        }
    });
    return result;
};

let silent = false;
function log(...args) {
    if(silent) { return; }
    console.log.apply(console, args);
}

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

module.exports = {
    onExit,
    traverse,
    requireLocal,
    executeServer,
    fetchAccounts,
    fetchChainId,
    fetchChainIdViaWeb3Provider,
    fetchTransaction,
    fetchTransactionViaWeb3Provider,
    fetchReceiptViaWeb3Provider,
    getAccountsFromMnemonic,
    pause,
    mergeConfig: (base, extra) => deepmerge(base, extra, { arrayMerge: overwriteMerge }),
    log : {
        setSlient: (s) => silent = s,
        log : (...args) => log(...args),
        error: (...args) => console.error(...args),
        red : (message) => console.error(colors.red(message)),
        green : (message) => log(colors.green(message)),
        blue : (message) => log(colors.blue(message)),
        cyan : (message) => log(colors.cyan(message)),
        yellow : (message) => log(colors.yellow(message)),
    }
    
}