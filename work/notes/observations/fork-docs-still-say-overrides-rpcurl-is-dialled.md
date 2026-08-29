---
title: 'The fork-runs docs still say a fork would dial `overrides.rpcUrl`, which the endpoint refinement already withholds'
type: observation
status: spotted
spotted: 2026-08-29
---

Spotted while landing `a-provider-less-fork-discovers-its-connected-chain-id`. `documentation/fork-runs/index.md`, in the `whenForked` section, says "because the fork layer sits ON TOP of `overrides`, an `overrides.rpcUrl` naming the real network's endpoint would otherwise be what a fork run dials: if your environment entry has one, name the fork's endpoint in `whenForked` as well." `resolveExecutionParams` strips `rpcUrl` from the `overrides` layer on a fork (ADR 0014's endpoint refinement, pinned by `packages/rocketh/test/fork-config-layer.test.ts`), so the remedy the prose asks for is no longer needed and the reason given is stale.
