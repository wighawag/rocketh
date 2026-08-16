---
'@rocketh/playground': minor
---

Turn the playground into a stepped tutorial that upgrades a proxy in front of the reader.

The Run button became four steps against ONE chain and ONE deployment store: deploy `GreetingsRegistry` behind a proxy, write a greeting and watch it come back missing its prefix, upgrade the same proxy to a fixed implementation, then write another greeting and watch the new one get the prefix while the old one keeps its old value. An upgrade replaces code, not storage, and it changes what happens next rather than rewriting what already happened.

`Playground` is now a session rather than a one-shot run. `run()` is replaced by `runNextStep()` plus `reset()`, and the chain outlives a step, which is the whole point: step 3 has to find the proxy step 1 deployed. A failed step deliberately does not advance, so pressing again retries it. Steps are nothing but deploy-script modules, including the two that only make a call, so the tutorial never shows a reader a kind of code that rocketh does not actually have.

`PlaygroundDeployment` gained `changedAtStep` alongside `change`. `change` is relative to the PREVIOUS step, which makes it transient: the implementation reads `changed` during the upgrade and `unchanged` on the very next click, so a panel built on it alone loses the moment that carries the lesson. `changedAtStep` lets the UI keep saying the proxy has held its address since step 1 while the implementation has only held its own since step 3.

Adds `GreetingsRegistryV2`, the second implementation, with its Solidity source in `contracts/` and a `contracts:compile` script that shells out to `solc` rather than adding a 9MB compiler to everyone's install (the same approach `artifact:sync` already takes with `npm` and `tar`). Artifacts stay committed, so solc is needed only to change a contract. v1's artifact is still vendored verbatim from the published template, bug included, so its provenance stays "the real template contract"; v2 is ours because the template has no v2, and its source is in the repo so the code the tutorial shows is provably the code it runs.

v2 demonstrates the storage rule it depends on: `_prefixInitialized` is APPENDED at slot 2, leaving `_prefix` and `messages` exactly where v1 put them, because the proxy keeps its storage across the upgrade and the new code reads the old slots.

The browser suite grew a terminal scrolling test. Four steps produce far more output than one, and the terminal is a fixed height, so the tail has to stay visible without the reader chasing it; that is hard to check by hand on a phone and easy to assert here.
