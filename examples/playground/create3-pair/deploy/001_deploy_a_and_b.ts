import {zeroAddress} from 'viem';
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, computeDeterministicAddress, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const deterministic = {type: 'create3', salt: '0xa1'} as const;

		// A's address, before A exists. A create3 address ignores A's constructor arguments.
		const {address: a} = await computeDeterministicAddress(artifacts.A, [zeroAddress], {
			account: deployer,
			deterministic,
		});

		const b = await deploy('B', {account: deployer, artifact: artifacts.B, args: [a]});
		await deploy('A', {account: deployer, artifact: artifacts.A, args: [b.address]}, {deterministic});
	},
	{tags: ['A', 'B']},
);
