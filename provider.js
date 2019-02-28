const ethers = require('ethers');
const BN = require('bn.js');

const Provider = function(provider, mnemonic, numWallets) {
    if(!numWallets) {
        numWallets = 10;
    }
    this.lastId = 0;
    this.provider = provider;
   
    if(mnemonic){
        this.accounts = [];
        this.wallets = {};    
        for(let i = 0; i < numWallets; i++) {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/"+i);
            this.wallets[wallet.address.toLowerCase()] = wallet;
            this.accounts.push(wallet.address);
        }
    }
}

Provider.prototype.send = function(payload, callback) {
    this.sendPayload(payload, callback);
}

Provider.prototype.fetchGasPrice = function() {
    return new Promise((resolve, reject) => {
        this.provider.send({id: ++this.lastId, method: 'eth_gasPrice'}, (error, result) =>{
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
        this.provider.send({ id: ++this.lastId, method: 'eth_getTransactionCount', params: [from, 'latest'] }, (error, result) =>{
            if(error) {
                reject(error);
            } else {
                resolve(result.result);
            }
        });
    })
}

Provider.prototype.fetchBalance = function(from) {
    return new Promise((resolve, reject) => {
        this.provider.send({ id: ++this.lastId, method: 'eth_getBalance', params: [from, 'latest'] }, (error, result) =>{
            if(error) {
                reject(error);
            } else {
                resolve(result.result);
            }
        });
    })
}


Provider.prototype.sendPayload = async function(payload, callback) {
    if(!this.wallets) {
        return this.provider.send(payload, callback);
    }
    // #console.log('send', JSON.stringify(payload, null, '  '));
    // var err = new Error();
    // console.log(payload.method, err.stack);
        

    if (payload.method === 'eth_accounts' && this.accounts) {
        const inputPayload = Object.assign({}, {
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            result: this.accounts,
        });
        return callback(null, inputPayload);
    } else if (payload.method === 'eth_sendTransaction') {
        const rawTx = payload.params[0];
        const from = rawTx.from;

        if(!rawTx.gas) {
            return callback({
                id: payload.id,
                jsonrpc: payload.jsonrpc,
                error: { code: -32000, message: 'gas not specified' } // TODO code
            })
        }

        const gasPrice = rawTx.gasPrice || await this.fetchGasPrice();
        const balanceRequired = new BN(gasPrice).mul(new BN(rawTx.gas));
        const balance = await this.fetchBalance(from);

        if(new BN(balance).lt(balanceRequired)) {
            return callback({
                id: payload.id,
                jsonrpc: payload.jsonrpc,
                error: { code: -32000, message: 'Not enough balance' } // TODO code 
            })
        }
        const nonce = await this.fetchNonce(from);
        
        const forEthers = {
            to: rawTx.to,
            gasLimit: rawTx.gas,
            gasPrice,
            nonce,
            data: rawTx.data,// ? (rawTx.data[1].toLowerCase() == 'x' ? rawTx.data : '0x' + rawTx.data) : undefined,
            value: rawTx.value,
            chainId: rawTx.chainId
        }
        const signedTx = await this.signTransaction(from, forEthers);
        return this.provider.send({
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            method: 'eth_sendRawTransaction',
            params: [signedTx],
          }, callback);
    } else if(payload.method == 'eth_sign') {
        const signedMessage = await this.signMessage(payload.params[0], payload.params[1]);
        // console.log(payload.params, signedMessage);
        return callback(null, {
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            result: signedMessage
        });
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

Provider.prototype.signMessage = function(from, message) {
    if(message[0] == '0' && message[1] == 'x') { // work arround : if start with 0x interpret it as binary data
        message = ethers.utils.arrayify(message);
    }
    const wallet = this.wallets[from.toLowerCase()];
    return wallet.signMessage(message);
}

module.exports = Provider;
