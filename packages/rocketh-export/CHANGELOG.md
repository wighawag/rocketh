# @rocketh/export

## 0.19.23

### Patch Changes

- Updated dependencies [916507d]
  - @rocketh/core@0.19.12
  - rocketh@0.19.19
  - @rocketh/node@0.19.21

## 0.19.22

### Patch Changes

- 6ff02a0: Refuse to write a module export whose deployment name is not a JavaScript identifier.

  The module output modes (`--tsm` / `--jsm`) emit one named export per deployment:

  ```ts
  export const ${contractName} = {...} as const;
  ```

  so the deployment name stops being data and becomes SOURCE. Nothing validated it. A name that is a perfectly good file name and a perfectly good JSON key, `Token-V2`, `My Registry`, or `default`, produced a generated file that does not parse. The failure then surfaced in the consuming application's build, pointing at generated code, with nothing naming the deployment that caused it, while `rocketh-export` itself had exited 0.

  `run()` now throws `InvalidModuleExportNameError` (an `ExportError`, so the CLI reports it on stderr with exit 1) before writing either module file, listing EVERY offending name rather than the first, so one run fixes them all:

  ```
  cannot export environment 'sepolia' as a module: a deployment name is not a valid JavaScript identifier
    - "Token-V2"
    --tsm/--jsm emit `export const <name> = ...`, so each deployment name becomes an identifier.
    either rename the deployment, or export with --ts/--js/--json, which keep names as object keys
  ```

  **It refuses rather than sanitising.** Rewriting `Token-V2` to `Token_V2` would emit a file that parses, at the cost of an export name the consumer cannot predict from their own deploy script, and one that no longer matches the key the same deployment gets in the `--json` / `--ts` object modes. Silently renaming the identifier someone has to `import` fails later and somewhere else, which is the failure mode this package has been closing off elsewhere.

  The check covers reserved words as well as shape, since `default` and `class` have an identifier's shape but cannot follow `export const`. `undefined`, `NaN` and `Infinity` are deliberately allowed: they are shadowable bindings, so `export const undefined = ...` is legal, and refusing a legal name would be the same overreach as renaming one.

  The object modes are unaffected and keep the name exactly, which is what the message points at as the way out. Tests cover the refusal, the multi-name report, and that the same deployment still exports fine through `--json` / `--ts`.

- 77fd61f: Add `--verify`, an opt-in check that the deployments being exported are really on the chain.

  The generated file is the consuming app's source of truth for addresses, and export builds it from FILES. Nothing in that path can notice that a record is stale, that the chain it describes was reset, or that the environment being exported is not the network the app will connect to. The symptom shows up much later, as a user's transaction reverting against an address that holds no code.

  `rocketh-export -e sepolia --verify` (or `run(config, env, {verify: true})`) asks the chain two questions before writing anything:

  - **the chain id the RPC reports matches the one recorded for this environment**, which catches exporting `localhost` while pointed at a testnet and vice versa;
  - **every exported address has code**, which catches a record kept from a chain that was since reset, a deployment that never landed, and an address edited by hand.

  **It is opt-in, and it stays opt-in.** Export reads files and writes files, so it runs with no network at all, and a CI web build depends on exactly that: a default that reached for an RPC would break every offline build. There is a test asserting that a plain export makes zero provider calls, so the property is pinned rather than promised.

  Behaviour when it fails: nothing is written, and the previous output is left alone, because a half-verified file is worse than an old one, since it looks current. Every offending contract is named in one message rather than one per run. A wrong chain id is reported as a **single** cause and stops there, because on the wrong network every address also reports no code, and a page of consequences buries the one thing that is wrong. An unreachable node fails the export rather than silently skipping the checks: `--verify` was asked for explicitly, and "could not check" is not "checked".

  A provider can be passed to `run()` directly for a caller that already has a connection; otherwise one is built from the chain's `rpcUrl`, and an environment with neither says so rather than exporting unverified output while looking verified.

  Deliberately **not** compared: deployed bytecode against the record's. Immutables and library links legitimately differ from the artifact, so that check needs a tolerance model of its own, and a false alarm there would teach people to never pass the flag.

