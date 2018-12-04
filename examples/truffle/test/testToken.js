const rocketh = require('rocketh');
const BN = require('bn.js');
const chai = require('chai');
const expect = chai.expect;
const bnChai = require('bn-chai');
chai.use(bnChai(BN));

contract('Token', (accounts) => {
    const TokenContractInfo = rocketh.contractInfo('Token');
    const owner = Web3.utils.toChecksumAddress(accounts[0]);
    const user1 = Web3.utils.toChecksumAddress(accounts[1]);

    it('deploy Token', async () => {
        const totalSupply = '133474747474';
        const TokenContract = new web3.eth.Contract(TokenContractInfo.abi);
        const tokenContract = await TokenContract.deploy({data:TokenContractInfo.evm.bytecode.object, arguments: [totalSupply]}).send({from:owner, gas:4000000});
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect(ownerBalance).to.eq.BN(totalSupply)
    });

    it('transfer from owner to user preseve total supply', async () => {
        const tokenContract = rocketh.artifact('Token'); // access migration via string between <number>_ and .js // TODO finalize decision
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    it('transfer 100 again add up to 200', async () => {
        const tokenContract = rocketh.artifact('Token'); // access migration via string between <number>_ and .js // TODO finalize decision
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });
});

contract('Token 2', (accounts) => {
    const owner = Web3.utils.toChecksumAddress(accounts[0]);
    const user1 = Web3.utils.toChecksumAddress(accounts[1]);
    
    it('2 transfer from owner to user preseve total supply', async () => {
        const tokenContract = rocketh.artifact('Token'); // access migration via string between <number>_ and .js // TODO finalize decision
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    it('2 transfer 100 again add up to 200', async () => {
        const tokenContract = rocketh.artifact('Token'); // access migration via string between <number>_ and .js // TODO finalize decision
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });
});
