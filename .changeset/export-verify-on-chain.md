---
'@rocketh/export': patch
---

Add `--verify`, an opt-in check that the deployments being exported are really on the chain.

The generated file is the consuming app's source of truth for addresses, and export builds it from FILES. Nothing in that path can notice that a record is stale, that the chain it describes was reset, or that the environment being exported is not the network the app will connect to. The symptom shows up much later, as a user's transaction reverting against an address that holds no code.

`rocketh-export -e sepolia --verify` (or `run(config, env, {verify: true})`) asks the chain two questions before writing anything:

- **the chain id the RPC reports matches the one recorded for this environment**, which catches exporting `localhost` while pointed at a testnet and vice versa;
- **every exported address has code**, which catches a record kept from a chain that was since reset, a deployment that never landed, and an address edited by hand.

**It is opt-in, and it stays opt-in.** Export reads files and writes files, so it runs with no network at all, and a CI web build depends on exactly that: a default that reached for an RPC would break every offline build. There is a test asserting that a plain export makes zero provider calls, so the property is pinned rather than promised.

Behaviour when it fails: nothing is written, and the previous output is left alone, because a half-verified file is worse than an old one, since it looks current. Every offending contract is named in one message rather than one per run. A wrong chain id is reported as a **single** cause and stops there, because on the wrong network every address also reports no code, and a page of consequences buries the one thing that is wrong. An unreachable node fails the export rather than silently skipping the checks: `--verify` was asked for explicitly, and "could not check" is not "checked".

A provider can be passed to `run()` directly for a caller that already has a connection; otherwise one is built from the chain's `rpcUrl`, and an environment with neither says so rather than exporting unverified output while looking verified.

Deliberately **not** compared: deployed bytecode against the record's. Immutables and library links legitimately differ from the artifact, so that check needs a tolerance model of its own, and a false alarm there would teach people to never pass the flag.
