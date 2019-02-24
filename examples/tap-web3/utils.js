const Web3 = require('web3');
const web3 = new Web3(ethereum);
const rocketh = require('rocketh');

const deployWeb3ContractIfNew = async (name, contractName, options, ...args) => {
    const ContractInfo = rocketh.contractInfo(contractName);
    let contract;
    await rocketh.unlessAlreadyDeployed(name, ContractInfo.evm.bytecode.object, args, async (registerDeployment) => {
        const Contract = new web3.eth.Contract(ContractInfo.abi);
        contract = await Contract.deploy({data:'0x' + ContractInfo.evm.bytecode.object, arguments: args}).send(options);
        console.log('contract ' + contractName + ' deployed at ' + contract.options.address);
        registerDeployment(name, { 
            contractInfo: ContractInfo, 
            args, 
            address: contract.options.address
        });
    });
    return contract;
};

module.exports = {
    deployWeb3ContractIfNew
}
