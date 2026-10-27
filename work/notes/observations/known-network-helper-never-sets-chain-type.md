---
title: "`addNetworksFromKnownList` never sets `chainType`, so OP-stack networks are not marked `op`"
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

Spotted while reviewing the documentation audit, by reading the code; not verified by running it.

`addNetworksFromKnownList` in `packages/hardhat-deploy/src/helpers.ts` builds each known network with `chainType: chain.chainType === 'op-stack' ? 'op' : undefined`, where `chain` comes from `chainByCanonicalName` (`packages/rocketh-node/src/environment/chains.ts`).

`chainByCanonicalName` stores the raw viem chain objects. The `chainType` looked up in `chainTypesByNames` is only merged into the `chainById` entries built just above it, never into `chainByCanonicalName`. So `chain.chainType` is always `undefined` there, and no known network ever gets `chainType: 'op'`.

# Why it matters

The intent is plainly to give OP-stack networks hardhat's `op` chain type, which changes how hardhat simulates them (L1 fee, OP-specific transaction handling). Today every known network silently gets the default. The docs used to claim the helper sets it; that claim was removed in the audit until the code does.

# Not done here

No code change. The fix is probably to carry `chainType` into `chainByCanonicalName` the way `chainById` does, then restore a sentence in `hardhat-deploy/documentation/how-to/configure-network-helpers/`.
