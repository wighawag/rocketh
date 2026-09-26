// deploy/03_registry.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

const SALT = '0x0000000000000000000000000000000000000000000000000000000000000001';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy(
			'Registry',
			{account: deployer, artifact: artifacts.Registry},
			// `deterministicDeployment` is now `deterministic`, in the options: `true`, a salt,
			// or `{type: 'create2' | 'create3', salt}`
			{deterministic: SALT},
		);
	},
	{tags: ['Registry']},
);
