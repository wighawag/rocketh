---
'@rocketh/playground': minor
---

Add `@rocketh/playground`: a Run button for the documentation that deploys a real contract to a real EVM in the reader's browser.

rocketh's central claim is that its core is framework-agnostic and browser-capable (ADR-0002). This makes that claim runnable: pressing **Run** on a docs page boots an EVM in the reader's tab, executes a real deploy script through the real `@rocketh/deploy` and `@rocketh/proxy` packages, and streams back what the script printed and what it saved. No wallet, no node, no network.

The package is two layers with a hard seam between them. `@rocketh/playground` is the framework-free core (EVM lifecycle, deployment store, module registry, log stream); it has no DOM in it and runs unchanged under node, which is why the deploy pipeline is covered by headless tests rather than only by a browser runner. `@rocketh/playground/element` is a Svelte 5 component compiled to the `<rocketh-playground>` CUSTOM ELEMENT, so the same widget drops into the VitePress (Vue) docs today, a Svelte site later, or a plain HTML README demo, with no per-framework wrapper and no coupling to VitePress.

A run is only reported as successful when there is real runtime CODE at every recorded address. This is the failure worth catching rather than an address existing: a proxy deployed over a missing implementation records its address quite happily and then answers `0x` to every call.

The deploy script's `console.log` output is captured into the log stream and shown as the script's own lines, rather than being replaced by a synthetic success message. Showing a reader "deployment succeeded" instead of what the script actually said would misrepresent the thing the widget exists to demonstrate.

The playground declares its own chain in the rocketh config. `getChainConfigFromUserConfig` writes `chain with id <id> has no public info` to `console.error` for any chain it does not recognise, which every local chain is, and with console capture on that painted a red failure line through the middle of a successful run. Declaring the chain removes the message at its source instead of filtering the text out downstream.

The `GreetingsRegistry` artifact is vendored rather than pulled from `template-ethereum-contracts`, which declares six `@rocketh/*` packages as dependencies pinned to published `^0.17.x`: installing it would put a second copy of those next to this workspace's own, and the deploy script's extensions would then close over a different `Environment` than the executor builds. Vendoring also cuts the artifact from ~946KB to ~14KB, which matters on a documentation page. Precedent: ADR-0003.

Requires `embedded-eth-node` 0.4.0 or later, whose `eth_estimateGas` returns a usable gas limit; earlier versions returned gas consumed, which silently reverted the inner `CREATE2` behind the deterministic implementation deploy.
