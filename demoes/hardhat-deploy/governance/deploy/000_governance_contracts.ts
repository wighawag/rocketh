import {deployScript, artifacts} from '../rocketh/deploy.js';

/**
 * The governance contracts every other scenario builds on.
 *
 * Both are deployed BY THE DEPLOYER and are therefore ordinary, signable deploys:
 * nothing defers here. This script exists so the later scenarios have a multisig
 * address and a timelock address to hand to `owner`.
 */
export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, governanceOperator} = namedAccounts;

		// A stand-in for a Safe. Any owner can execute alone (see the contract's
		//  NatSpec): the demo needs an address that CAN be made to send a
		//  transaction, not a faithful Safe.
		const multisig = await deploy(
			'Multisig',
			{
				account: deployer,
				artifact: artifacts.SimpleMultisig,
				args: [[deployer, governanceOperator]],
			},
			{linkedData: {owners: [deployer, governanceOperator]}},
		);

		// OpenZeppelin's TimelockController, with the multisig as the only proposer
		//  and executor, and no admin (so the role set is frozen). This is the
		//  Safe -> Timelock -> ProxyAdmin path from scenario 004.
		//
		//  The delay is 60 seconds rather than a realistic 2 days so the demo's
		//  "wait, then execute" step is watchable. Nothing in rocketh reads it.
		const MIN_DELAY = 60n;
		await deploy(
			'Timelock',
			{
				account: deployer,
				artifact: artifacts.GovernanceTimelock,
				args: [
					MIN_DELAY,
					[multisig.address], // proposers
					[multisig.address], // executors
					'0x0000000000000000000000000000000000000000', // no admin
				],
			},
			{
				linkedData: {
					minDelay: MIN_DELAY.toString(),
					controller: multisig.address,
				},
			},
		);
	},
	{tags: ['governance']},
);
