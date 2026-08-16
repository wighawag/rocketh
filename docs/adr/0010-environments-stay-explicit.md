# Environments stay explicit: no auto-populating them from viem's chain registry

`@rocketh/node` fills `config.chains` from viem's chain registry, so it would be a short step to also turn every canonical chain name into a ready-made environment, letting `rocketh -e sepolia` work with no config at all. That was tried and deliberately abandoned. An environment is named by the user, who says which chain it is.

## Why

Every auto-injected environment carries viem's PUBLIC default rpc endpoint. Those endpoints go stale and stop answering, and the url does not stay where it was put: `@rocketh/export` serializes chain info into frontend builds, so a dead public endpoint ended up shipped inside a web app. The problem was not the convenience, it was that the convenience quietly propagated an endpoint nobody chose into artifacts nobody re-checked.

`includeDefaultRPCUrlsInChainInfos` (default off, see `mergeChainConfig` in `packages/rocketh-node/src/executor/index.ts`) is the other half of the same lesson: viem's default rpc is available to the deploy path via the top-level `rpcUrl`, but is kept out of the serialized `info.rpcUrls` unless the user opts in.

A secondary benefit: a mistyped `-e sepolai` fails with `Could not find chainId for environment named "sepolai"`. Had every viem chain name been a valid environment, a typo that happened to land on a real chain name would instead have started talking to a public rpc for a chain the user never meant to touch.

## Consequences

Using a chain requires declaring an environment for it (`environments: {<name>: {chain: <id>}}`), which is one more step than a zero-config default would be. The dead `newEnvironments` block that would have implemented the rejected design was removed, because unwired code that looks like an oversight invites someone to finish it. Note `hardhat-deploy` DOES populate hardhat networks from the same list (`addNetworksFromKnownList`), which is a different surface (hardhat's own network config, not rocketh environments) and is not a precedent for reversing this.
