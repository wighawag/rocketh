// Internal: shared by the package root and `hardhat-deploy/extensions`. Not exported from either,
//  because the extensions subpath may export nothing but curried `(env) => …` functions.
import type {Environment} from 'rocketh/types';
import type {NetworkConnection} from 'hardhat/types/network';

export function connectionOrUndefined(env: Environment): NetworkConnection | undefined {
	return env.extra?.connection as NetworkConnection | undefined;
}

export function connectionOrThrow(env: Environment): NetworkConnection {
	const connection = connectionOrUndefined(env);
	if (!connection) {
		throw new Error(
			'Hardhat deploy connection not found in the environment. It is there when the environment comes from ' +
				'Hardhat: the `deploy` task, `loadEnvironmentFromHardhat`, or a test fixture that passes ' +
				'`extra: {connection}`. For a script that also runs without Hardhat, read `env.hardhatConnection` ' +
				'(from `hardhat-deploy/extensions`), which is `undefined` there.',
		);
	}
	return connection;
}