- Updated dependencies [753705b]
- Updated dependencies [7fdb319]
- Updated dependencies [400ece3]
- Updated dependencies [ad03283]
- Updated dependencies [8547e39]
  - rocketh@0.19.18
  - @rocketh/core@0.19.11
  - @rocketh/node@0.19.20

## 0.19.21

### Patch Changes

- a67cb72: Fail instead of silently doing nothing when no output file was asked for.

  The sibling of the "no deployments" no-op, in the same function and with the same shape: `rocketh-export -e localhost` with no `--ts`/`--js`/`--json`/`--tsm`/`--jsm` printed `no filepath to export to are specified` on **stdout** and exited **0**. A chained `deploy && export && dev` therefore carried on with an output file that was never regenerated, which is the same failure the deployments fix addressed, reached by a different route.

  It now throws `NoOutputPathError`, and the CLI prints on stderr and exits 1. The message names the environment that was being exported and the flags that would satisfy the request (with the `run()` option names alongside, since the same error reaches a programmatic caller):

  ```
  rocketh-export: no output file specified for the export of environment 'localhost'
    pass at least one of --ts, --js, --json, --tsm, --jsm (tots, tojs, tojson, totsm, tojsm when calling run() directly)
  ```

  The check stays where it was, ahead of loading the environment, so this is reported before "no deployments" when both are true. That is deliberate: it is the caller's own arguments that are wrong, and that is the first thing they have to fix, whatever the deployments hold. A test pins the precedence.

  Both failures now share an `ExportError` base class, which is what the CLI branches on: an `ExportError` is reported as a message with exit 1, anything else keeps its stack trace because it means something unexpected went wrong. A base class rather than a union of `instanceof` checks, so a failure added later joins that branch instead of silently falling through to the stack-trace path.

  **Is this breaking?** Only for an invocation that passed no output flag, which produced no output before and produces none now; the difference is that it says so. The one caller in this repo that could reach it, `"export": "ldenv rocketh-export -n @@MODE @@"` in `demoes/hardhat-deploy/proxies`, already fails earlier and unrelatedly: it passes `-n`, which was renamed to `-e`, so commander refuses it with `required option '-e, --environment <value>' not specified`. That script needs fixing on its own account and is untouched here.

- e985174: Fail instead of silently doing nothing when the named environment has no deployments.

  `rocketh-export -e nosuchnet --ts ../web/src/lib/deployments.ts` printed `no deployments to export` on **stdout**, exited **0**, and wrote nothing. What made that dangerous is not the missing write on its own: the generated file is the consuming app's source of truth for addresses and ABIs, and it is normally ALREADY THERE from an earlier export against a different environment. So "write nothing and succeed" does not leave the app with no deployments, it leaves it with **another environment's** deployments, silently. The case that prompted this: a project ran `attach sepolia` against an environment with no records, the export no-opped, the dev server came up, and the app talked to localhost addresses while the developer believed they were on Sepolia. Nothing in that chain reported a problem. A typo in `-e` produces exactly the same silence and is the more common way to hit it.

  Now `run()` throws `NoDeploymentsError` and the CLI prints a message on **stderr** and exits **1**. Two situations the old single branch collapsed together are now told apart, because the reader's next action differs:

  - `reason: 'missing-folder'`: no deployment folder for that environment at all. The message names the path it looked at and lists the environments that DO exist, since a typo is the common cause. If the deployments folder itself is absent it says so, pointing at `-d` / the config's `deployments` rather than at the environment name.
  - `reason: 'no-records'`: the folder is there but holds no deployment record. Not a typo, so the message says the folder exists and to deploy first.

  Both are fatal, and the exit code is the same for both. They differ in cause but not in consequence: whichever one happened, the consumer is about to read a stale file, and there is nothing useful to write in either case. The message also names the output files that were left in place, because those holding a previous environment's addresses is the actual danger and nothing else in the chain reports it:

  ```
  rocketh-export: no deployments to export for environment 'nosuchnet'
    no such deployment folder: /project/deployments/nosuchnet
    environments found in /project/deployments: localhost, sepolia
    check the name passed to -e, or deploy to 'nosuchnet' first
    nothing was written: /project/web/src/lib/deployments.ts still holds the result of a previous export
  ```

  The failure is raised before any `mkdir` or write, so a failed export leaves every output file byte-identical and creates no directories: half-writing the file on the way to erroring would be worse than the bug being fixed. This is covered by a test, as is the CLI's exit code and stream, which `run()` alone cannot show.

  **Is this breaking?** Yes for anyone relying on the silent no-op. It is declared `patch` only because this monorepo forces every pre-1.0 changeset to `patch` (see `scripts/force-patch-changesets.ts`, where a 0.x `minor` cascades peer-dependents to `1.0.0`), not because the change is compatible: an invocation that exited 0 now exits 1. In practice that caller has to be exporting an environment it does not require to exist, for example a loop over several environments in a build script that tolerates gaps. No such caller exists in this repo or in the documented flows: `-e/--environment` is a `requiredOption` and `run(config, environmentName, options)` takes the name as a required argument, so every invocation names exactly one environment and is therefore making a request that deserves an answer. If a tolerant caller does turn up, the fix is a flag to opt back into a warning, not a return to exiting 0 by default.

  Also awaited in the CLI, which was calling `run()` without awaiting: any other failure (a missing `.chain` file, for instance) surfaced as an unhandled rejection rather than a reported error.

