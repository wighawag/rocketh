const {
    setupGlobals,
    runMigrations,
    waitForMocha,
    requireLocal,
    rocketh
} = require('./lib');

setupGlobals(true);

global.artifacts = {
    require : (name) => rocketh.contractInfo(name) // TODO support migrations (deployed addresses ....) // TODO contractInfos need to be converted to truffle articact structure
}

const contractFunctions = [];
global.contract = (text, fn) => {
    contractFunctions.push({text,fn});
}
const Web3 = requireLocal('web3');
global.web3 = new Web3(global.ethereum);
global.Web3 = Web3; // not in truffle but why not

waitForMocha((accounts) =>{
    for (const contractFunction of contractFunctions) {
        global.describe(contractFunction.text, () => {
            global.before(runMigrations);
            return contractFunction.fn(accounts);
        })
    }
});

