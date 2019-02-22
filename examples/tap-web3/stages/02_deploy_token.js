const {deployWeb3ContractIfNew} = require('../utils');

module.exports = async ({accounts}) => {
    await deployWeb3ContractIfNew('Token2', 'Token', {from:accounts[0], gas:4000000}, '500000000000000000000000');
};

