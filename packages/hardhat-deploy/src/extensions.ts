/**
 * hardhat-deploy as a rocketh EXTENSION: spread this subpath into `extensions` in
 * `rocketh/config.ts` and every deploy script gets `env.hardhatConnection` and
 * `env.getHardhatConnection()`.
 *
 * ```typescript
 * import * as hardhatExtension from 'hardhat-deploy/extensions';
 * const extensions = {...deployExtension, ...hardhatExtension};
 * ```
 *
 * It is a SUBPATH because the package root cannot be spread: its default export is the
 * Hardhat plugin object, and `withEnvironment` calls every entry it is given as
 * `value(env)`. For the same reason this module may export NOTHING but curried
 * `(env) => …` functions (see `AGENTS.md`).
 *
 * `withEnvironment` calls every entry once, with the environment of every script, in every
 * run, before the script body: so no entry here may throw at that point. Hardhat runs have a
 * connection (the `deploy` task, `loadEnvironmentFromHardhat`, and a test fixture that passes
 * `extra: {connection}`); the `rocketh` command, a browser and a fixture that passes only a
 * provider do not.
 *
 * This module only loads Hardhat's TYPES (its one value import is the internal helper next to
 * it, which imports only types too), so a `rocketh/config.ts` that spreads it still loads
 * under the `rocketh` command and in a browser.
 */
import type {Environment} from 'rocketh/types';
import type {NetworkConnection} from 'hardhat/types/network';
import {connectionOrThrow, connectionOrUndefined} from './connection.js';

/**
 * A GETTER, so it becomes the property `env.hardhatConnection`: the connection of the run, or
 * `undefined` when there is none. For a script that runs with and without Hardhat.
 */
export function hardhatConnection(env: Environment): NetworkConnection | undefined {
	return connectionOrUndefined(env);
}

/**
 * A METHOD, `env.getHardhatConnection()`: the connection of the run, THROWING when there is
 * none. For a script that requires Hardhat. Curried, so the check happens when the script
 * calls it, never while the environment is set up, and the other scripts keep running.
 */
export function getHardhatConnection(env: Environment): () => NetworkConnection {
	return () => connectionOrThrow(env);
}
