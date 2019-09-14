const ethers = require('ethers');
const BN = require('bn.js');
const Bitski = require("bitski-node");

const BitskiSubProvider = function(clientID, credentialID, secret, accounts, chainId) {
    let network = 'mainnet';
    if(chainId == 4) {
        network = 'rinkeby';
    } else if (chainId == 42) {
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
    };
      
    // Pass options with the provider
    this.bitskiProvider = Bitski.getProvider(clientID, options);
    this.bitskiProvider._blockTracker.stop();
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

        const gasPrice = ethers.utils.hexlify(rawTx.gasPrice || await this.fetchGasPrice());
        const gas = ethers.utils.hexlify(rawTx.gas);
        const balance = ethers.utils.hexlify(await this.fetchBalance(from));

        const balanceBN = new BN(balance.slice(2), 'hex');
        
        const gasPriceBN = new BN(gasPrice.slice(2), 'hex');
        const gasBN = new BN(gas.slice(2), 'hex');

        const balanceRequiredBN = gasPriceBN.mul(gasBN);
        
        if(balanceBN.lt(balanceRequiredBN)) {
            return end(new Error('Not enough balance: ' 
                + balanceRequiredBN.toString(10)
                + '( '  + gasBN.toString(10)  + ' gas x ' + gasPriceBN.toString(10) + ' gasPrice'
                + ' ) > ' + balanceBN.toString(10)));
        }

        const nonce = await this.fetchNonce(from);
        let result;
        try{
            rawTx.gasPrice = gasPrice;
            rawTx.nonce = nonce;
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

BitskiSubProvider.prototype.signTransaction = function(from, rawTx) {
    self = this;
    return new Promise((resolve, reject) => {
        self.bitskiProvider.send({
            id: ++self.lastId,
            method: 'eth_signTransaction',
            params: [rawTx],
            jsonrpc: '2.0',
        }, function(error, json) {
            if(error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        })
    })
}

BitskiSubProvider.prototype.sendTransaction = function(tx) {
    self = this;
    return new Promise((resolve, reject) => {
        self.bitskiProvider.send({
            id: ++self.lastId,
            method: 'eth_sendTransaction',
            params: [tx],
            jsonrpc: '2.0',
        }, function(error, json) {
            if(error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        })
    })
}

BitskiSubProvider.prototype.signMessage = function(from, message) {
    throw new Error('rocketh TODO: sign Message not implemented in bitski provider');
}

module.exports = BitskiSubProvider;