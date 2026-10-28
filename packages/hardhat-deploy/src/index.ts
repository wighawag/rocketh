import 'named-logs-console';
import type {HardhatPlugin} from 'hardhat/types/plugins';
import {task} from 'hardhat/config';

import './type-extensions.js';
import {ArgumentType} from 'hardhat/types/arguments';
import type {Environment} from 'rocketh/types';
import type {NetworkConnection} from 'hardhat/types/network';

const hardhatPlugin: HardhatPlugin = {
	id: 'hardhat-deploy',
	hookHandlers: {
		config: () => import('./hook-handlers/config.js'),
		solidity: () => import('./hook-handlers/solidity.js'),
	},
	tasks: [
		task('deploy', 'Deploy contracts')
			// .addFlag('skipGasReport', 'if set, skip gas report')
			.addFlag({
				name: 'skipPrompts',
				description: 'if set, skip any prompts (this also forces --on-unknown-signer throw)',
			})
			.addOption({
				name: 'onUnknownSigner',
				description: "what to do when a transaction's `from` cannot be signed for: throw | ask | auto (default: auto)",
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.addFlag({name: 'reportGasUsed', description: 'if set, report gas used'})
			.addOption({
				name: 'saveDeployments',
				description: 'if set to false, do not save deployments',
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.addOption({
				name: 'tags',
				description: 'specify which tags to deploy, separated by commas',
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.addOption({
				name: 'pollingInterval',
				description: 'specify the polling interval used to check transactions',
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.addOption({
				name: 'defaultBuildProfile',
				description:
					'specify the default profile to use for compilation. Note that the global option "--build-profile" will override it',
				defaultValue: 'production',
				type: ArgumentType.STRING,
			})
			.addFlag({
				name: 'noCompile',
				description: 'if set, skip compilation',
			})
			.addFlag({
				name: 'reset',
				description: 'if set, delete deployments first',
			})
			// RUN-LEVEL fee defaults, in wei, for every transaction whose call states no fee option.
			//  Hardhat turns these names into `--gas-price`, `--max-fee-per-gas` and
			//  `--max-priority-fee-per-gas`, the same spellings as the `rocketh` CLI. hardhat-deploy v1's
			//  `--gasprice` / `--maxfee` / `--priorityfee` are NOT accepted: a hardhat task option has one
			//  name (plus an optional one-letter `shortName`), and no alias. Read as strings and parsed
			//  by `parseFeeOption` (`@rocketh/node`), because hardhat's BIGINT type has no
			//  "absent" value and accepts more spellings than the rocketh CLI does.
			.addOption({
				name: 'gasPrice',
				description:
					'legacy gas price in wei for every transaction whose call sets no fee option: they are sent as legacy (type 0) transactions',
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.addOption({
				name: 'maxFeePerGas',
				description:
					'EIP-1559 max fee per gas in wei for every transaction whose call sets no fee option (cannot be combined with --gas-price)',
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.addOption({
				name: 'maxPriorityFeePerGas',
				description:
					'EIP-1559 max priority fee per gas in wei for every transaction whose call sets no fee option (cannot be combined with --gas-price)',
				defaultValue: undefined,
				type: ArgumentType.STRING_WITHOUT_DEFAULT,
			})
			.setAction(() => import('./tasks/deploy.js'))
			.build(),
	],
	npmPackage: 'hardhat-deploy',
};

export default hardhatPlugin;

/**
 * The Hardhat network connection of the run, THROWING when there is none: for a script that
 * only makes sense under Hardhat. Call it with the environment, `getHardhatConnection(env)`.
 *
 * NOT an extension: do not spread it into `extensions`. `withEnvironment` calls every entry
 * with the environment of every script, so it would throw in every run that has no
 * connection (the `rocketh` command, a test fixture that passes only a provider). The
 * extension is `hardhatConnection` from `hardhat-deploy/extensions`, which returns
 * `undefined` instead.
 */
export function getHardhatConnection(env: Environment): NetworkConnection<'generic'> {
	const connection = env.extra?.connection;
	if (!connection) {
		throw new Error(
			'Hardhat deploy connection not found in the environment. It is there when the environment comes from ' +
				'Hardhat: the `deploy` task, `loadEnvironmentFromHardhat`, or a test fixture that passes ' +
				'`extra: {connection}`. For a script that also runs without Hardhat, spread ' +
				'`hardhat-deploy/extensions` into your extensions and read `env.hardhatConnection`, which is ' +
				'`undefined` there.',
		);
	}
	return connection as NetworkConnection<'generic'>;
}