## 0.19.20

### Patch Changes

- 42d7ff6: Publish internal peer dependencies as `^` ranges instead of exact versions.

  Every internal peer was declared `workspace:*`, which pnpm replaces at publish time with the exact version of the peer as it stood at that moment. `@rocketh/export@0.19.19` therefore shipped `peerDependencies: {"@rocketh/node": "0.19.18", "rocketh": "0.19.17"}`, and upgrading that one package forced a consumer to move `@rocketh/node`, `rocketh`, and then everything else pinning the same pair (`hardhat-deploy`, the proxy, router and verifier packages) in a single lockstep step. They are now `workspace:^`, which publishes as `^0.19.18` / `^0.19.17`, meaning `>=0.19.17 <0.20.0`: patch drift inside the 0.19 line is allowed, 0.20.0 is still refused.

  The floor is unchanged, and that is the point. An exact pin and a caret share the same lower bound; they differ only in the ceiling, and a ceiling of "exactly the version that happened to be newest when this package was published" encodes publish timing rather than a compatibility fact. `updateInternalDependencies: "patch"` re-pins these on every release, so the pinned number moved even when the peer's API did not. The caret keeps the lower bound that actually carries meaning (a package needing a fix from its peer still refuses anything older) and drops the upper bound that never did.

  Nine entries across eight packages changed: `hardhat-deploy` (`@rocketh/node`, `rocketh`), `@rocketh/doc` (`@rocketh/node`), `@rocketh/export` (`@rocketh/node`, `rocketh`), `@rocketh/node` (`rocketh`), `@rocketh/playground` (`rocketh`), `@rocketh/test-utils` (`rocketh`), `@rocketh/verifier` (`@rocketh/node`), `@rocketh/web` (`rocketh`). Each consumes named function or type exports of its peer rather than subclassing it, checking `instanceof` against it, or sharing module-level state with it, so none of them requires a single exact peer build. `@rocketh/viem`'s `viem: ^2.45.0` is external and was already a range.

  **What this does NOT do.** Already-published versions keep the exact pins baked into their published `package.json`, and nothing can retroactively widen them. This only takes effect for versions published from this release onward. A project currently stuck on the cascade does not get unstuck by this change alone: it has to re-resolve onto releases that carry the new ranges, which in practice means upgrading the affected rocketh packages once more, after which single-package upgrades within the 0.19 line stop dragging the rest along.

  Two related exact pins are deliberately left alone here and reported separately, because both change installation rather than only the peer constraint. `hardhat-deploy` declares `@rocketh/node` and `rocketh` as regular `dependencies` as well as peers, and a regular dependency pinned exact still forces a specific build, so widening only its peer does not by itself remove `hardhat-deploy` from the cascade. `@rocketh/core` is a regular `workspace:*` dependency of nearly every package and likewise publishes exact, so packages of different vintages can pull in several copies of it.

