# @rocketh/playground

## 0.0.6

### Patch Changes

- Updated dependencies [916507d]
- Updated dependencies [443c031]
  - @rocketh/proxy@0.19.23
  - @rocketh/deploy@0.19.17
  - @rocketh/core@0.19.12
  - rocketh@0.19.19
  - @rocketh/read-execute@0.19.12
  - @rocketh/signer@0.19.12
  - @rocketh/web@0.19.20

## 0.0.5

### Patch Changes

- Updated dependencies [1973f4f]
- Updated dependencies [753705b]
- Updated dependencies [7fdb319]
- Updated dependencies [400ece3]
- Updated dependencies [ad03283]
- Updated dependencies [f7fe1c8]
- Updated dependencies [8547e39]
  - @rocketh/deploy@0.19.16
  - rocketh@0.19.18
  - @rocketh/proxy@0.19.22
  - @rocketh/core@0.19.11
  - @rocketh/web@0.19.19
  - @rocketh/read-execute@0.19.11
  - @rocketh/signer@0.19.11

## 0.0.4

### Patch Changes

- 42d7ff6: Publish internal peer dependencies as `^` ranges instead of exact versions.

  Every internal peer was declared `workspace:*`, which pnpm replaces at publish time with the exact version of the peer as it stood at that moment. `@rocketh/export@0.19.19` therefore shipped `peerDependencies: {"@rocketh/node": "0.19.18", "rocketh": "0.19.17"}`, and upgrading that one package forced a consumer to move `@rocketh/node`, `rocketh`, and then everything else pinning the same pair (`hardhat-deploy`, the proxy, router and verifier packages) in a single lockstep step. They are now `workspace:^`, which publishes as `^0.19.18` / `^0.19.17`, meaning `>=0.19.17 <0.20.0`: patch drift inside the 0.19 line is allowed, 0.20.0 is still refused.

  The floor is unchanged, and that is the point. An exact pin and a caret share the same lower bound; they differ only in the ceiling, and a ceiling of "exactly the version that happened to be newest when this package was published" encodes publish timing rather than a compatibility fact. `updateInternalDependencies: "patch"` re-pins these on every release, so the pinned number moved even when the peer's API did not. The caret keeps the lower bound that actually carries meaning (a package needing a fix from its peer still refuses anything older) and drops the upper bound that never did.

  Nine entries across eight packages changed: `hardhat-deploy` (`@rocketh/node`, `rocketh`), `@rocketh/doc` (`@rocketh/node`), `@rocketh/export` (`@rocketh/node`, `rocketh`), `@rocketh/node` (`rocketh`), `@rocketh/playground` (`rocketh`), `@rocketh/test-utils` (`rocketh`), `@rocketh/verifier` (`@rocketh/node`), `@rocketh/web` (`rocketh`). Each consumes named function or type exports of its peer rather than subclassing it, checking `instanceof` against it, or sharing module-level state with it, so none of them requires a single exact peer build. `@rocketh/viem`'s `viem: ^2.45.0` is external and was already a range.

  **What this does NOT do.** Already-published versions keep the exact pins baked into their published `package.json`, and nothing can retroactively widen them. This only takes effect for versions published from this release onward. A project currently stuck on the cascade does not get unstuck by this change alone: it has to re-resolve onto releases that carry the new ranges, which in practice means upgrading the affected rocketh packages once more, after which single-package upgrades within the 0.19 line stop dragging the rest along.

  Two related exact pins are deliberately left alone here and reported separately, because both change installation rather than only the peer constraint. `hardhat-deploy` declares `@rocketh/node` and `rocketh` as regular `dependencies` as well as peers, and a regular dependency pinned exact still forces a specific build, so widening only its peer does not by itself remove `hardhat-deploy` from the cascade. `@rocketh/core` is a regular `workspace:*` dependency of nearly every package and likewise publishes exact, so packages of different vintages can pull in several copies of it.

- c084d4a: Follow the `embedded-eth-node` rename to `webevm`.

  The in-browser EVM the playground runs deploy scripts against was republished under a new name: `embedded-eth-node@0.4.0` is now `webevm@0.5.0`, from `github.com/wighawag/webevm`. The dependency, the import in `core/chain.ts`, the Vite external patterns and the prose references all move across.

  It is a rename and nothing more, which was checked rather than assumed: normalising the package name in the published `dist/*.js` of both versions makes them byte-identical, the export subpaths (`.`, `./revm`, `./worker-entry`, `./worker-host`, `./worker-client`) match, `createNode` and `SlimNode` are still the entry points, and the `.d.ts` differences are confined to doc comments naming the package.

  The one behavioural consequence is the default IndexedDB database name, which follows the package name from `'embedded-eth-node'` to `'webevm'`. That only matters to a browser app relying on the default, and `@rocketh/web` keeps its own default of `'rocketh'`, so the two still do not collide. The comment in `@rocketh/web`'s `createIndexedDBPersistence` that cited the old default is corrected.

  The version floor is unchanged in substance: `webevm@0.5.0` continues the version line, so the `>= 0.4.0` requirement (for an `eth_estimateGas` that returns a usable gas limit rather than gas consumed, which the deterministic `CREATE2` deploy depends on) is now `>= 0.5.0`.

- Updated dependencies [42d7ff6]
  - @rocketh/web@0.19.18
  - @rocketh/deploy@0.19.15
  - @rocketh/proxy@0.19.21

## 0.0.3

### Patch Changes

