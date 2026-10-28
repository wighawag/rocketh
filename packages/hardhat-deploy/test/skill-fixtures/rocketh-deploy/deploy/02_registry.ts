// deploy/02_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, execute, namedAccounts}) => {
		const {deployer} = namedAccounts;

		const registry = await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [deployer]});

		// `execute` sends on every run unless a guard says what on chain shows it is done
		await execute(registry, {
			account: deployer,
			functionName: 'setValue',
			args: [42n],
			guard: {kind: 'call', functionName: 'value', equals: 42n},
		});
	},
	{tags: ['Registry']},
);