- Updated dependencies [42d7ff6]
  - @rocketh/node@0.19.19

## 0.19.19

### Patch Changes

- Updated dependencies [5266a61]
- Updated dependencies [7f9819e]
- Updated dependencies [7f9819e]
  - rocketh@0.19.17
  - @rocketh/node@0.19.18

## 0.19.18

### Patch Changes

- 3deae1b: Stop `as const` making the exported chain info unusable.

  The generated TypeScript is emitted `as const`, which is exactly right for the CONTRACTS (literal addresses and ABIs are the whole reason to export TypeScript rather than JSON) and wrong for the CHAIN, which is configuration a consumer legitimately overrides at run time. Two fields could not be used at all without a hand-written cast:

  - **`chain.rpcUrls.*.http`** — rocketh no longer bakes a public RPC endpoint into chain info, so this is very often `[]`, which `as const` pins to `readonly []`. Nothing is assignable to that type, so a consumer holding `typeof deployments.chain` could not construct a chain with an endpoint injected from an env var or from the user's wallet. A non-empty list was equally stuck, pinned to its own literal tuple.
  - **`chain.properties`** — usually `{}`, which `as const` pins to `{}`, so reading a known property such as `averageBlockTimeMs` or `finality` was a type error rather than `undefined`.

  Both are now widened (`readonly string[]` and `Record<string, JSONValue>`) by a small set of type aliases prepended to the generated file. The widening is surgical rather than dropping `as const`: `chain.id`, `chain.name`, `nativeCurrency`, contract addresses and ABIs all keep their literal types, and a test pins that they do.

  The aliases are emitted as local declarations rather than imported, because a generated deployments file has to stay dependency-free enough to drop into a project with no rocketh packages installed.

  Applies to the `--ts` output, the `.d.ts` sidecar emitted beside `--js`, and the `--tsm` module output. `--json` has no types and is unaffected; `--jsm` emits no `.d.ts` and is unchanged.

  Found in the wild: `jolly-roger` carried a hand-written `ChainInfo` cast whose comment described this precisely, meaning every consumer of `@rocketh/export` had to discover and re-solve it. The new tests type-check a generated file with a real `tsc` invocation rather than asserting on substrings, and were each verified to fail with the fix reverted.

- Updated dependencies [6c7aee3]
  - rocketh@0.19.16
  - @rocketh/node@0.19.17

## 0.19.17

### Patch Changes

- Updated dependencies [d41ff21]
  - rocketh@0.19.15
  - @rocketh/node@0.19.16

## 0.19.16

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - @rocketh/node@0.19.15
  - rocketh@0.19.14

## 0.19.15

### Patch Changes

- Updated dependencies [6ea32f1]
- Updated dependencies [0397afa]
- Updated dependencies [9b46130]
- Updated dependencies [0692a33]
- Updated dependencies [1a583b2]
- Updated dependencies [c833bda]
  - rocketh@0.19.13
  - @rocketh/node@0.19.14
  - @rocketh/core@0.19.9

## 0.19.14

### Patch Changes

- Updated dependencies [11ab414]
- Updated dependencies [a5db88c]
- Updated dependencies [aac0ca1]
- Updated dependencies [ef4a3b0]
- Updated dependencies [9319520]
- Updated dependencies [2797550]
- Updated dependencies [43b9545]
- Updated dependencies [e20634b]
- Updated dependencies [d800333]
- Updated dependencies [01d5bfb]
  - rocketh@0.19.12
  - @rocketh/core@0.19.8
  - @rocketh/node@0.19.13

## 0.19.13

### Patch Changes

- Updated dependencies [09ea46d]
  - rocketh@0.19.11
  - @rocketh/core@0.19.7
  - @rocketh/node@0.19.12

## 0.19.12

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - rocketh@0.19.10
  - @rocketh/node@0.19.11

