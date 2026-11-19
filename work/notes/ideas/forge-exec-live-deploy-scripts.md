---
title: 'Run the TypeScript deploy scripts live inside forge test, through forge-exec'
type: idea
status: incubating
created: 2026-11-19
---

# Running deploy scripts inside forge's EVM, not handing their result over

`forge-exec` (a sibling project, `../forge-exec`) runs an external program from a forge test or script and keeps a two-way channel open to it: through `ffi` and an IPC client binary, the program can ask forge to create, create2, call, static-call and send, and read balance, code, block data and the chain id, inside forge's own EVM. In principle rocketh's deploy scripts could run in a test's `setUp()` that way, with no fixture to generate and nothing to keep current.

Why it is only an idea:

- Its channel is a small set of operations, not an EIP-1193 provider. rocketh's scripts talk EIP-1193 (receipts, logs, `eth_getTransactionCount`, impersonation, fee estimation), so they cannot run on it unchanged, and an adapter would have to emulate a node on top of it.
- It needs `ffi = true`, which lets any test run any command, and an external binary on the PATH.
- It has not been released since 2024.

The supported route is the generated hand-off of spec `deployments-in-solidity` (ADR 0018). Revisit if forge gains a way to expose its EVM as a provider, or if a fixture proves too slow or too stale in practice.
