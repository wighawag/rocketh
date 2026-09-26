// deploy/07_diamond.ts (rocketh)
// The SAME script, edited to add a facet and re-run: that edit is a diamond cut, in both versions.
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await diamond(
			'Diamond',
			{account: deployer},
			{
				owner: deployer,
				facets: [{artifact: artifacts.ERC20Facet}, {artifact: artifacts.PausableFacet}],
				// runs with the deployment, and again with every later cut
				execute: {type: 'facet', functionName: 'initialize', args: ['Diamond Token', 'DMT']},
			},
		);
	},
	{tags: ['Diamond']},
);
