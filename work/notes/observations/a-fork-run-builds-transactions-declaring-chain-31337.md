---
title: 'A fork run takes its chain IDENTITY from `chains[31337]`, so it builds transactions declaring chainId 31337 even when the node says 1'
type: observation
status: spotted
spotted: 2026-08-27
---

# The chain

Five links, each verified in the code:

1. `idToFetch = fork ? 31337 : chainId` (`packages/rocketh/src/executor/index.ts:193`).
2. `chainConfig = getChainConfigFromUserConfig(config, idToFetch, provider)`, so a fork reads the `chains[31337]` bucket.
3. `chainInfo = chainConfig.info`, and `getChainConfigFromUserConfig` returns `chainConfig?.info || defaultChainInfo` where both carry `id: id`, the id it was ASKED for. The provider is never consulted for the id (`packages/rocketh/src/environment/chains.ts:85-110`).
4. `resolveExecutionParams` returns `chain: chainInfo`, which becomes `env.network.chain`.
5. `execute` and `tx` both build `chainId: \`0x${env.network.chain.id.toString(16)}\`` (`packages/rocketh-read-execute/src/index.ts:319`and`:382`).

So on ANY fork run, `env.network.chain.id` is 31337 and every transaction rocketh builds declares chain 31337, no matter what the node reports.

# Why it has never bitten anyone

The only code that can currently produce a fork is `packages/hardhat-deploy/src/helpers.ts`, and hardhat's simulated network also reports 31337 (`resolveEdrNetwork` defaults `chainId` to 31337 and the forking config never feeds it). Declared and actual agree, so nothing fails.

**anvil does not agree.** Forking mainnet, anvil reports chain id 1, verified live against its banner and `eth_chainId`. A fork run against anvil would therefore sign and submit transactions declaring 31337 to a node that believes it is chain 1. For a node-signed transaction (`eth_sendTransaction`) the node generally fills its own id and the field is ignored; for a LOCALLY signed one (`signerOnly`, which is what the `privateKey` protocol returns) the signature commits to 31337 and the node should reject it.

That makes this a trap laid specifically for the `--fork` CLI path, which does not exist yet and whose whole point is attaching to a node the user started, most often anvil. It is the same shape as the `saveDeployments` trap already recorded in `what-fork-actually-does-today.md`: not a live bug, and waiting precisely where the next feature will step.

# The second half: `chains[31337]` is the user's LOCALHOST bucket

The identity is only one of three things that lookup supplies. The same `actualChainConfig` also provides the connection (`rpcUrl`, hence the provider) and every piece of policy and semantics: `deterministicDeployment`, `onUnknownSigner`, `autoImpersonate`, `confirmationsRequired`, `autoMine`, and the environment `tags`.

`chains[31337]` is where a user configures their LOCAL DEV NODE. So a rehearsal against a fork of mainnet silently runs with the settings the user wrote for localhost. Tags are the sharpest edge, because deploy scripts branch on them: a script that takes a shortcut under a `local` tag would take that shortcut during what the user believes is a mainnet rehearsal. This is worse than the missing-mainnet-settings half of the same bug, because it is not an absence, it is a different configuration actively applied.

# What this suggests about what `fork` IS

Worth writing down because it reframes the fix. Take the fork mechanism away and configure the same run by hand:

```ts
environments: {
  'mainnet-fork': {chain: 1, overrides: {rpcUrl: 'http://localhost:8545'}},
}
```

That already works today and gets almost everything right: the run's chain id is 1, the semantics come from `chains[1]`, the connection goes to the local node, and the identity check passes against anvil. What it does NOT do is read mainnet's deployment records, because the environment is named `mainnet-fork` and deployment records are per environment name.

So the one thing `{fork: 'mainnet'}` fundamentally buys is: **be the `mainnet` environment for the purposes of deployment RECORDS, while not being mainnet for the purposes of chain identity.** Everything else it currently does to the run (borrowing localhost's settings, borrowing localhost's identity) is incidental, and is what this note is about.
