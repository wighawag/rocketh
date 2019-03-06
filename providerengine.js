
const ProviderEngine = function(fallbackProvider, providers) {
    this.lastId = 0;
    this.fallbackProvider = fallbackProvider;
    this.providers = providers;
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
                if(self.fallbackProvider.isEIP1193) {
                    self.fallbackProvider.send(payload.method, payload.params)
                    .then((result) => {
                        callback(null, result);
                    })
                    .catch((err) => {
                        callback(err);
                    });
                } else if(self.fallbackProvider.sendAsync) {
                    self.fallbackProvider.sendAsync(payload, end);
                } else {
                    // console.log('send payload');
                    self.fallbackProvider.send(payload, (error, json) => {
                        if(error) {
                            // console.log('error from fallback', error);
                            end(error, json.result);
                        } else {
                            end(json.error, json.result);
                        }
                    });
                }
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
    throw new Error('Subscriptions are not supported yet');
}

ProviderEngine.prototype.unsubscribe = function() {
    throw new Error('Subscriptions are not supported yet');
}

ProviderEngine.prototype.disconnect = function() {
    return true;
}

module.exports = ProviderEngine;