## 0.19.11

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - rocketh@0.19.9
  - @rocketh/node@0.19.10

## 0.19.10

### Patch Changes

- Updated dependencies [b624ef0]
  - @rocketh/node@0.19.9

## 0.19.9

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - @rocketh/node@0.19.8
  - rocketh@0.19.8

## 0.19.8

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3
  - rocketh@0.19.7
  - @rocketh/node@0.19.7

## 0.19.7

### Patch Changes

- Updated dependencies [e06b151]
  - rocketh@0.19.6
  - @rocketh/node@0.19.6

## 0.19.6

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2
  - @rocketh/node@0.19.5
  - rocketh@0.19.5

## 0.19.5

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - rocketh@0.19.4
  - @rocketh/core@0.19.1
  - @rocketh/node@0.19.4

## 0.19.4

### Patch Changes

- support hardhat-deploy v1 receipt format

## 0.19.3

### Patch Changes

- Updated dependencies
  - rocketh@0.19.3
  - @rocketh/node@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies
  - rocketh@0.19.2
  - @rocketh/node@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies
  - rocketh@0.19.1
  - @rocketh/node@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - rocketh@0.19.0
  - @rocketh/core@0.19.0
  - @rocketh/node@0.19.0

## 0.18.8

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.4
  - @rocketh/node@0.18.8
  - rocketh@0.18.7

## 0.18.7

### Patch Changes

- Updated dependencies
  - rocketh@0.18.6
  - @rocketh/node@0.18.7

## 0.18.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3
  - rocketh@0.18.5
  - @rocketh/node@0.18.6

## 0.18.5

### Patch Changes

- Updated dependencies
  - rocketh@0.18.4
  - @rocketh/node@0.18.5

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - rocketh@0.18.3
  - @rocketh/node@0.18.4

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - rocketh@0.18.2
  - @rocketh/node@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies
  - rocketh@0.18.1
  - @rocketh/node@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.18.1

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - rocketh@0.18.0
  - @rocketh/core@0.18.0
  - @rocketh/node@0.18.0

## 0.17.26

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17
  - rocketh@0.17.23
  - @rocketh/node@0.17.26

## 0.17.25

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16
  - rocketh@0.17.22
  - @rocketh/node@0.17.25

## 0.17.24

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15
  - rocketh@0.17.21
  - @rocketh/node@0.17.24

## 0.17.23

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14
  - @rocketh/node@0.17.23
  - rocketh@0.17.20

## 0.17.22

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - rocketh@0.17.19
  - @rocketh/node@0.17.22

## 0.17.21

### Patch Changes

- add metadata to packages
- Updated dependencies
  - rocketh@0.17.18
  - @rocketh/core@0.17.12
  - @rocketh/node@0.17.21

## 0.17.20

### Patch Changes

- add licenses
- Updated dependencies
  - rocketh@0.17.17
  - @rocketh/core@0.17.11
  - @rocketh/node@0.17.20

## 0.17.19

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.10
  - @rocketh/node@0.17.19
  - rocketh@0.17.16

## 0.17.18

### Patch Changes

- b765457: better warning for cahing info missing
- Updated dependencies [b765457]
  - rocketh@0.17.15
  - @rocketh/node@0.17.18

## 0.17.17

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/core@0.17.9
  - @rocketh/node@0.17.17
  - rocketh@0.17.14

## 0.17.16

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - rocketh@0.17.13
  - @rocketh/node@0.17.16

## 0.17.15

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.15

## 0.17.14

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.14

## 0.17.13

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.13
  - rocketh@0.17.12

## 0.17.12

### Patch Changes

- Updated dependencies
  - rocketh@0.17.11
  - @rocketh/node@0.17.12

## 0.17.11

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.11

## 0.17.10

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - @rocketh/node@0.17.10
  - rocketh@0.17.10

## 0.17.9

### Patch Changes

- Updated dependencies
  - rocketh@0.17.9
  - @rocketh/node@0.17.9

## 0.17.8

### Patch Changes

