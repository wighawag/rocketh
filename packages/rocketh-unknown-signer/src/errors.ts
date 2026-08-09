/**
 * Convenience re-export of the error `catchUnknownSigner` catches, so a consumer of
 * this package does not have to add `@rocketh/core` to its own dependencies just to
 * write an `instanceof` check.
 *
 * DECISION — why a `./errors` subpath rather than the package root. Every runtime
 * export of a rocketh extension package is spread into `extensions` and then fed to
 * `withEnvironment` (`@rocketh/core/environment`), which calls EVERY exported value
 * as `value(env)`. A class re-exported from the root would therefore be invoked
 * without `new` the moment a user wrote `{...deployExtension, ...unknownSignerExtension}`,
 * failing with `TypeError: Class constructor UnknownSignerError cannot be invoked
 * without 'new'`. Keeping the root surface function-only preserves the extension
 * idiom; the subpath keeps the re-export the task asked for. Alternatives considered:
 * re-export from the root (breaks the spread), or no re-export at all (forces every
 * consumer to depend on `@rocketh/core`). Subpath exports are already the house
 * pattern (`rocketh/types`, `@rocketh/core/types`, `@rocketh/core/environment`).
 */

export {UnknownSignerError} from '@rocketh/core';
export type {UnknownSignerErrorData, UnknownSignerContractCall} from '@rocketh/core';
