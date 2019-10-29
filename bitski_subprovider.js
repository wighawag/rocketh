const ethers = require('ethers');
const { BigNumber } = ethers;
const Bitski = require("bitski-node");
const {
    log
} = require('./utils');

const BitskiSubProvider = function(clientID, credentialID, secret, accounts, chainId, config) {
    let network = 'mainnet';
    if(chainId === '4') {
        network = 'rinkeby';
    } else if (chainId === '42') {
        network = 'kovan';
    } // else if (chainId == 3) {
    //     network = 'ropsten';
    // }

    this.lastId = 0;
    const options = {
        credentials: {
          id: credentialID,
          secret,
        },
        network,
        debug: config.debug,
        disableBlockTracking: true,
    };
      
    // Pass options with the provider
    this.bitskiProvider = Bitski.getProvider(clientID, options);
    // this.bitskiProvider._blockTracker.stop();
    this.accounts = accounts;
}

BitskiSubProvider.prototype.setEngine = function(engine) {
    this.engine = engine;
}

BitskiSubProvider.prototype.fetchGasPrice = function() {
    const self = this;
    return new Promise((resolve, reject) => {
        self.engine.sendAsync({id: ++this.lastId, method: 'eth_gasPrice', jsonrpc: '2.0'}, (error, json) =>{
            if(error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        });
    })
}

BitskiSubProvider.prototype.fetchNonce = function(from) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.engine.sendAsync({ id: ++this.lastId, method: 'eth_getTransactionCount', params: [from, 'latest'], jsonrpc: '2.0'}, (error, json) =>{
            if(error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        });
    })
}

BitskiSubProvider.prototype.fetchBalance = function(from) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.engine.sendAsync({ id: ++self.lastId, method: 'eth_getBalance', params: [from, 'latest'], jsonrpc: '2.0'}, (error, json) =>{
            if(error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        });
    })
}

BitskiSubProvider.prototype.handleRequest = async function(payload, next, end) {
    const self = this;
    if (payload.method === 'eth_accounts' && this.accounts) {
        return end(null, this.accounts);
    } else if (payload.method === 'eth_sendTransaction') {
        const rawTx = payload.params[0];
        const from = rawTx.from;

        if(!rawTx.gas) {
            return end(new Error('gas not specified'));
        }

        const gasPrice = BigNumber.from(rawTx.gasPrice || await this.fetchGasPrice());
        const gas = BigNumber.from(rawTx.gas);
        const balance = BigNumber.from(await this.fetchBalance(from));
        const value = BigNumber.from(rawTx.value || 0);
        const balanceRequired = (gasPrice.mul(gas)).add(value);
        
        // console.log({
        //     gas: gas.toString(),
        //     value: value.toString(),
        //     gasPrice: gasPrice.toString(),
        //     balanceRequired: balanceRequired.toString(),
        //     balance: balance.toString(),
        // })
        if(balance.lt(balanceRequired)) {
            return end(new Error('Not enough balance: ' 
                + balanceRequired.toString()
                + '( '  + gas.toString()  + ' gas x ' + gasPrice.toString() + ' gasPrice'
                + ' ) > ' + balance.toString()));
        }

        const nonce = await this.fetchNonce(from);
        let result;
        try{
            rawTx.gasPrice = gasPrice.toHexString();
            rawTx.value = value.toHexString();
            rawTx.gas = gas.toHexString();
            rawTx.nonce = nonce;
            // console.log(JSON.stringify(rawTx, null, '  '));
            result = await this.sendTransaction(rawTx);
        }catch(e) {
            return end(e);
        }
        return end(null, result);
    } else if(payload.method == 'eth_sign') { 
        let signedMessage;
        try{
            signedMessage = await this.signMessage(payload.params[0], payload.params[1]);
        } catch(e) {
            return end(e);
        }
        return end(null, signedMessage);
    } else {
       next();
    }
}

BitskiSubProvider.prototype.signTransaction = async function(from, rawTx) {
    return this.bitskiProvider.send('eth_signTransaction', [rawTx]);
}

BitskiSubProvider.prototype.sendTransaction = async function(tx) {
    return this.bitskiProvider.send('eth_sendTransaction', [tx]);
}

BitskiSubProvider.prototype.signMessage = function(from, message) {
    throw new Error('rocketh TODO: sign Message not implemented in bitski provider');
}

module.exports = BitskiSubProvider;