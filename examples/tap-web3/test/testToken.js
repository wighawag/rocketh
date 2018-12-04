const rocketh = require('rocketh');
const Web3 = require('web3');
const BN = require('bn.js');
const t = require('tap');
const chai = require('chai');
const expect = chai.expect;
const bnChai = require('bn-chai');
chai.use(bnChai(BN));

const web3 = new Web3(rocketh.ethereum);

let 
accounts,
user1, 
owner, 
TokenContractInfo;
rocketh.launch().then(setup).then(main);
async function setup() {    
    TokenContractInfo = rocketh.contractInfo('Token'); 
    accounts = await web3.eth.getAccounts();
    owner = Web3.utils.toChecksumAddress(accounts[0]);
    user1 = Web3.utils.toChecksumAddress(accounts[1]);
}
async function main() {
    
    t.test('deploy token', async () => {
        const totalSupply = '133474747474';
        const TokenContract = new web3.eth.Contract(TokenContractInfo.abi);
        const tokenContract = await TokenContract.deploy({data:TokenContractInfo.evm.bytecode.object, arguments: [totalSupply]}).send({from:owner, gas:4000000});
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect(ownerBalance).to.eq.BN(totalSupply)
    });

    t.test('transfer from owner to user preseve total supply', async () => {
        const tokenContract = rocketh.artifact('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    t.test('transfer 100 again add up to 200', async () => {
        const tokenContract = rocketh.artifact('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });

    t.test('Token2: transfer 100 add up to 100', async () => {
        const tokenContract = rocketh.artifact('Token2');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('100');
    });

    
    t.test('transfer from owner to user preseve total supply', async () => {
        await rocketh.runStages();
        const tokenContract = rocketh.artifact('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    t.test('transfer 100 again add up to 200', async () => {
        const tokenContract = rocketh.artifact('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });

}
