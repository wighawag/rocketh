const ethers = require('ethers');

const Provider = function(provider, mnemonic, numWallets) {
    if(!numWallets) {
        numWallets = 10;
    }
    this.provider = provider;
    this.accounts = [];
    this.wallets = {};

    for(let i = 0; i < numWallets; i++) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/"+i);
        this.wallets[wallet.address.toLowerCase()] = wallet;
        this.accounts.push(wallet.address);
    }
}

Provider.prototype.send = function(payload, callback) {
    this.sendPayload(payload, callback);
}

Provider.prototype.fetchGasPrice = function() {
    return new Promise((resolve, reject) => {
        this.provider.send({ method: 'eth_gasPrice'}, (error, result) =>{
            if(error) {
                reject(error);
            } else {
                resolve(result.result);
            }
        });
    })
}

Provider.prototype.fetchNonce = function(from) {
    return new Promise((resolve, reject) => {
        this.provider.send({ method: 'eth_getTransactionCount', params: [from, 'latest'] }, (error, result) =>{
            if(error) {
                reject(error);
            } else {
                resolve(result.result);
            }
        });
    })
}


Provider.prototype.sendPayload = async function(payload, callback) {
    // console.log('send', JSON.stringify(payload, null, '  '));

    if (payload.method === 'eth_accounts' && this.accounts) {
        const inputPayload = Object.assign({}, {
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            result: this.accounts,
        });
        return callback(null, inputPayload);
    } else if (payload.method === 'eth_sendTransaction') {
        // TODO check balance
        const nonce = await this.fetchNonce(payload.params[0].from);
        const gasPrice = await this.fetchGasPrice();
        const rawTx = payload.params[0];
        const forEthers = {
            to: rawTx.to,
            gasLimit: rawTx.gas,
            gasPrice,
            nonce,
            data: rawTx.data,// ? (rawTx.data[1].toLowerCase() == 'x' ? rawTx.data : '0x' + rawTx.data) : undefined,
            value: rawTx.value,
            chainId: rawTx.chainId
        }
        const signedTx = await this.signTransaction(rawTx.from, forEthers);
        return this.provider.send({
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            method: 'eth_sendRawTransaction',
            params: [signedTx],
          }, callback);
    } else {
        return this.provider.send(payload, callback);
    }
}

Provider.prototype.subscribe = function() {
    throw new Error('Subscriptions are not supported with the HttpProvider.');
}

Provider.prototype.unsubscribe = function() {
    throw new Error('Subscriptions are not supported with the HttpProvider.');
}

Provider.prototype.disconnect = function() {
    return true;
}

Provider.prototype.signTransaction = function(from, rawTx) {
    // console.log('rawTx', rawTx);
    const wallet = this.wallets[from.toLowerCase()];
    return wallet.sign(rawTx);
}

module.exports = Provider;
