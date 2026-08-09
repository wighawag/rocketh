---
title: an extension package's root may only export curried functions, and that is undocumented
slug: extension-package-root-must-export-only-curried-functions-2026-08-09
needsAnswers: true
---

# An extension package's ROOT export surface may only contain curried `(env) => …` functions

Spotted 2026-08-09 while building `@rocketh/unknown-signer` (task `unknown-signer-package`), whose task text asked for `UnknownSignerError` to be re-exported from `src/index.ts`.

## What was seen

`withEnvironment` (`packages/rocketh-core/src/environment.ts`) iterates `Object.entries(functionsAndGetters)` and calls `func(env)` for EVERY entry. The documented user idiom (`README.md`, "then we import each extensions we are interested in") is `const extensions = {...deployExtension, ...readExecuteExtension}`, i.e. a namespace spread. So any non-function runtime export of an extension package is invoked as `value(env)`: a re-exported CLASS fails immediately with `TypeError: Class constructor … cannot be invoked without 'new'`, and a plain constant is silently turned into a getter returning itself.

Every existing extension package happens to comply (`@rocketh/deploy`, `@rocketh/read-execute`, `@rocketh/proxy`, `@rocketh/diamond`, `@rocketh/router`, `@rocketh/viem` export only curried functions plus erased `export type`s), so nothing is broken today. `@rocketh/unknown-signer` keeps its root function-only and puts the error class on a `./errors` subpath.

## Why it might matter

The constraint is load-bearing for every future extension package and is written down nowhere: not in `CONTEXT.md`, not in `AGENTS.md`, not in `withEnvironment`'s own JSDoc (whose example only shows functions and getters). The next package that re-exports a constant or a class from its root will break the spread idiom for its users, and the failure surfaces at deploy-script run time rather than at build time.

Possible follow-ups: a sentence in `AGENTS.md`/`CONTEXT.md`, and/or making `withEnvironment` skip non-function entries (or throw a message naming the offending key) instead of blindly calling them.
