// test/fixtures.ts (rocketh, under hardhat 3)
import type {EIP1193ProviderWithoutEvents} from 'rocketh/types';
import {artifacts} from '../rocketh/deploy.js';
import {loadAndExecuteDeploymentsFromFiles} from '../rocketh/environment.js';

export function setupFixtures(provider: EIP1193ProviderWithoutEvents) {
	return {
		// v1's `deployments.fixture(['Token'])`: run the scripts tagged `Token` and their dependencies
		async deployToken() {
			const env = await loadAndExecuteDeploymentsFromFiles({provider, tags: ['Token']});
			return {env, Token: env.get<typeof artifacts.Token.abi>('Token')};
		},
	};
}

// test/Token.test.ts: hardhat 3's `loadFixture` does the snapshot-and-revert v1's `fixture` did.
//
//   const {provider, networkHelpers} = await network.connect();
//   const {deployToken} = setupFixtures(provider);
//
//   it('mints the whole supply to the token owner', async () => {
//     const {env, Token} = await networkHelpers.loadFixture(deployToken);
//     const balance = await env.read(Token, {functionName: 'balanceOf', args: [env.namedAccounts.tokenOwner]});
//     expect(balance).toEqual(parseEther('1000000'));
//   });
