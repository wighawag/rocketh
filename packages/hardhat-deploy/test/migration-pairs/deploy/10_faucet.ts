// deploy/10_faucet.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, get, namedAccounts}) => {
		const {faucetOwner} = namedAccounts;
		// no faucet where `faucetOwner` is null (mainnet, see the named accounts)
		if (!faucetOwner) {
			return; // what v1's `func.skip` returning true did: rocketh has no `skip` hook
		}

		await deploy('Faucet', {account: faucetOwner, artifact: artifacts.Faucet, args: [get('Token').address]});
	},
	{tags: ['Faucet'], dependencies: ['Token']},
);
