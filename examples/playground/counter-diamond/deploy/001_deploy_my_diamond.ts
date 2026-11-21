import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await diamond(
			'MyDiamond',
			{account: deployer},
			{
				facets: [{artifact: artifacts.CounterFacet}, {artifact: artifacts.AdminFacet}],
				owner: admin,
			},
		);
	},
	{tags: ['MyDiamond', 'MyDiamond_deploy']},
);
