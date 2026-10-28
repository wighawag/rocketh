// deploy/03_game.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// the facets the diamond should END UP with: a selector on chain that none of them produces is removed
		await diamond(
			'Game',
			{account: deployer},
			{
				facets: [{artifact: artifacts.CounterFacet}, {artifact: artifacts.AdminFacet}],
				owner: admin, // sends every later cut
				execute: {init: {type: 'facet', functionName: 'initialize', args: [admin]}}, // on creation only
			},
		);
	},
	{tags: ['Game']},
);
