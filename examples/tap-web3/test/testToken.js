const rocketh = require('rocketh');
const Web3 = require('web3');
const BN = require('bn.js');
const t = require('tap');
const chai = require('chai');
const expect = chai.expect;
const bnChai = require('bn-chai');
chai.use(bnChai(BN));

// console.log('running testToken.js');


function deployedWeb3Contract(name) {
    const deployment = rocketh.deployment(name);
    return new web3.eth.Contract(deployment.contractInfo.abi, deployment.address);
}

const web3 = new Web3(rocketh.ethereum);
const accounts = rocketh.accounts;
const TokenContractInfo = rocketh.contractInfo('Token'); 
const owner = Web3.utils.toChecksumAddress(accounts[0]);
const user1 = Web3.utils.toChecksumAddress(accounts[1]);
const gas = 4000000;

// console.log(accounts);


main();
async function main() {
    
    t.test('deploy token', async () => {
        const totalSupply = '133474747474';
        const TokenContract = new web3.eth.Contract(TokenContractInfo.abi);
        const deploy =  TokenContract.deploy({data: '0x' + TokenContractInfo.evm.bytecode.object, arguments: [totalSupply]});
        const tokenContract = await deploy.send({from:owner, gas});
        // console.log('tokenContract deployed at ', tokenContract.options.address);
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect(ownerBalance).to.eq.BN(totalSupply)
    });

    t.test('transfer from owner to user preseve total supply', async () => {
        const tokenContract = deployedWeb3Contract('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner, gas});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    t.test('transfer 100 again add up to 200', async () => {
        const tokenContract = deployedWeb3Contract('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner, gas});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });

    t.test('Token2: transfer 100 add up to 100', async () => {
        const tokenContract = deployedWeb3Contract('Token2');
        await tokenContract.methods.transfer(user1, 100).send({from: owner, gas});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('100');
    });

    
    t.test('transfer from owner to user preseve total supply', async () => {
        await rocketh.runStages();
        const tokenContract = deployedWeb3Contract('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner, gas});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    t.test('transfer 100 again add up to 200', async () => {
        const tokenContract = deployedWeb3Contract('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner, gas});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });

}
