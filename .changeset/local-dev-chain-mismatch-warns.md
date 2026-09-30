---
'rocketh': patch
---

An environment that declares a local development chain (31337 or 1337) no longer refuses to start when its node reports a different chain id: it warns and continues with the node's id, as before 0.23.0. This restores the common workflow of using `anvil --fork-url <network>` as `localhost` with the project template's `localhost: {chain: 31337}`, which 0.23.0 broke (anvil keeps the forked network's id). The node is on your own machine, so the refusal protected nothing there. Every other environment still refuses a mismatch off a fork, and that error now lists its fixes more clearly.