- Updated dependencies [e737031]
- Updated dependencies [f4431ed]
  - rocketh@0.17.8
  - @rocketh/core@0.17.6
  - @rocketh/node@0.17.8

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5
  - @rocketh/node@0.17.7
  - rocketh@0.17.7

## 0.17.6

### Patch Changes

- Updated dependencies
  - rocketh@0.17.6
  - @rocketh/node@0.17.6

## 0.17.5

### Patch Changes

- provider available: doNotRequireRpcURL
- Updated dependencies
  - rocketh@0.17.5
  - @rocketh/node@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [dc5aefe]
  - rocketh@0.17.4
  - @rocketh/node@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies
  - rocketh@0.17.3
  - @rocketh/node@0.17.3

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- Updated dependencies [6642ece]
- Updated dependencies [c574413]
  - @rocketh/node@0.17.2
  - rocketh@0.17.2

## 0.17.1

### Patch Changes

- better default chain info resolution
- Updated dependencies
  - rocketh@0.17.1
  - @rocketh/node@0.17.1

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies [d67b01f]
  - @rocketh/node@invalid
  - rocketh@0.17.0

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.0-next.0
  - rocketh@0.17.0-next.0

## 0.16.0

### Minor Changes

- add @roceth/core

### Patch Changes

- Updated dependencies
  - rocketh@0.16.0
  - @rocketh/core@0.16.0

## 0.15.15

### Patch Changes

- Updated dependencies
  - rocketh@0.15.15

## 0.15.14

### Patch Changes

- Updated dependencies
  - rocketh@0.15.14

## 0.15.13

### Patch Changes

- Updated dependencies
  - rocketh@0.15.13

## 0.15.12

### Patch Changes

- Updated dependencies
  - rocketh@0.15.12

## 0.15.11

### Patch Changes

- Updated dependencies
  - rocketh@0.15.11

## 0.15.10

### Patch Changes

- latest deps
- Updated dependencies
  - rocketh@0.15.10

## 0.15.9

### Patch Changes

- Updated dependencies
  - rocketh@0.15.9

## 0.15.8

### Patch Changes

- Updated dependencies
  - rocketh@0.15.8

## 0.15.7

### Patch Changes

- Updated dependencies
  - rocketh@0.15.7

## 0.15.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.6

## 0.15.5

### Patch Changes

- Updated dependencies
  - rocketh@0.15.5

## 0.15.4

### Patch Changes

- Updated dependencies
  - rocketh@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies
  - rocketh@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies
  - rocketh@0.15.2

## 0.15.1

### Patch Changes

- Updated dependencies
  - rocketh@0.15.1

## 0.15.0

### Minor Changes

- 851378e: revamp the settings to be allowed to configure per chain as well as per target

### Patch Changes

- 0d7e7ed: fix export
- 691d296: fixes
- a0fcde6: fixes
- 03f2406: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- 4d1a814: fix cli
- e260c6d: fix
- Updated dependencies [8122cdb]
- Updated dependencies [e6de720]
- Updated dependencies [1f2e044]
- Updated dependencies [9d920a8]
- Updated dependencies [c682fd2]
- Updated dependencies [0d7e7ed]
- Updated dependencies [691d296]
- Updated dependencies [cb340e2]
- Updated dependencies [2b82b5b]
- Updated dependencies [a0fcde6]
- Updated dependencies [356f26c]
- Updated dependencies [03f2406]
- Updated dependencies [68151ae]
- Updated dependencies [e2dbd6f]
- Updated dependencies [851378e]
- Updated dependencies [4d1a814]
- Updated dependencies [e260c6d]
- Updated dependencies [feb4780]
  - rocketh@0.15.0

## 0.15.0-testing.17

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.17

## 0.15.0-testing.16

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.16

## 0.15.0-testing.15

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.15

## 0.15.0-testing.14

### Patch Changes

- fixes
- Updated dependencies
  - rocketh@0.15.0-testing.14

## 0.15.0-testing.13

### Patch Changes

- rname target to environment
- Updated dependencies
  - rocketh@0.15.0-testing.13

## 0.15.0-testing.12

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.12

## 0.15.0-testing.11

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.11

