// deploy/02_calculator.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		const mathLib = await deploy('MathLib', {account: deployer, artifact: artifacts.MathLib});

		await deploy(
			'Calculator',
			{account: deployer, artifact: artifacts.Calculator, args: [10n]},
			// `libraries` moved out of the first object into the options, the third argument
			{libraries: {MathLib: mathLib.address}},
		);
	},
	{tags: ['Calculator']},
);
