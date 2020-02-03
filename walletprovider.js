const ethers = require('ethers');
// const {Logger} = require('@ethersproject/logger');
// Logger.globalLogger().setLogLevel('error');
const {BigNumber} = ethers;

const WalletSubProvider = function(privateKeys, config) {
    this.lastId = 0;
    this.config = config;
   
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

WalletSubProvider.prototype.estimateGas = function(data) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.engine.sendAsync({ id: ++self.lastId, method: 'eth_estimateGas', params: [data], jsonrpc: '2.0'}, (error, json) =>{
            if(error) {
                reject(error);
            } else {
                resolve(json.result);
            }
        });
    })
}



function ensureEvenLength(hexString, debug) {
    const l = hexString.length - 2;
    if(debug) {
        console.log(debug, {l})
    }
    if(l)
    if(l % 2 === 1) {
        return ethers.utils.hexZeroPad(hexString, (l+1) / 2);
    }
    return hexString;
}

WalletSubProvider.prototype.handleRequest = async function(payload, next, end) {
    const self = this;
    if (payload.method === 'eth_accounts' && this.accounts) {
        return end(null, this.accounts);
    } else if (payload.method === 'eth_sendTransaction') {
        const rawTx = payload.params[0];
        const from = rawTx.from;

        const wallet = this.wallets[from];
        if (!wallet) {
            return end(new Error('Account unknown ' +from));
        }

        // // TODO remove ?
        // if(!rawTx.gas) {
        //     return end(new Error('gas not specified'));
        // }

        let nonce = rawTx.nonce;
        if (typeof nonce === 'undefined') {
            nonce = await this.fetchNonce(from);
        } 
        const nonceBN = BigNumber.from(nonce);

        let value 
        if(typeof rawTx.value === 'undefined') {
            value = '0x00'; // TODO fix ethers
        } else {
            value = rawTx.value;
        }
        const valueBN = BigNumber.from(value);

        let gas;
        if(rawTx.gas) {
            gas = rawTx.gas;
        } else {
            gas = await this.estimateGas({
                from,
                to: rawTx.to,
                nonce: nonceBN.toHexString(),
                data: rawTx.data,
                value: valueBN.toHexString(),
                chainId: rawTx.chainId,
                gas: rawTx.estimateGasLimit,
            });
            if (rawTx.estimateGasExtra) {
                gas += rawTx.estimateGasExtra;
                if (rawTx.estimateGasLimit) {
                    gas = Math.min(gas, rawTx.estimateGasLimit);
                }
            }
            // return end(new Error('gas not specified'));
        }

        const gasPriceSpecified = !!rawTx.gasPrice;
        let gasPriceBN;
        if (!gasPriceSpecified) {
            if (this.config.fixedGasPrice) {
                gasPriceBN = BigNumber.from(this.config.fixedGasPrice);
            } else {
                const currentGasPrice = await this.fetchGasPrice();
                gasPriceBN = BigNumber.from(currentGasPrice);
            }
        } else {
            gasPriceBN = BigNumber.from(rawTx.gasPrice);
        }
        
        if (this.config.extraGasPrice) {
            let extraGasPriceBN;
            if (this.config.extraGasPrice.endsWith('%')) {
                extraGasPriceBN = gasPriceBN.mul(this.config.extraGasPrice.slice(0,this.config.extraGasPrice.length-1)).div(100);
            } else {
                extraGasPriceBN = BigNumber.from(this.config.extraGasPrice);
            }
            gasPriceBN = gasPriceBN.add(extraGasPriceBN);
        }
        
        const gasBN = BigNumber.from(gas);

        const balance = await this.fetchBalance(from);
        const balanceBN = BigNumber.from(balance);
        const balanceRequiredBN = gasPriceBN.mul(gasBN);
        
        if(balanceBN.lt(balanceRequiredBN)) {
            return end(new Error('Not enough balance: ' 
                + balanceRequiredBN.toString()
                + '( '  + gasBN.toString()  + ' gas x ' + gasPriceBN.toString() + ' gasPrice'
                + ' ) > ' + balanceBN.toString()));
        }

        const forEthers = {
            to: rawTx.to,
            gasLimit: gasBN.toHexString(),
            gasPrice: gasPriceBN.toHexString(),
            nonce: nonceBN.toHexString(),
            data: rawTx.data,// ? (rawTx.data[1].toLowerCase() == 'x' ? rawTx.data : '0x' + rawTx.data) : undefined,
            value: valueBN.toHexString(),
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
        const wallet = this.wallets[payload.params[0]];
        if (!wallet) {
            return end(new Error('Account unknown ' + payload.params[0]));
        }
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
    return wallet.signTransaction(rawTx);
}

WalletSubProvider.prototype.signMessage = function(from, message) {
    if(message[0] == '0' && message[1] == 'x') { // work arround : if start with 0x interpret it as binary data
        message = ethers.utils.arrayify(message);
    }
    const wallet = this.wallets[from.toLowerCase()];
    return wallet.signMessage(message);
}

module.exports = WalletSubProvider;