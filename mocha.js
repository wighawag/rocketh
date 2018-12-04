const {
    setupGlobals,
    runStages,
    waitForMocha,
} = require('./lib');


setupGlobals();

const contractFunctions = [];
const only = [];
global.contract = (text, fn) => {
    contractFunctions.push({text,fn});
}
global.contract.only = (text, fn) => {
    only.push({text,fn});
} 

waitForMocha(
(result) =>{
    const accounts = result.accounts;
    let contractFuncs = contractFunctions;
    if(only.length > 0){
        contractFuncs = only;
    }
    for (const contractFunction of contractFuncs) {
        global.describe(contractFunction.text, () => {
            global.before(() => {
                let pastTimeout;
                if(global.timeout) {
                    pastTimeout = global.timeout()
                }
                return runStages()
                    .then(() => {
                        if(pastTimeout) {
                            global.timeout(pastTimeout);
                        }
                    })
            });
            return contractFunction.fn(accounts);
        })
    }
});
