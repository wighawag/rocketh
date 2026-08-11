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

## Update (2026-08-11): the DOCS half is done; only the code-guard decision is still open

The documentation follow-up this note asked for has landed, so the open question is now narrower than when it was surfaced:

- `AGENTS.md` (the `Do` list) states the constraint, what breaks (a class throws `TypeError: Class constructor … cannot be invoked without 'new'`, a constant becomes a self-returning getter), that it surfaces at deploy-script RUN time, and the subpath escape hatch.
- `CONTEXT.md` gains an **extension** glossary entry carrying the same rule.
- `documentation.md` states it where users meet it, in the `@rocketh/unknown-signer` section that now documents the extension idiom as primary.

What is NOT decided, and is the whole of the remaining question in `work/questions/observation-extension-package-root-must-export-only-curried-functions-2026-08-09.md`: whether `withEnvironment` (`packages/rocketh-core/src/environment.ts`) should ALSO fail fast on a non-function root export, either by skipping it or by throwing a message naming the offending key. That is a runtime change to `@rocketh/core`, which `AGENTS.md` lists under "ask first", so it is deliberately left for a human. Docs alone leave the failure at deploy-script run time; a throw moves detection to first extension load.
