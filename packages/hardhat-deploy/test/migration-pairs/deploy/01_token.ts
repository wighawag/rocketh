// deploy/01_token.ts (rocketh)
import {parseEther} from 'viem';
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, tokenOwner} = namedAccounts;

		await deploy('Token', {
			account: deployer, // was `from`
			artifact: artifacts.Token, // was implied by the name 'Token'
			args: [tokenOwner, parseEther('1000000'), 'My Token', 'MTK'],
		});
	},
	{tags: ['Token']},
);
