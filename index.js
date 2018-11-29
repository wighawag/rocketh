const Web3 = require('web3'); // TODO use lightweight http provider
const {
    setupGlobals,
    setup,
    runStages,
    rocketh
} = require('./lib');

if(require.main === module) {
    setupGlobals({
        provider: new Web3.providers.HttpProvider('http://localhost:8545') // TODO pass node uri in arguments
    });
    setup(true);
} else {
    if (!global.ethereum) { // not setup yet
        rocketh.launch = (nodeUrl) => {
            setupGlobals({
                provider: new Web3.providers.HttpProvider(nodeUrl)
            })
            return setup(false);
        }
    }
}

module.exports = rocketh;
