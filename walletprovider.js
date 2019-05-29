const ethers = require('ethers');
const BN = require('bn.js');

const WalletSubProvider = function(privateKeys) {
    this.lastId = 0;
   
    if(privateKeys){
        this.accounts = [];
        this.wallets = {};    
        for(let i = 0; i < privateKeys.length; i++) {
            const wallet = new ethers.Wallet(privateKeys[i]);
            this.wallets[wallet.address.toLowerCase()] = wallet;
            this.accounts.push(wallet.address);
        }
    }
}

WalletSubProvider.prototype.setEngine = function(engine) {
    this.engine = engine;
}

WalletSubProvider.prototype.fetchGasPrice = function() {
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

WalletSubProvider.prototype.fetchNonce = function(from) {
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

WalletSubProvider.prototype.fetchBalance = function(from) {
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

WalletSubProvider.prototype.handleRequest = async function(payload, next, end) {
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
        
        return this.engine.sendAsync({
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            method: 'eth_sendRawTransaction',
            params: [signedTx],
            jsonrpc: '2.0',
          }, function(error, json) {
                if(error) {
                    return end(error);
                }
                return end(null, json.result);
          });

    } else if(payload.method == 'eth_sign') {
        const signedMessage = await this.signMessage(payload.params[0], payload.params[1]);
        // console.log(payload.params, signedMessage);
        return end(null, signedMessage);
    } else {
       next();
    }
}

WalletSubProvider.prototype.signTransaction = function(from, rawTx) {
    // console.log('rawTx', rawTx);
    const wallet = this.wallets[from.toLowerCase()];
    return wallet.sign(rawTx);
}

WalletSubProvider.prototype.signMessage = function(from, message) {
    if(message[0] == '0' && message[1] == 'x') { // work arround : if start with 0x interpret it as binary data
        message = ethers.utils.arrayify(message);
    }
    const wallet = this.wallets[from.toLowerCase()];
    return wallet.signMessage(message);
}

module.exports = WalletSubProvider;