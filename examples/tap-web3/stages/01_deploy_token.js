const {deployWeb3ContractIfNew} = require('../utils');

const Web3 = require('web3');

module.exports = async ({accounts}) => {
  console.log(accounts);
  await deployWeb3ContractIfNew('Token', 'Token', {from:accounts[0], gas:6000000}, '1000000000000000000000000');
};