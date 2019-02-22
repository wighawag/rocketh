const Web3 = require('web3');
const web3 = new Web3(ethereum);

module.exports = async ({rocketh, accounts, registerArtifact}) => {
  const TokenContractInfo = rocketh.contractInfo('Token');
  const TokenContract = new web3.eth.Contract(TokenContractInfo.abi);
  const arguments = ['1000000000000000000000000'];
  const tokenContract = await TokenContract.deploy({data:TokenContractInfo.evm.bytecode.object, arguments}).send({from:accounts[0], gas:4000000});
  registerArtifact('Token', tokenContract, { 
    contractInfo: TokenContractInfo, 
    arguments, 
    address: tokenContract.options.address
  });
};
