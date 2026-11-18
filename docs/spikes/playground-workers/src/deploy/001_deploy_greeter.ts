// An ordinary rocketh deploy script, as it would be in a project's deploy/ folder.
import {deployScript} from '../config.js';
import {artifacts} from '../artifacts.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;
		await deploy('Greeter', {
			account: deployer,
			artifact: artifacts.Greeter as never,
			args: ['hello from the tab'],
		});
	},
	{tags: ['Greeter']},
);
