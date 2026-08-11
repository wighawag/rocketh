# hardhat-deploy

## 2.0.20

### Patch Changes

- Updated dependencies [d41ff21]
  - rocketh@0.19.15
  - @rocketh/node@0.19.16

## 2.0.19

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/node@0.19.15
  - rocketh@0.19.14

## 2.0.18

### Patch Changes

- Updated dependencies [6ea32f1]
- Updated dependencies [0397afa]
- Updated dependencies [9b46130]
- Updated dependencies [0692a33]
- Updated dependencies [1a583b2]
  - rocketh@0.19.13
  - @rocketh/node@0.19.14

## 2.0.17

### Patch Changes

- 9319520: Make the unknown-signer policy reachable from the shell and settable once for every chain.
  - **New CLI option on both CLIs:** `rocketh --on-unknown-signer <throw|ask|auto>` and `hardhat deploy --on-unknown-signer <throw|ask|auto>`. Previously the only run-level lever was the programmatic `ExecutionParams.onUnknownSigner`, so there was no way to say "not interactive, just this once" from a terminal. An invalid value is rejected by name rather than silently passed through, and omitting the flag leaves config in charge.
  - **Fix: `--skip-prompts` now also forces `throw`** on both CLIs. It is documented as "skip any prompts" but only ever silenced the reset and gas-price confirmations, which was harmless until the interactive resolver landed and made `'auto'` prompt by default on a TTY. It wins over an explicit `--on-unknown-signer ask`, since asking to be prompted and not prompted at once is a contradiction and not prompting is the safe half. (For hardhat-deploy this also covers an in-memory network, where `skipPrompts` is forced on and there is no Safe to execute anything on.)
  - **New top-level `onUnknownSigner` in `UserConfig`**, so a repo-wide default is one line instead of one per `chains[id]` entry. Full precedence is now run parameter (including the CLI flag) > chain config > top-level config > the built-in `'auto'`; a more specific setting always wins.

  Docs: `@rocketh/unknown-signer` is now documented primarily as an EXTENSION (spread it into `extensions` and call `catchUnknownSigner(() => …)` straight off the deploy-script environment, no `env` threading), with the curried `catchUnknownSigner(env)(…)` form shown for use outside a deploy script.

- Updated dependencies [11ab414]
- Updated dependencies [a5db88c]
- Updated dependencies [aac0ca1]
- Updated dependencies [ef4a3b0]
- Updated dependencies [9319520]
- Updated dependencies [2797550]
- Updated dependencies [43b9545]
- Updated dependencies [e20634b]
  - rocketh@0.19.12
  - @rocketh/node@0.19.13

## 2.0.16

### Patch Changes

- Updated dependencies [09ea46d]
  - rocketh@0.19.11
  - @rocketh/node@0.19.12

## 2.0.15

### Patch Changes

- ea8117b: fix export again

## 2.0.14

### Patch Changes

- aeb3389: fix export

## 2.0.13

### Patch Changes

- 7c6a434: provide hardhat-deploy v1 solidity utils

## 2.0.12

### Patch Changes

- Updated dependencies [6456996]
  - rocketh@0.19.10
  - @rocketh/node@0.19.11

## 2.0.11

### Patch Changes

- 5b5eb00: Regenerate the typed artifacts after every successful contracts build, not only after full builds. The generation was hooked on `onCleanUpArtifacts`, which hardhat only triggers when the build performs an artifact cleanup, i.e. for a full build. The `deploy` task builds with `noTests: true`, which is not a full build, so the hook never fired during a deployment: solidity was recompiled with the `production` profile and `artifacts/` was up to date, but the generated typed artifacts that the deployment scripts actually import kept the content of the last full build (typically the `default` profile, optimizer off). Deployments could therefore ship unoptimized or outright stale bytecode.

  Generation now runs from `processArtifactsAfterSuccessfulBuild`, and the deprecated `onCleanUpArtifacts` hook is no longer registered. That hook was introduced in hardhat `3.6.0`, so the `hardhat` peer dependency moves from `^3.4.5` to `^3.6.0`.

## 2.0.10

### Patch Changes

- rocketh@0.19.9
- @rocketh/node@0.19.10

## 2.0.9

### Patch Changes

- 02455dc: Move the `hardhat-deploy` package source into the rocketh monorepo (`packages/hardhat-deploy`). It is now built, versioned, and published from here via changesets, with `rocketh` and `@rocketh/node` consumed as workspace dependencies. No API changes for consumers.
- Updated dependencies [b624ef0]
  - @rocketh/node@0.19.9

## 2.0.8

### Patch Changes

- latest deps

## 2.0.7

### Patch Changes

- fix logs + latest rocketh

## 2.0.6

### Patch Changes

- add --reset + latest update

