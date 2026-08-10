<!-- dorfl-sidecar: item=observation:broadcast-signer-switch-has-no-default-2026-08-09 type=observation slug=broadcast-signer-switch-has-no-default-2026-08-09 allAnswered=false -->

Item: [`observation:broadcast-signer-switch-has-no-default-2026-08-09`](../notes/observations/broadcast-signer-switch-has-no-default-2026-08-09.md)

## Q1

**Which exhaustiveness fix should close the missing default in broadcastTransaction: a runtime default that throws naming the unexpected signer.type, a compile-time 'satisfies never' check, or both (throw inside a block guarded by an exhaustiveness assignment)?**

> packages/rocketh/src/environment/index.ts lines 1039-1071: switch(signer.type) covers 'wallet' | 'remote' | 'signerOnly' with no default, so an out-of-union value falls off the end and broadcastTransaction returns undefined, which then flows into savePendingExecution. The observation notes 'satisfies never' would additionally make a future fourth Signer variant a compile error.

_Suggested default: Both: add a default that throws an Error naming the unexpected signer.type, AND assign signer to a `never`-typed variable in that default so a future variant fails to compile._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Should this fix ride along with the next task that touches broadcastTransaction (the observation suggests unknown-signer-contract-enrichment), or be minted as its own tiny task now?**

> Observation's 'Suggested disposition' section proposes piggybacking on unknown-signer-contract-enrichment. The change is a few lines but touches the single broadcast choke point, so bundling vs isolating is a routing call.

_Suggested default: Ride along with unknown-signer-contract-enrichment — the change is small, co-located, and thematically the same 'remove opaque failure at the broadcast seam' work._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):
