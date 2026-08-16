# @rocketh/playground

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