## 2.0.5

### Patch Changes

- fix template

## 2.0.4

### Patch Changes

- 19dc401: packagesWithLogsEnabled

## 2.0.3

### Patch Changes

- e6823ad: compile with build-profile = "production" by default

## 2.0.2

### Patch Changes

- fix: dash characters in generated export names

## 2.0.1

### Patch Changes

- use zod 3 to ensure compatibility with hardhat

## 2.0.0

### Patch Changes

- 5fa4f8c: template init
- f7879a5: latest deps
- 5640f60: force the type for artifact so typescript does not need to infer (which cause issue on large artifact files)
- 87d94b0: update deps
- 2f1b2dd: option to not default on test mnemonic
- 03ce716: ensure metadata source is inlined
- ca222c5: use latest rocketh breaking changes
- 11753ee: rocketh v 0.15.0
- ad30f52: fix
- 290af75: latest rocketh
- cdd83db: fix windows
- 806d571: fix
- 333a5b2: auto impersonate on edr node
- 0ad6026: We transform dash into underscore as dash are not supported everywhwre in env var names
- ac6ab32: dependencies cleanup
- 56722fc: use latest deps
- cd2723b: latest rocketh
- d93b262: latest deps
- 9726486: latest rocketh
- 3de1c5f: use rocketh 0.11.x
- 342e21a: use RPC set via env variable or secret
- 9b19170: change config + upgrade to latest hardhat
- 22cd6a9: use latest rocketh
- 6e3c40d: update README
- adbe641: generate types too if ts output is chosen
- cda6a68: use log level 3 by default
- 1836c0f: latest deps
- 92c058b: fix
- ca30ae5: update deps
- 0ec29c9: update to latest hardhat
- 347c4e0: hardhat@3.0.0-next.2
- 63e0d5b: latest rocketh
- 9a2286b: fix postinstall
- 2e59725: generate abi value too
- 07ceeb7: latest rocketh
- 0805d80: add --tags
- 415ea5f: latest rocketh
- b0988a4: update rocketh + fix peer deps
- 45f5339: allow to add non edr network
- af4e6b7: fix
- 51ba855: update latest hardhat v3
- 875a4ba: latest rocketh
- 5a2265d: latest deps
- 099ca58: latets rocketh
- 77fdd83: hardhat v2 detector
- fd69fb1: latest deps
- d787f74: better org for generated artifacts
- 7defe0a: ci fix
- 661de7c: fixes + docs
- 3a06352: fix
- 62c56e2: fix logger
- 36e44b4: update latest rocketh
- 3b81c82: use latest rocketh
- 874b01d: use hardhat 3.0.0
- d93918d: use latest rocketh
- 147005d: latest rocketh + hardhat
- 7ddad15: better type generator for artifact and Abi + allow to provide hre connection manually when using loadEnvironmentFromHardhat
- ad2ecb6: fix: update type gen
- 1dfe4a4: update deps
- 23186a8: fix + add polling-interval and report-gas-used option
- 617337e: detect op chains
- 50bbc8c: u[pdate rocketh
- 771fb4c: latest rocketh with network specific data
- 0cdaca5: do not generate artifacts with empty bytecode
- 64188cd: forgot to build?
- 3cfb3b8: fix postinstall
- 13e536b: update rocketh latest
- 8a8254d: latest hardhat
- 6eeaa97: fix
- e1b2f6d: update rocketh
- b811936: fix typing
- c0cb4a3: fix : was not reading generateTypedArtifacts config
- 0d13e39: fix
- d130dea: fix
- 6f2d245: use latest rocketh
- 099f263: use latest rocketh
- 6f10af7: hardhat-deploy-for-hardhat-v2

## 2.0.0-next.80

### Patch Changes

- fix + add polling-interval and report-gas-used option

## 2.0.0-next.79

### Patch Changes

- latets rocketh

## 2.0.0-next.78

### Patch Changes

- latest deps

## 2.0.0-next.77

### Patch Changes

- 0cdaca5: do not generate artifacts with empty bytecode
- b811936: fix typing

## 2.0.0-next.76

### Patch Changes

- use latest rocketh

## 2.0.0-next.75

### Patch Changes

- latest rocketh + hardhat

## 2.0.0-next.74

### Patch Changes

- generate abi value too

## 2.0.0-next.73

### Patch Changes

- latest deps

## 2.0.0-next.72

### Patch Changes

- auto impersonate on edr node

## 2.0.0-next.71

### Patch Changes

- ac6ab32: dependencies cleanup

## 2.0.0-next.70

### Patch Changes

- fix postinstall

## 2.0.0-next.69

### Patch Changes

- fix postinstall

## 2.0.0-next.68

### Patch Changes

- hardhat v2 detector

## 2.0.0-next.67

### Patch Changes

- latest deps

## 2.0.0-next.66

### Patch Changes

- ci fix

## 2.0.0-next.65

### Patch Changes

- fix

## 2.0.0-next.64

### Patch Changes

- update deps

## 2.0.0-next.63

### Patch Changes

- update README

## 2.0.0-next.62

### Patch Changes

- template init

## 2.0.0-next.61

### Patch Changes

- force the type for artifact so typescript does not need to infer (which cause issue on large artifact files)

## 2.0.0-next.60

### Patch Changes

- use log level 3 by default

## 2.0.0-next.59

### Patch Changes

- fix logger

## 2.0.0-next.58

### Patch Changes

- 56722fc: use latest deps

## 2.0.0-next.57

### Patch Changes

- fix : was not reading generateTypedArtifacts config

## 2.0.0-next.56

### Patch Changes

- update rocketh + fix peer deps

## 2.0.0-next.55

### Patch Changes

- latest rocketh

## 2.0.0-next.54

### Patch Changes

- update latest rocketh

## 2.0.0-next.53

### Patch Changes

- latest deps

## 2.0.0-next.52

### Patch Changes

- forgot to build?

## 2.0.0-next.52

### Patch Changes

- fixes + docs

## 2.0.0-next.51

### Patch Changes

- We transform dash into underscore as dash are not supported everywhwre in env var names

## 2.0.0-next.50

### Patch Changes

- detect op chains

## 2.0.0-next.49

### Patch Changes

- option to not default on test mnemonic

## 2.0.0-next.48

### Patch Changes

- fix

## 2.0.0-next.47

### Patch Changes

- use RPC set via env variable or secret

## 2.0.0-next.46

### Patch Changes

- rocketh v 0.15.0

## 2.0.0-next.45

### Patch Changes

- fix

## 2.0.0-next.44

### Patch Changes

- better org for generated artifacts

## 2.0.0-next.43

### Patch Changes

- fix

## 2.0.0-next.42

### Patch Changes

- better type generator for artifact and Abi + allow to provide hre connection manually when using loadEnvironmentFromHardhat

## 2.0.0-next.41

### Patch Changes

- allow to add non edr network

## 2.0.0-next.40

### Patch Changes

- latest rocketh

## 2.0.0-next.39

### Patch Changes

- fix

## 2.0.0-next.38

### Patch Changes

- latest deps

## 2.0.0-next.37

### Patch Changes

- use latest rocketh

## 2.0.0-next.36

### Patch Changes

- use latest rocketh

## 2.0.0-next.35

### Patch Changes

- use latest rocketh

## 2.0.0-next.34

### Patch Changes

- use latest rocketh breaking changes

## 2.0.0-next.33

### Patch Changes

- update deps

## 2.0.0-next.32

### Patch Changes

- use hardhat 3.0.0

## 2.0.0-next.31

### Patch Changes

- fix: update type gen

## 2.0.0-next.30

### Patch Changes

- latest hardhat

## 2.0.0-next.29

### Patch Changes

- update latest hardhat v3

## 2.0.0-next.28

### Patch Changes

- change config + upgrade to latest hardhat

## 2.0.0-next.27

### Patch Changes

- fix windows

## 2.0.0-next.26

### Patch Changes

- update to latest hardhat

## 2.0.0-next.25

### Patch Changes

- add --tags

## 2.0.0-next.24

### Patch Changes

- update deps

## 2.0.0-next.23

### Patch Changes

- hardhat-deploy-for-hardhat-v2

## 2.0.0-next.22

### Patch Changes

- latest rocketh

## 2.0.0-next.21

### Patch Changes

- latest rocketh

## 2.0.0-next.20

### Patch Changes

- fix

## 2.0.0-next.19

### Patch Changes

- latest rocketh with network specific data

## 2.0.0-next.18

### Patch Changes

- hardhat@3.0.0-next.2

## 2.0.0-next.17

### Patch Changes

- u[pdate rocketh

## 2.0.0-next.16

### Patch Changes

- fix

## 2.0.0-next.15

### Patch Changes

- latest rocketh

## 2.0.0-next.14

### Patch Changes

- adbe641: generate types too if ts output is chosen
- d93918d: use latest rocketh

## 2.0.0-next.13

### Patch Changes

- use rocketh 0.11.x

## 2.0.0-next.12

### Patch Changes

- latest rocketh

## 2.0.0-next.11

### Patch Changes

- latest rocketh

## 2.0.0-next.10

### Patch Changes

- ensure metadata source is inlined

## 2.0.0-next.9

### Patch Changes

- fix

## 2.0.0-next.8

### Patch Changes

- update rocketh

## 2.0.0-next.7

### Patch Changes

- update rocketh latest
