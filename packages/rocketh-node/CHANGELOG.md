# @rocketh/node

## 0.19.14

### Patch Changes

- 0397afa: **New refusal:** the confirm prompt now fails with a clear message when stdin is not a terminal, instead of hanging. `prompts@2.4.2` against a non-TTY stdin never settles (`/dev/null` exits the process silently, an open pipe hangs for ever), which is why the text ability is already withheld without a TTY. The confirm could not take that route: nothing branches on `prompt` being present, and both call sites (the `--reset` confirmation and the gas-price confirmation, both behind `askBeforeProceeding`) read "not confirmed" as `exit()`, so silently answering would either destroy deployments nobody agreed to destroy or abort a run for a question nobody was asked. The error names the question it could not ask and points at `--skip-prompts`, which skips every confirmation.
- 9b46130: `createNodePromptExecutor().prompt` now reads the confirm answer keyed by `request.name` (as its sibling `promptText` already did) instead of a fixed `.proceed` key. A confirm named anything other than `proceed` previously read `undefined` and was treated as "do not proceed", silently exiting the run. Both current call sites pass `proceed`, so this is behaviour-identical today. An aborted confirm (Ctrl-C, where `prompts` resolves with the key absent) now reports `{proceed: false}` rather than `{proceed: undefined}`.
- 0692a33: The deploy-script EXECUTE path now builds its prompt executor per call, matching the environment-only loader, so both entry points into `@rocketh/node` decide the text capability from the stdin of the run rather than from stdin at import time. No behaviour change for the CLI or for hardhat-deploy's deploy task (a process's stdin does not become a terminal later, and both already call the same function); it matters for an embedder that imports the module and runs deployments in-process, which could previously observe one capability on the environment path and another on the execute path for the same stdin. A caller-supplied `ExecutionParams.promptExecutor` still wins over both.
- Updated dependencies [6ea32f1]
- Updated dependencies [1a583b2]
- Updated dependencies [c833bda]
  - rocketh@0.19.13
  - @rocketh/core@0.19.9

## 0.19.13

### Patch Changes

