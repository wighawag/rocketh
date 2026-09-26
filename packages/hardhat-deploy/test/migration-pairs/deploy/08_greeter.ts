// deploy/08_greeter.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, get, read, execute, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Greeter', {account: deployer, artifact: artifacts.Greeter, args: ['hi']});

		// `read` and `execute` take the DEPLOYMENT; `get` it by name, typed by its ABI.
		// (`readByName` / `executeByName` take the name directly, untyped.)
		const greeter = get<typeof artifacts.Greeter.abi>('Greeter');

		const greeting = await read(greeter, {functionName: 'greet'});
		if (greeting !== 'hello') {
			await execute(greeter, {account: deployer, functionName: 'setGreeting', args: ['hello']});
		}
	},
	{tags: ['Greeter']},
);
