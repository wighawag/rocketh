const {
    setupGlobals,
    runStages,
    waitForMocha,
    requireLocal,
    rocketh
} = require('./lib');

// const truffleContract = require('truffle-contract');

setupGlobals();

global.artifacts = {
    require : (name) => rocketh.contractInfo(name) // TODO support stages (deployed addresses ....) // TODO contractInfos need to be converted to truffle articact structure
}

const contractFunctions = [];
const only = [];
global.contract = (text, fn) => {
    contractFunctions.push({text,fn});
}
global.contract.only = (text, fn) => {
    only.push({text,fn});
} 
const Web3 = requireLocal('web3');
global.web3 = new Web3(global.ethereum);
global.Web3 = Web3; // not in truffle but why not


console.log('waiting for mocha...');
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
                console.log('rerunStages');
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

    // stagesTransform: (migrationArguments) => {
    //     const {accounts, registerArtifact} = migrationArguments[0];
    //     return [
    //         { 
    //             deploy : async (ContractInfo, ...args) => { 
    //                 // console.log('ContractInfo', ContractInfo);
    //                 console.log(ContractInfo.name, ContractInfo.contractName);
    //                 console.log('args for Contract : ', args);
    //                 const Contract = truffleContract({
    //                     abi: JSON.parse(ContractInfo.interface),
    //                     unlinked_binary: ContractInfo.bytecode
    //                 })
    //                 Contract.setProvider(global.ethereum);
    //                 return Contract.new(args, {from: accounts[0], gas: 6000000});
    //             } 
    //         },
    //         11, // TODO 
    //         accounts
    //     ]
    // }