## 0.15.0-testing.10

### Patch Changes

- fix export
- Updated dependencies
  - rocketh@0.15.0-testing.10

## 0.15.0-testing.9

### Patch Changes

- fixes
- Updated dependencies
  - rocketh@0.15.0-testing.9

## 0.15.0-testing.8

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.15.0-testing.8

## 0.15.0-testing.7

### Patch Changes

- revamp of types and resolution
- Updated dependencies
  - rocketh@0.15.0-testing.7

## 0.15.0-testing.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.6

## 0.15.0-testing.5

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.5

## 0.15.0-testing.4

### Patch Changes

- fixes
- Updated dependencies
  - rocketh@0.15.0-testing.4

## 0.15.0-testing.3

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.3

## 0.15.0-testing.2

### Patch Changes

- fix cli
- Updated dependencies
  - rocketh@0.15.0-testing.2

## 0.15.0-testing.1

### Minor Changes

- Updated dependencies
  - rocketh@0.15.0-testing.1
- revamp the settings to be allowed to configure per chain as well as per target

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.0

## 0.14.10

### Patch Changes

- consolidate the export format + add ability to augment chain data with custom properties
- Updated dependencies
  - rocketh@0.14.9

## 0.14.9

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.14.8

## 0.14.8

### Patch Changes

- latest deps + fix eth_feeHistory
- Updated dependencies
  - rocketh@0.14.7

## 0.14.7

### Patch Changes

- fix js export

## 0.14.6

### Patch Changes

- Updated dependencies
  - rocketh@0.14.6

## 0.14.5

### Patch Changes

- Updated dependencies
  - rocketh@0.14.5

## 0.14.4

### Patch Changes

- Updated dependencies
  - rocketh@0.14.4

## 0.14.2

### Patch Changes

- Updated dependencies
  - rocketh@0.14.2

## 0.14.1

### Patch Changes

- Updated dependencies
  - rocketh@0.14.1

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

### Patch Changes

- Updated dependencies
  - rocketh@0.14.0

## 0.13.4

### Patch Changes

- Updated dependencies
  - rocketh@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies
  - rocketh@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies
  - rocketh@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies
  - rocketh@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies
  - rocketh@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies
  - rocketh@0.12.1

## 0.12.0

### Minor Changes

- fix version
- switch to setup function

### Patch Changes

- Updated dependencies
  - rocketh@0.12.0

## 0.11.22

### Patch Changes

- 5bf9962: allow to pass Extra date to environment
- a76870d: signer protocols are specified via config
- de97d9c: fix
- 77c2ffd: fix
- c841f17: use hard deps
- 966bab6: fixes
- c03812e: Extra type generic
- 1148e1c: fix
- Updated dependencies [5bf9962]
- Updated dependencies [a76870d]
- Updated dependencies [de97d9c]
- Updated dependencies [77c2ffd]
- Updated dependencies [c841f17]
- Updated dependencies [966bab6]
- Updated dependencies [c03812e]
- Updated dependencies [1148e1c]
- Updated dependencies [4d37f14]
  - rocketh@0.11.22

## 0.11.22-testing.8

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.11.22-testing.8

## 0.11.22-testing.7

### Patch Changes

- Extra type generic
- Updated dependencies
  - rocketh@0.11.22-testing.7

## 0.11.22-testing.6

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.11.22-testing.6

## 0.11.22-testing.5

### Patch Changes

- allow to pass Extra date to environment
- Updated dependencies
  - rocketh@0.11.22-testing.5

## 0.11.22-testing.4

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.11.22-testing.4

## 0.11.22-testing.3

### Patch Changes

- signer protocols are specified via config
- Updated dependencies
  - rocketh@0.11.22-testing.3

## 0.11.22-testing.2

### Patch Changes

- use hard deps
- Updated dependencies
  - rocketh@0.11.22-testing.2

## 0.11.22-testing.1

### Patch Changes

- fixes
- Updated dependencies
  - rocketh@0.11.22-testing.1

## 0.11.22-testing.0

### Patch Changes

- Updated dependencies
  - rocketh@0.11.22-testing.0

