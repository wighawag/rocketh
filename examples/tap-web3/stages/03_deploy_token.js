const {deployWeb3ContractIfNew} = require('../utils');

module.exports = async ({accounts}) => {
    await deployWeb3ContractIfNew('Token', 'Token', {from:accounts[0], gas:4000000}, '1000000000000000000000000');
};
