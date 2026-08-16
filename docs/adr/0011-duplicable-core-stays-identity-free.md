# A duplicable `@rocketh/core` stays identity-free, and stateful code lives in the peers

`@rocketh/core` is a regular `dependency` of nearly every package, declared `workspace:*`, so it publishes as an exact version and a consumer combining packages of slightly different vintages can end up with several copies of it in one dependency tree. That is tolerated rather than prevented, and it is only safe because core holds no module-level mutable state and no seam in the environment or extension path tests module identity. Anything stateful lives in `rocketh` and `@rocketh/node`, which are `peerDependencies` and therefore resolve to a single copy.

## Why

The classic way a duplicated module breaks is an identity check: `instanceof` against a class, a `Symbol` brand, or a module-level `WeakSet` recording "already processed". Two copies disagree, and the failure is silent and bewildering. Every equivalent seam here is deliberately name-based or shape-based instead:

- `withEnvironment` (`packages/rocketh-core/src/environment.ts`) validates an extension entry with `typeof func !== 'function'` and detects a class by sniffing its source text with `Function.prototype.toString`, not with `instanceof`.
- `enhanceEnvIfNeeded` (same file) answers "has this environment already been enhanced with this extension?" with `Object.prototype.hasOwnProperty.call(env, key)`, a plain string key. A brand symbol here would break the moment a second copy of core loaded.
- `setupDeployScripts` (`packages/rocketh/src/executor/index.ts`) receives the environment as an argument and layers each script's extensions onto a fresh object (`Object.assign(Object.create(...), env, curried)`), so two deploy scripts built against different copies coexist instead of clobbering each other.
- `UnknownSignerError` is the one exported class that is `instanceof`-checked across a package boundary, and `isUnknownSignerError` in `@rocketh/unknown-signer` already falls back to a `name` plus shape check for exactly this reason.

The state topology matches the dependency classification, which is what makes this hold rather than luck. The only module-level mutable bindings in the whole monorepo are `chainById`, `chainByCanonicalName` and `chainTypes` (`packages/rocketh-node/src/environment/chains.ts`, built once at import and read-only afterwards), `logLevelAsNumber` (`packages/rocketh-node/src/cli.ts`), `lastSpin` (`packages/rocketh/src/internal/logging.ts`) and the frozen `KNOWN_DEV_CHAIN_IDS` set (`packages/rocketh/src/environment/chains.ts`). All four sit in `rocketh` or `@rocketh/node`. Core has none.

## Considered options

Making `@rocketh/core` a peer dependency too would force a single copy structurally rather than relying on an invariant. It was not done because core is an implementation detail that users do not install directly, and promoting it to a peer would push a resolution burden onto every consumer for a duplication that is currently harmless. Branding the environment with a `Symbol.for`-keyed marker would survive duplication, but it would make the enhancement check opaque and buy nothing while the string-key check works.

## Consequences

Duplication costs install size, and if two core versions' `Environment` shapes diverge it surfaces as a TypeScript structural mismatch, which is loud and at build time rather than silent at runtime.

The invariant is load-bearing and easy to break innocently. It stops holding if anyone adds module-level mutable state to `@rocketh/core`, brands the environment with a symbol, replaces the `hasOwnProperty` check in `enhanceEnvIfNeeded` with an identity test, or moves stateful code out of `rocketh` / `@rocketh/node` into core. Any of those turns a duplicated core from a size cost into a correctness bug, and should be treated as requiring core to become a peer.

Note also that internal peer dependencies publish as `^` ranges rather than exact pins. A wider range lets a resolver satisfy several dependents with one shared copy, so it reduces duplication; exact pins are what force nested copies. This matters most for `@rocketh/node`, which owns the chain registries above and needs to stay single-copy.
