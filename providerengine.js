const ethers = require('ethers');

const ProviderEngine = function(fallbackURL, providers) {
    this.lastId = 0;
    if(fallbackURL) {
        this.fallbackProvider = new ethers.providers.JsonRpcProvider(fallbackURL);
    }
    this.providers = providers || [];
    for(let i = 0; i < providers.length; i++) {
        providers[i].setEngine(this);
    }
}

ProviderEngine.prototype.send = function(payload, callback) {
    this.sendPayload(payload, callback);
}

ProviderEngine.prototype.sendAsync = function(payload, callback) {
    this.sendPayload(payload, callback);
}

ProviderEngine.prototype.sendPayload = async function(payload, callback) {
    self = this;
    let currentProvider = -1;
    let result = null;
    let error = null;
    let stack = []

    next();

    function next(after) {
        currentProvider++;
        stack.unshift(after);
        if (currentProvider >= self.providers.length) {
            if(self.fallbackProvider) {
                // console.log('calling ', payload.method, payload.params);
                self.fallbackProvider.send(payload.method, payload.params)
                .then((result) => {
                    // console.log('result ', result);
                    callback(null, {id: payload.id, result: result, jsonrpc: payload.jsonrpc});
                })
                .catch((err) => {
                    // console.log('err ', err);
                    callback({id: payload.id, error: err, jsonrpc: payload.jsonrpc});
                });
            } else {
                end(new Error('Request for method "' + payload.method + '" not handled by any subprovider. Please check your subprovider configuration to ensure this method is handled.'))
            }
        } else {
            try {
                let provider = self.providers[currentProvider]
                provider.handleRequest(payload, next, end);
            } catch (e) {
                end(e);
            }
        }
    }

    function end(_error, _result) {
        result = _result;
        error = _error;

        let current = -1;

        nextAfter();

        function nextAfter() {
            current++;
            if(current >= stack.length) {
                done();
            } else {
                if (stack[current]) {
                    stack[current](error, result, nextAfter)
                } else {
                    nextAfter();
                }
            }
        }
    }

    function done() {
        var resultObj = {
            id: payload.id,
            jsonrpc: payload.jsonrpc,
            result: result
        }
    
        if (error != null) {
            resultObj.error = {
                message: error.stack || error.message || error,
                code: -32000 // TODO different code
            }
            // console.log('error', error, resultObj, payload);
            // respond with both error formats
            callback(error, resultObj)
        } else {
            // console.log('result', resultObj, payload);
            callback(null, resultObj)
        }
    }
}

ProviderEngine.prototype.subscribe = function() {
    console.error('Subscriptions are not supported yet');
    throw new Error('Subscriptions are not supported yet');
}

ProviderEngine.prototype.unsubscribe = function() {
    console.error('Subscriptions are not supported yet');
    throw new Error('Subscriptions are not supported yet');
}

ProviderEngine.prototype.disconnect = function() {
    return true;
}

module.exports = ProviderEngine;
