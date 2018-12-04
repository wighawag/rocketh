const rocketh = require('rocketh');
const Web3 = require('web3');
const BN = require('bn.js');
const chai = require('chai');
const expect = chai.expect;
const bnChai = require('bn-chai');
chai.use(bnChai(BN));


// at that point, rocketh is partially initialised thanks to mocha --delay -r rocketh/mocha
// unfortunately mocha does not provide a way to trigger before the file is executed and just after mocha initialise fully
// as such Contract compilation and stages are not perform directly
// you can only access rocketh.contractInfo(<contractName>) and rocketh.artifact(<artifact name>) in mocha hooks or "it" functions
const web3 = new Web3(ethereum);

// if you need to use --delay for something else you can but you ll have to setup rocketh manually and call run yourself (TODO : documentation to be written...)

let 
accounts,
user1, 
owner, 
TokenContractInfo;

before(async () => {
    TokenContractInfo = rocketh.contractInfo('Token'); 
    accounts = await web3.eth.getAccounts();
    owner = Web3.utils.toChecksumAddress(accounts[0]);
    user1 = Web3.utils.toChecksumAddress(accounts[1]);
});

describe('Token', () => {
    it('deploy Token', async () => {
        const totalSupply = '133474747474';
        const TokenContract = new web3.eth.Contract(TokenContractInfo.abi);
        const tokenContract = await TokenContract.deploy({data:TokenContractInfo.evm.bytecode.object, arguments: [totalSupply]}).send({from:owner, gas:4000000});
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect(ownerBalance).to.eq.BN(totalSupply)
    });

    it('transfer from owner to user preseve total supply', async () => {
        const tokenContract = rocketh.artifact('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
        expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
    });

    it('transfer 100 again add up to 200', async () => {
        const tokenContract = rocketh.artifact('Token');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('200');
    });

    it('Token2: transfer 100 add up to 100', async () => {
        const tokenContract = rocketh.artifact('Token2');
        await tokenContract.methods.transfer(user1, 100).send({from: owner});
        const user1Balance = await tokenContract.methods.balanceOf(user1).call();
        expect(user1Balance).to.eq.BN('100');
    });

    describe('rerun Migration', () => {
        before(rocketh.runStages);
        
        it('2 transfer from owner to user preseve total supply', async () => {
            const tokenContract = rocketh.artifact('Token');
            await tokenContract.methods.transfer(user1, 100).send({from: owner});
            const user1Balance = await tokenContract.methods.balanceOf(user1).call();
            const ownerBalance = await tokenContract.methods.balanceOf(owner).call();
            expect((new BN(ownerBalance)).add(new BN(user1Balance))).to.eq.BN('1000000000000000000000000');
        });
    
        it('2 transfer 100 again add up to 200', async () => {
            const tokenContract = rocketh.artifact('Token');
            await tokenContract.methods.transfer(user1, 100).send({from: owner});
            const user1Balance = await tokenContract.methods.balanceOf(user1).call();
            expect(user1Balance).to.eq.BN('200');
        });
    })

});
