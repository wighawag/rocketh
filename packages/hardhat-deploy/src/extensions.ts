/**
 * hardhat-deploy as a rocketh EXTENSION: spread this subpath into `extensions` in
 * `rocketh/config.ts` and every deploy script gets `env.hardhatConnection`.
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
 * Every import here is `import type`, so loading this module never loads Hardhat: a
 * `rocketh/config.ts` that spreads it still works under the `rocketh` command and in a
 * browser, where there is no Hardhat runtime to load.
 */
import type {Environment} from 'rocketh/types';
import type {NetworkConnection} from 'hardhat/types/network';

/**
 * The Hardhat network connection of the run, or `undefined` when there is none.
 *
 * A GETTER: as an extension it becomes the property `env.hardhatConnection`, not a method.
 * `withEnvironment` calls it once with the environment of every script, in every run, so it
 * must never throw. Hardhat runs have a connection (the `deploy` task,
 * `loadEnvironmentFromHardhat`, and a test fixture that passes `extra: {connection}`); the
 * `rocketh` command, a browser and a fixture that passes only a provider do not, and a script
 * that can run in both tells them apart by checking for `undefined`.
 *
 * To REQUIRE Hardhat instead (a script that is meaningless without it), call
 * `getHardhatConnection(env)` from `hardhat-deploy`, which throws.
 */
export function hardhatConnection(env: Environment): NetworkConnection | undefined {
	return env.extra?.connection as NetworkConnection | undefined;
}