- a5db88c: Add the `'ask'` unknown-signer policy and the interactive resolver at the broadcast seam.

  `onUnknownSigner` is now `'throw' | 'ask' | 'auto'`, and `'auto'` (still the default) is CAPABILITY-AWARE: it resolves to `'ask'` where the run can ask a human for text (`env.canPromptForText()`, i.e. a `PromptExecutor` implementing `promptText`) and to `'throw'` where it cannot. Capability is a CEILING, so an explicit `'ask'` also degrades to `'throw'` without a prompt. `@rocketh/node` now supplies its `promptText` ONLY when stdin is a terminal, so a CI run (whose stdin is not) simply has no text capability and takes the throw path: it never prompts and never hangs. The gate lives in the runtime rather than in `canPromptForText()`, which stays pure method presence (ADR 0007), because `prompts` asked a question with no terminal behind it never settles and never rejects (measured in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`).

  Under `'ask'`, a transaction whose `from` is unsignable PAUSES: rocketh presents the exact transaction (the undegraded `UnknownSignerError` message), the user executes it out-of-band on their Safe and pastes the resulting transaction hash, and the run CONTINUES through the same pending-transaction pipeline a normal broadcast uses, returning a real receipt with no send RPC attempted. Because the resolver resolves instead of throwing, a multi-step governed action pauses at each unsignable step and completes in ONE run. The pasted hash is registered with the transaction-hash tracker, so gas reporting does not omit an externally-executed transaction. A hash this node has never heard of is looked up for a bounded number of rounds and then reported as NOT FOUND rather than polled for ever, and a receipt without a successful status fails loudly, naming both the transaction and the pasted hash; neither saves anything. The receipt fetched to check that is handed to the pipeline, so one pasted transaction is waited for once.

  Answering "cannot sign" (or pressing enter, aborting the prompt, or failing to paste a valid hash) degrades to the existing defer workflow: the full transaction is printed and the same `UnknownSignerError` is thrown, still caught by `catchUnknownSigner`. Signable accounts are entirely unaffected — the policy is still consulted only inside the `unsignable` branch, so `local`, `node` and `impersonated` accounts broadcast exactly as before, and a pre-signed `raw` transaction never reaches the seam. `@rocketh/unknown-signer` only gains doc-comment corrections now that `'ask'` exists.

- 9319520: Make the unknown-signer policy reachable from the shell and settable once for every chain.
  - **New CLI option on both CLIs:** `rocketh --on-unknown-signer <throw|ask|auto>` and `hardhat deploy --on-unknown-signer <throw|ask|auto>`. Previously the only run-level lever was the programmatic `ExecutionParams.onUnknownSigner`, so there was no way to say "not interactive, just this once" from a terminal. An invalid value is rejected by name rather than silently passed through, and omitting the flag leaves config in charge.
  - **Fix: `--skip-prompts` now also forces `throw`** on both CLIs. It is documented as "skip any prompts" but only ever silenced the reset and gas-price confirmations, which was harmless until the interactive resolver landed and made `'auto'` prompt by default on a TTY. It wins over an explicit `--on-unknown-signer ask`, since asking to be prompted and not prompted at once is a contradiction and not prompting is the safe half. (For hardhat-deploy this also covers an in-memory network, where `skipPrompts` is forced on and there is no Safe to execute anything on.)
  - **New top-level `onUnknownSigner` in `UserConfig`**, so a repo-wide default is one line instead of one per `chains[id]` entry. Full precedence is now run parameter (including the CLI flag) > chain config > top-level config > the built-in `'auto'`; a more specific setting always wins.

  Docs: `@rocketh/unknown-signer` is now documented primarily as an EXTENSION (spread it into `extensions` and call `catchUnknownSigner(() => …)` straight off the deploy-script environment, no `env` threading), with the curried `catchUnknownSigner(env)(…)` form shown for use outside a deploy script.

- 2797550: Carry a text-prompt CAPABILITY on the environment, on every construction path. `PromptExecutor` gains an OPTIONAL `promptText` method (returning `{value}` or `{cancelled: true}`) whose ABSENCE is the capability signal, and the prompt now rides `ExecutionParams.promptExecutor` (and its resolved form) — the same road `autoImpersonate` travels — so it reaches `createEnvironment` from the executor, from `loadEnvironmentFromStore` (the path hardhat-deploy takes, where no executor is in scope) and from the shared test harness alike. Environments expose the per-CAPABILITY predicate `env.canPromptForText()`, true only when a text prompt genuinely exists: a prompt object being present is not enough, since `@rocketh/web`'s confirm returns `{proceed: true}` without asking anyone. See `docs/adr/0007-prompt-capability-on-the-environment-not-the-executor.md`.

  `@rocketh/node` implements `promptText` (reading the answer keyed by `request.name`, as the `prompts` library returns it) and supplies its prompt on the hardhat-deploy path, so those runs carry the capability by default; a caller-supplied prompt still wins. `@rocketh/web` deliberately does not implement it. Purely additive and inert: nothing branches on the capability yet, and `onUnknownSigner` resolves and broadcasts exactly as before.

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

## 0.19.12

### Patch Changes

- Updated dependencies [09ea46d]
  - rocketh@0.19.11
  - @rocketh/core@0.19.7

## 0.19.11

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - rocketh@0.19.10

## 0.19.10

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - rocketh@0.19.9

## 0.19.9

### Patch Changes

- b624ef0: Fix the `repository.directory` field in package.json (was `packages/rocketh-ode`, now `packages/rocketh-node`).

## 0.19.8

### Patch Changes

- b2987d7: Do not include viem's default public RPC in a chain's `info.rpcUrls` by default.

  Previously, for every viem-known chain, rocketh merged viem's default public RPC
  endpoint (e.g. `https://<id>.rpc.thirdweb.com`) into `chains[id].info.rpcUrls`.
  That endpoint is rate-limited, can disappear, and was getting baked into
  serialized chain info (frontend exports, wallet "add network" data).

  Now, only an RPC url set explicitly in the config appears in `info.rpcUrls`; the
  required `default` entry is kept with an empty `http` list otherwise. Chain
  metadata (name, nativeCurrency, multicall3, block explorers, ...) is still always
  populated from viem. Deploying keeps working with zero config: viem's default RPC
  is still provided to the deploy path via the chain's top-level `rpcUrl`, so it is
  used but never serialized.

  Set the new top-level config flag `includeDefaultRPCUrlsInChainInfos: true` to
  restore the previous behavior of including viem's default RPC in `info.rpcUrls`.

  Also exposes `mergeChainConfig` from `@rocketh/node` (the pure per-chain merge
  used during config resolution).

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - rocketh@0.19.8

## 0.19.7

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3
  - rocketh@0.19.7

## 0.19.6

### Patch Changes

- Updated dependencies [e06b151]
  - rocketh@0.19.6

## 0.19.5

### Patch Changes

- c6fa24e: add reset + make loading deployment a separate step from createEnvionment
- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2
  - rocketh@0.19.5

## 0.19.4

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - rocketh@0.19.4
  - @rocketh/core@0.19.1

## 0.19.3

### Patch Changes

- Updated dependencies
  - rocketh@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies
  - rocketh@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies
  - rocketh@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - rocketh@0.19.0
  - @rocketh/core@0.19.0

## 0.18.8

### Patch Changes

- environment refactor for simpler extensions
- Updated dependencies
  - @rocketh/core@0.18.4
  - rocketh@0.18.7

## 0.18.7

### Patch Changes

- Updated dependencies
  - rocketh@0.18.6

## 0.18.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3
  - rocketh@0.18.5

## 0.18.5

### Patch Changes

- Updated dependencies
  - rocketh@0.18.4

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - rocketh@0.18.3

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - rocketh@0.18.2

## 0.18.2

### Patch Changes

- Updated dependencies
  - rocketh@0.18.1

## 0.18.1

### Patch Changes

- @rocketh/node add option to pass config in

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - rocketh@0.18.0
  - @rocketh/core@0.18.0

## 0.17.26

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17
  - rocketh@0.17.23

## 0.17.25

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16
  - rocketh@0.17.22

## 0.17.24

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15
  - rocketh@0.17.21

## 0.17.23

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14
  - rocketh@0.17.20

## 0.17.22

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - rocketh@0.17.19

## 0.17.21

### Patch Changes

- add metadata to packages
- Updated dependencies
  - rocketh@0.17.18
  - @rocketh/core@0.17.12

## 0.17.20

### Patch Changes

- add licenses
- Updated dependencies
  - rocketh@0.17.17
  - @rocketh/core@0.17.11

## 0.17.19

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/core@0.17.10
  - rocketh@0.17.16

## 0.17.18

### Patch Changes

- Updated dependencies [b765457]
  - rocketh@0.17.15

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
  - rocketh@0.17.14

## 0.17.16

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - rocketh@0.17.13

## 0.17.15

### Patch Changes

- use log level 3 by default

## 0.17.14

### Patch Changes

- fix logger

## 0.17.13

### Patch Changes

- add tsx back
- Updated dependencies
  - rocketh@0.17.12

## 0.17.12

### Patch Changes

- Updated dependencies
  - rocketh@0.17.11

## 0.17.11

### Patch Changes

- ensure import order for setting up logging

## 0.17.10

### Patch Changes

- f7a81d8: refactor logging
- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - rocketh@0.17.10

## 0.17.9

### Patch Changes

- Updated dependencies
  - rocketh@0.17.9

## 0.17.8

### Patch Changes

- Updated dependencies [e737031]
- Updated dependencies [f4431ed]
  - rocketh@0.17.8
  - @rocketh/core@0.17.6

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5
  - rocketh@0.17.7

## 0.17.6

### Patch Changes

- Updated dependencies
  - rocketh@0.17.6

## 0.17.5

### Patch Changes

- Updated dependencies
  - rocketh@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [dc5aefe]
  - rocketh@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies
  - rocketh@0.17.3

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- Updated dependencies [6642ece]
- Updated dependencies [c574413]
  - rocketh@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies
  - rocketh@0.17.1

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies [d67b01f]
  - rocketh@0.17.0

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - rocketh@0.17.0-next.0

## 0.16.0

### Minor Changes

- add @roceth/core

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.16.0

## 0.15.15

### Patch Changes

- fix

## 0.15.14

### Patch Changes

- auto-mine + faster import by caching

## 0.15.13

### Patch Changes

- forgot to build

## 0.15.12

### Patch Changes

- only export types from eip-1193

## 0.15.11

### Patch Changes

- reexport EIP-1193 types

## 0.15.10

### Patch Changes

- latest deps

## 0.15.9

### Patch Changes

- remove unecessary spinner

## 0.15.8

### Patch Changes

- fix tx nonce fetching

## 0.15.7

### Patch Changes

- proxy: do not merge docs from proxy contract

## 0.15.6

### Patch Changes

- proxy: add checkProxyAdmin and checkABIConflict + merge abi

## 0.15.5

### Patch Changes

- forgot to build

## 0.15.4

### Patch Changes

- megaeth exception not required anymore

## 0.15.3

### Patch Changes

- fix

## 0.15.2

### Patch Changes

- defaultChainProperties

## 0.15.1

### Patch Changes

- better message

## 0.15.0

### Minor Changes

- 851378e: revamp the settings to be allowed to configure per chain as well as per target

### Patch Changes

- 8122cdb: fix
- e6de720: fork
- 1f2e044: fixes + support old hardhat-deploy
- 9d920a8: fix
- c682fd2: canonical chain names export
- 0d7e7ed: fix export
- 691d296: fixes
- cb340e2: fix
- 2b82b5b: fix
- a0fcde6: fixes
- 356f26c: executeDeployScriptsDirectly is now executeDeployScripts
- 03f2406: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- 4d1a814: fix cli
- e260c6d: fix
- feb4780: context only to be provided

## 0.15.0-testing.17

### Patch Changes

- executeDeployScriptsDirectly is now executeDeployScripts

## 0.15.0-testing.16

### Patch Changes

- fix

## 0.15.0-testing.15

### Patch Changes

- context only to be provided

## 0.15.0-testing.14

### Patch Changes

- fixes

## 0.15.0-testing.13

### Patch Changes

- rname target to environment

## 0.15.0-testing.12

### Patch Changes

- canonical chain names export

## 0.15.0-testing.11

### Patch Changes

- fork

## 0.15.0-testing.10

### Patch Changes

- fix export

## 0.15.0-testing.9

### Patch Changes

- fixes

## 0.15.0-testing.8

### Patch Changes

- fix

## 0.15.0-testing.7

### Patch Changes

- revamp of types and resolution

## 0.15.0-testing.6

### Patch Changes

- fix

## 0.15.0-testing.5

### Patch Changes

- fix

## 0.15.0-testing.4

### Patch Changes

- fixes

## 0.15.0-testing.3

### Patch Changes

- fix

## 0.15.0-testing.2

### Patch Changes

- fix cli

## 0.15.0-testing.1

### Patch Changes

- fixes + support old hardhat-deploy

## 0.15.0-testing.0

### Minor Changes

- revamp the settings to be allowed to configure per chain as well as per target

## 0.14.9

### Patch Changes

- consolidate the export format + add ability to augment chain data with custom properties

## 0.14.8

### Patch Changes

- fix

## 0.14.7

### Patch Changes

- latest deps + fix eth_feeHistory

## 0.14.6

### Patch Changes

- network name default considered memory

## 0.14.5

### Patch Changes

- allow to configure polling interval + remove confirmation field from deployment data

## 0.14.4

### Patch Changes

- revert

## 0.14.2

### Patch Changes

- also setup for loadEnvironment (used by hardhat-deploy)

## 0.14.1

### Patch Changes

- fix type

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

## 0.13.4

### Patch Changes

- extension for loadAndExecuteDeployments

## 0.13.3

### Patch Changes

- fix waitForTransactionReceipt + handle missing earliest

## 0.13.2

### Patch Changes

- fix

## 0.13.1

### Patch Changes

- rename and allow for variable getters in env

## 0.13.0

### Minor Changes

- use env function for extended functions

## 0.12.1

### Patch Changes

- Merge branch 'feat/create3-support'

## 0.12.0

### Minor Changes

- switch to setup function

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
- 4d37f14: remove use of global, breakinmg change

## 0.11.22-testing.8

### Patch Changes

- fix

## 0.11.22-testing.7

### Patch Changes

- Extra type generic

## 0.11.22-testing.6

### Patch Changes

- fix

## 0.11.22-testing.5

### Patch Changes

- allow to pass Extra date to environment

## 0.11.22-testing.4

### Patch Changes

- fix

## 0.11.22-testing.3

### Patch Changes

- signer protocols are specified via config

## 0.11.22-testing.2

### Patch Changes

- use hard deps

## 0.11.22-testing.1

### Patch Changes

- fixes

## 0.11.22-testing.0

### Patch Changes

- remove use of global, breakinmg change

## 0.11.21

### Patch Changes

- allow minimal deployment info for read/execute

## 0.11.20

### Patch Changes

- use file:// import so it works on windows

## 0.11.19

### Patch Changes

- fix publicInfo for networks

## 0.11.18

### Patch Changes

- fixes + add basescan

## 0.11.17

### Patch Changes

- fix

## 0.11.16

### Patch Changes

- public chain info in config

## 0.11.15

### Patch Changes

- for convenience:support bigint but stringify it

## 0.11.14

### Patch Changes

- LinkedData + remove auto-json-convertion

## 0.11.13

### Patch Changes

- fix

## 0.11.12

### Patch Changes

- fix network specifics script folder

## 0.11.11

### Patch Changes

- actual fix

## 0.11.10

### Patch Changes

- fix

## 0.11.9

### Patch Changes

- 6d4e756: allow to specific data per network
- 82f6787: allow for specific deploy scripts folder per network
- 37e6a46: fix types

## 0.11.8

### Patch Changes

- fix

## 0.11.7

### Patch Changes

- deterministicDeployment fix

## 0.11.6

### Patch Changes

- fixes

## 0.11.5

### Patch Changes

- 4426c7d: remove .json config file + support custom deterministic deployment factory

## 0.11.4

### Patch Changes

- add default tags option for network

## 0.11.3

### Patch Changes

- 2431e8f: remove the use of context

## 0.11.2

### Patch Changes

- f2959f3: display <no-name>
- 169b618: migrations
- aaba9cb: allow to not save deployment + use it for diamond unamed artifact execution
- fee5656: upgradeIndex and numDeployments tracking

## 0.11.1

### Patch Changes

- release as v0.11.1

### Major Changes

- first alpha release

## 0.10.18

### Patch Changes

- fix chains import, no default export

## 0.10.17

### Patch Changes

- hardhat3-rocketh

## 0.10.16

### Patch Changes

- use tsx

## 0.10.15

### Patch Changes

- update latest esbuil

## 0.10.14

### Patch Changes

- latest dependencies

## 0.10.13

### Patch Changes

- forgot to build

## 0.10.12

### Patch Changes

- fixes for rocketh-doc and allow memory hardhat network to be used for it

## 0.10.11

### Patch Changes

- speicfy context from executor

## 0.10.10

### Patch Changes

- unnamedAccounts

## 0.10.9

### Patch Changes

- use pkgroll and @rocketh namespace

## 0.10.8

### Patch Changes

- add ancient8 to chains + export info via rocketh-export

## 0.10.7

### Patch Changes

- export eth utils like getGasPriceEstimate

## 0.10.6

### Patch Changes

- add info about network

## 0.10.5

### Patch Changes

- fix

## 0.10.4

### Patch Changes

- can skp report and prompts

## 0.10.3

### Patch Changes

- router allow extra abi

## 0.10.2

### Patch Changes

- report gas use

## 0.10.1

### Patch Changes

- ask before proceeding option

## 0.10.0

### Minor Changes

- read config always

## 0.9.2

### Patch Changes

- can reverse lookup named abi rom address

## 0.9.1

### Patch Changes

- use latest solidity-proxy

## 0.9.0

### Minor Changes

- get throw if deployment not found, add getOrNull

## 0.8.2

### Patch Changes

- attempt fix

## 0.8.1

### Patch Changes

- remove the need to pass chain

## 0.8.0

### Minor Changes

- use latest viem + add read

## 0.7.6

### Patch Changes

- type devdoc more leniant for older solc

## 0.7.5

### Patch Changes

- type devdoc more leniant for older solc

## 0.7.4

### Patch Changes

- use eip-1193-jsonrpc-provider new name

## 0.7.3

### Patch Changes

- fix

## 0.7.2

### Patch Changes

- use .chain file and include genesisHash

## 0.7.1

### Patch Changes

- use latest eip-1193-json-provider

## 0.7.0

### Minor Changes

- latest deps minus isomorphic-unfetch

## 0.6.20

### Patch Changes

- fix message indentation

## 0.6.19

### Patch Changes

- forgot to build

## 0.6.18

### Patch Changes

- show Contract Address

## 0.6.17

### Patch Changes

- fix deterministic deployment when already deployed + showMessage

## 0.6.16

### Patch Changes

- deterministic deployment via create2 factory

## 0.6.15

### Patch Changes

- confirmations for receipt

## 0.6.14

### Patch Changes

- simplify receipt

## 0.6.13

### Patch Changes

- add receipt to deployments

## 0.6.12

### Patch Changes

- forgot to build

## 0.6.11

### Patch Changes

- log using console if Logging level

## 0.6.10

### Patch Changes

- Option to skip esbuild-register

## 0.6.9

### Patch Changes

- add bytecode and linkedData to export

## 0.6.8

### Patch Changes

- better docs

## 0.6.7

### Patch Changes

- fix types

## 0.6.6

### Patch Changes

- fix types

## 0.6.5

### Patch Changes

- add rocketh-doc

## 0.6.4

### Patch Changes

- void spinner

## 0.6.3

### Patch Changes

- let deploy script accept arguments

## 0.6.2

### Patch Changes

- fix logging

## 0.6.1

### Patch Changes

- latest update + rocketh-router

## 0.6.0

### Minor Changes

- transaction field in deployment

## 0.5.18

### Patch Changes

- add loadEnvironment

## 0.5.17

### Patch Changes

- skip tx recovery when saveDeployments=false

## 0.5.16

### Patch Changes

- return environment instead of just deployments

## 0.5.15

### Patch Changes

- forgot to pass tx info

## 0.5.14

### Patch Changes

- add tx info in all case

## 0.5.13

### Patch Changes

- fixes

## 0.5.12

### Patch Changes

- fix

## 0.5.11

### Patch Changes

- better handling of pending tx

## 0.5.10

### Patch Changes

- show deploy name

## 0.5.9

### Patch Changes

- remove some log as we can't use ora

## 0.5.8

### Patch Changes

- remove ora

## 0.5.7

### Patch Changes

- use latest ora-cjs

## 0.5.6

### Patch Changes

- forgot to build

## 0.5.5

### Patch Changes

- fix

## 0.5.4

### Patch Changes

- use ora-cjs

## 0.5.3

### Patch Changes

- add logging

## 0.5.2

### Patch Changes

- fix

## 0.5.1

### Patch Changes

- 0.5.1
