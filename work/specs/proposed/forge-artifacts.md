---
title: 'Forge artifacts: typed rocketh artifacts generated from forge''s out/'
slug: forge-artifacts
needsAnswers: true
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) and the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks or ADRs, and this spec settles to its durable framing of Problem, Solution, User Stories and Out of Scope.)

<!-- open-questions -->

## Open questions

1. **Where it lives.** A new Node-only package (working name `@rocketh/forge`) that also hosts the Solidity generation of spec `deployments-in-solidity`, or a part of `@rocketh/node`? A new package cannot be released by CI on its first publish (CONTEXT.md, "A brand-new package cannot be released by CI"), so that choice also decides a manual step. Recommendation: the new package, because everything Foundry-specific then has one home and `@rocketh/node` stays toolchain-neutral.
2. **How it is invoked.** A `rocketh` CLI subcommand (for example `rocketh forge-artifacts`), a bin of the new package, or a config entry that `rocketh` runs before every deploy? Recommendation: a subcommand that a `package.json` script runs after `forge build`, plus a watch mode later if asked for.

<!-- /open-questions -->

## Problem Statement

A Foundry user compiles with `forge build` and deploys with the `rocketh` CLI. Today they reach their artifacts by hand: `documentation/getting-started/` has them write a `fromForge` function and import each `out/<File>.sol/<Contract>.json` themselves. The ABI then comes from JSON, so it has no literal types: constructor arguments, function names and return values are not checked, which is most of what a TypeScript deploy script gains over a JavaScript one. A Hardhat user gets typed artifacts generated for them by hardhat-deploy (`generateTypedArtifacts`); a Foundry user has no equivalent.

## Solution

rocketh reads forge's build output and generates the same typed artifacts module hardhat-deploy generates: one `as const` export per contract, plus an index the deploy scripts import as `artifacts`. A Foundry project then writes `artifacts.Counter` exactly as a Hardhat project does, and gets the same type checking of arguments and calls. The generator is the one hardhat-deploy already has, fed by a forge input instead of Hardhat's artifacts, so the two outputs cannot drift.

## User Stories

1. As a Foundry user, I want one command after `forge build` that generates typed artifacts for every contract in `out/`, so that I never hand-write an artifact adapter.
2. As a Foundry user, I want constructor arguments and function calls in my deploy scripts type-checked against the ABI, so that a wrong argument fails `tsc`, not the deployment.
3. As a Foundry user, I want the generated module shaped like hardhat-deploy's (`artifacts.<Name>`, the same `Artifact` fields), so that docs, skills and examples written for one apply to the other.
4. As a Foundry user with two contracts of the same name in different files, I want both available under unambiguous names, so that generation does not silently pick one.
5. As a Foundry user, I want test contracts, scripts and forge-std's own contracts left out by default, so that the module holds what I deploy.
6. As a Foundry user, I want the solc metadata and the source path kept in each artifact, so that verification (`@rocketh/verifier`) and the Solidity accessors of spec `deployments-in-solidity` have what they need.
7. As a Foundry user whose `foundry.toml` sets another `out` or `src`, I want those settings honoured, so that the command works on my layout without flags.
8. As a Foundry user, I want regeneration to rewrite only what changed, so that it does not churn my editor or a watcher.
9. As a Foundry user, I want linked libraries to be supported as they are for Hardhat artifacts, so that a contract with an external library deploys.
10. As a maintainer, I want the hardhat-deploy and forge paths to share one generator, so that a fix to the generated shape lands in both.

## Implementation Decisions

- Lift the generator out of `packages/hardhat-deploy` (`generate-types.ts`) into a toolchain-neutral module, with an input adapter per toolchain: Hardhat's artifacts and forge's `out/`. hardhat-deploy keeps its behaviour byte for byte.
- The forge adapter reads each `out/<File>.sol/<Contract>.json`: `abi`, `bytecode.object`, `deployedBytecode.object`, `rawMetadata` (the solc metadata string), link references, and the source path from the metadata's `compilationTarget`. Which contracts to include is decided from the source path (the project's `src`, not `test`, `script` or `lib`), with an override.
- `foundry.toml` is read for `src` and `out` (the default profile), falling back to forge's defaults.

## Testing Decisions

- Fixture forge `out/` trees checked into the test folder (small, hand-trimmed), so the tests need no forge binary: same-name contracts, a linked library, a non-default `out`.
- A type-level test (a `@ts-expect-error` on a wrong constructor argument) to pin that the output is actually typed; `pnpm typecheck` enforces it (CONTEXT.md, tests are type-checked).
- The existing getting-started test (`scripts/test-doc.sh`, which already installs Foundry in CI) switches the page to the generated artifacts, so the real forge path is exercised end to end.

## Out of Scope

- Getting deployments into Solidity tests: spec `deployments-in-solidity`.
- An in-process chain for runs without Hardhat: spec `in-process-chain`.
- Compiling: rocketh still does not compile anything; `forge build` does.

## Further Notes

`documentation/getting-started/` changes to use this, and its "For typed artifacts, generate a `.ts` module" paragraph goes away. Spec `foundry-reading-path` covers the rest of the docs.
