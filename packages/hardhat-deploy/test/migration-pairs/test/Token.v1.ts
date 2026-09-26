// test/Token.test.ts (hardhat-deploy v1, mocha + chai)
import {expect} from 'chai';
import {deployments, getNamedAccounts} from 'hardhat';
import {parseEther} from 'ethers/lib/utils';

describe('Token', function () {
	it('mints the whole supply to the token owner', async function () {
		// runs the scripts tagged `Token` (and their dependencies) once, then reverts to a snapshot
		await deployments.fixture(['Token']);
		const {tokenOwner} = await getNamedAccounts();

		const balance = await deployments.read('Token', 'balanceOf', tokenOwner);
		expect(balance).to.equal(parseEther('1000000'));
	});
});