- Updated dependencies [5266a61]
  - rocketh@0.19.17
  - @rocketh/web@0.19.17
  - @rocketh/deploy@0.19.15
  - @rocketh/proxy@0.19.21

## 0.0.2

### Patch Changes

- 3c39ea4: First real release of the documentation playground: a `<rocketh-playground>` custom element that boots an EVM in the reader's browser and walks four real rocketh deploy scripts, deploying a contract behind a proxy, exposing the bug a constructor cannot avoid, upgrading the implementation, and showing that an upgrade replaces code rather than storage.

  The `0.0.0` on the registry was published by hand to bootstrap npm Trusted Publishing, which cannot create a new package. This is the first version to carry the actual widget.

## 0.0.1

### Patch Changes

- fc32289: Add `@rocketh/playground`: a Run button for the documentation that deploys a real contract to a real EVM in the reader's browser.

  rocketh's central claim is that its core is framework-agnostic and browser-capable (ADR-0002). This makes that claim runnable: pressing **Run** on a docs page boots an EVM in the reader's tab, executes a real deploy script through the real `@rocketh/deploy` and `@rocketh/proxy` packages, and streams back what the script printed and what it saved. No wallet, no node, no network.

  The package is two layers with a hard seam between them. `@rocketh/playground` is the framework-free core (EVM lifecycle, deployment store, module registry, log stream); it has no DOM in it and runs unchanged under node, which is why the deploy pipeline is covered by headless tests rather than only by a browser runner. `@rocketh/playground/element` is a Svelte 5 component compiled to the `<rocketh-playground>` CUSTOM ELEMENT, so the same widget drops into the VitePress (Vue) docs today, a Svelte site later, or a plain HTML README demo, with no per-framework wrapper and no coupling to VitePress.

  A run is only reported as successful when there is real runtime CODE at every recorded address. This is the failure worth catching rather than an address existing: a proxy deployed over a missing implementation records its address quite happily and then answers `0x` to every call.

  The deploy script's `console.log` output is captured into the log stream and shown as the script's own lines, rather than being replaced by a synthetic success message. Showing a reader "deployment succeeded" instead of what the script actually said would misrepresent the thing the widget exists to demonstrate.

  The playground declares its own chain in the rocketh config. `getChainConfigFromUserConfig` writes `chain with id <id> has no public info` to `console.error` for any chain it does not recognise, which every local chain is, and with console capture on that painted a red failure line through the middle of a successful run. Declaring the chain removes the message at its source instead of filtering the text out downstream.

  The `GreetingsRegistry` artifact is vendored rather than pulled from `template-ethereum-contracts`, which declares six `@rocketh/*` packages as dependencies pinned to published `^0.17.x`: installing it would put a second copy of those next to this workspace's own, and the deploy script's extensions would then close over a different `Environment` than the executor builds. Vendoring also cuts the artifact from ~946KB to ~14KB, which matters on a documentation page. Precedent: ADR-0003.

  Requires `embedded-eth-node` 0.4.0 or later, whose `eth_estimateGas` returns a usable gas limit; earlier versions returned gas consumed, which silently reverted the inner `CREATE2` behind the deterministic implementation deploy.

- 177442b: Turn the playground into a stepped tutorial that upgrades a proxy in front of the reader.

  The Run button became four steps against ONE chain and ONE deployment store: deploy `GreetingsRegistry` behind a proxy, write a greeting and watch it come back missing its prefix, upgrade the same proxy to a fixed implementation, then write another greeting and watch the new one get the prefix while the old one keeps its old value. An upgrade replaces code, not storage, and it changes what happens next rather than rewriting what already happened.

  `Playground` is now a session rather than a one-shot run. `run()` is replaced by `runNextStep()` plus `reset()`, and the chain outlives a step, which is the whole point: step 3 has to find the proxy step 1 deployed. A failed step deliberately does not advance, so pressing again retries it. Steps are nothing but deploy-script modules, including the two that only make a call, so the tutorial never shows a reader a kind of code that rocketh does not actually have.

  `PlaygroundDeployment` gained `changedAtStep` alongside `change`. `change` is relative to the PREVIOUS step, which makes it transient: the implementation reads `changed` during the upgrade and `unchanged` on the very next click, so a panel built on it alone loses the moment that carries the lesson. `changedAtStep` lets the UI keep saying the proxy has held its address since step 1 while the implementation has only held its own since step 3.

  Adds `GreetingsRegistryV2`, the second implementation, with its Solidity source in `contracts/` and a `contracts:compile` script that shells out to `solc` rather than adding a 9MB compiler to everyone's install (the same approach `artifact:sync` already takes with `npm` and `tar`). Artifacts stay committed, so solc is needed only to change a contract. v1's artifact is still vendored verbatim from the published template, bug included, so its provenance stays "the real template contract"; v2 is ours because the template has no v2, and its source is in the repo so the code the tutorial shows is provably the code it runs.

  v2 demonstrates the storage rule it depends on: `_prefixInitialized` is APPENDED at slot 2, leaving `_prefix` and `messages` exactly where v1 put them, because the proxy keeps its storage across the upgrade and the new code reads the old slots.

  The browser suite grew a terminal scrolling test. Four steps produce far more output than one, and the terminal is a fixed height, so the tail has to stay visible without the reader chasing it; that is hard to check by hand on a phone and easy to assert here.

- Updated dependencies [6c7aee3]
- Updated dependencies [ec0050e]
  - rocketh@0.19.16
  - @rocketh/web@0.19.16
  - @rocketh/deploy@0.19.15
  - @rocketh/proxy@0.19.21