## 0.11.21

### Patch Changes

- Updated dependencies
  - rocketh@0.11.21

## 0.11.20

### Patch Changes

- Updated dependencies
  - rocketh@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies
  - rocketh@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies
  - rocketh@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies
  - rocketh@0.11.17

## 0.11.16

### Patch Changes

- public chain info in config
- Updated dependencies
  - rocketh@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies
  - rocketh@0.11.15

## 0.11.14

### Patch Changes

- LinkedData + remove auto-json-convertion
- Updated dependencies
  - rocketh@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies
  - rocketh@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies
  - rocketh@0.11.12

## 0.11.11

### Patch Changes

- Updated dependencies
  - rocketh@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies
  - rocketh@0.11.10

## 0.11.9

### Patch Changes

- Updated dependencies [6d4e756]
- Updated dependencies [82f6787]
- Updated dependencies [37e6a46]
  - rocketh@0.11.9

## 0.11.8

### Patch Changes

- Updated dependencies
  - rocketh@0.11.8

## 0.11.7

### Patch Changes

- Updated dependencies
  - rocketh@0.11.7

## 0.11.6

### Patch Changes

- Updated dependencies
  - rocketh@0.11.6

## 0.11.5

### Patch Changes

- Updated dependencies [4426c7d]
  - rocketh@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies
  - rocketh@0.11.4

## 0.11.3

### Patch Changes

- 2431e8f: remove the use of context
- Updated dependencies [2431e8f]
  - rocketh@0.11.3

## 0.11.2

### Patch Changes

- Updated dependencies [f2959f3]
- Updated dependencies [169b618]
- Updated dependencies [aaba9cb]
- Updated dependencies [fee5656]
  - rocketh@0.11.2

## 0.11.1

### Patch Changes

- release as v0.11.1
- Updated dependencies
  - rocketh@0.11.1

## invalid-next.5

### Patch Changes

- Updated dependencies [9a9b3c4]
  - rocketh@invalid-next.5

## invalid-next.4

### Patch Changes

- add @rocketh/read-execute
- Updated dependencies
  - rocketh@invalid-next.4

## invalid-next.3

### Patch Changes

- fix dist path
- Updated dependencies
  - rocketh@invalid-next.3

## invalid-next.2

### Patch Changes

- update deps
- Updated dependencies
  - rocketh@invalid-next.2

## invalid-next.1

### Patch Changes

- Updated dependencies
  - rocketh@invalid-next.1

## 0.17.0-next.0

### Major Changes

- first alpha release

### Patch Changes

- Updated dependencies
  - rocketh@0.17.0-next.0

## 0.10.15

### Patch Changes

- fix chains import, no default export
- Updated dependencies
  - rocketh@0.10.18

## 0.10.14

### Patch Changes

- hardhat3-rocketh
- Updated dependencies
  - rocketh@0.10.17

## 0.10.13

### Patch Changes

- export dist

## 0.10.12

### Patch Changes

- use tsx
- Updated dependencies
  - rocketh@0.10.16

## 0.10.11

### Patch Changes

- Updated dependencies
  - rocketh@0.10.15

## 0.10.10

### Patch Changes

- allow to export each contract as individual exported field

## 0.10.9

### Patch Changes

- export argsData when exporting bytecode

## 0.10.8

### Patch Changes

- latest dependencies
- Updated dependencies
  - rocketh@0.10.14

## 0.10.7

### Patch Changes

- Updated dependencies
  - rocketh@0.10.13

## 0.10.6

### Patch Changes

- Updated dependencies
  - rocketh@0.10.12

## 0.10.5

### Patch Changes

- forgot to build

## 0.10.4

### Patch Changes

- chalk do not support cjs

## 0.10.3

### Patch Changes

- Updated dependencies
  - rocketh@0.10.11

## 0.10.2

### Patch Changes

- Updated dependencies
  - rocketh@0.10.10

## 0.10.1

### Patch Changes

- use pkgroll and @rocketh namespace
- Updated dependencies
  - rocketh@0.10.9
