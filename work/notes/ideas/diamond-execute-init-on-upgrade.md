---
title: 'Diamond `execute`: split into `{init, onUpgrade}` like the proxy'
slug: diamond-execute-init-on-upgrade
---

# Idea: `{init, onUpgrade}` for `@rocketh/diamond`'s `execute`

Status: incubating.

## What exists today

`DiamondDeployOptions.execute` is ONE call, made on the fresh deploy (as an entry in the diamond constructor's `_initializations`) and again on EVERY later `diamondCut`, with the same method and the same args. It is the flat form of `@rocketh/proxy`'s `execute`, which behaves identically (`packages/rocketh-proxy/src/index.ts:369-378` sets the execution without consulting `existingDeployment`).

It rides a change: no cut, no call. `packages/rocketh-diamond/src/index.ts`'s `if (changesDetected)` gates it, exactly as the proxy gates its `postUpgradeCalldata` behind `if (currentImplementationAddress !== implementationDeployment.address)` (`packages/rocketh-proxy/src/index.ts:471`, no `else`). That is deliberate and must stay: deploy scripts are re-run, and an initializer that fired on every re-run would not be idempotent.

## What is missing

The proxy can already say WHICH of the two events a call belongs to:

```ts
execute?:
  | string
  | {methodName: string; args?: any[]}
  | {init: string | {methodName: string; args?: any[]}; onUpgrade?: string | {methodName: string; args?: any[]}};
```

`init` fires only on creation, `onUpgrade` only on an actual implementation change (`packages/rocketh-proxy/src/index.ts:380-404`, inherited from hardhat-deploy v1 `src/helpers.ts:1113-1135`, which also throws when `methodName` is mixed with `init`/`onUpgrade`).

The diamond has no such split, so a one-time storage migration expressed as `execute` re-runs on every subsequent cut, and there is no way to say "only when this diamond is first created" or "only on upgrades".

## Why it is not a straight copy of the proxy type

Two axes, not one:

1. WHERE the initializer lives. The diamond's `execute` already carries a discriminator: `{type: 'artifact'}` deploys a dedicated init contract deterministically, whereas `{type: 'facet'}` locates the method on one of the facets being cut in and reuses that address. The proxy has no equivalent: `init`/`onUpgrade` always name a method on the implementation, reached through the proxy.
2. WHEN it fires: fresh versus upgrade, which is the axis this idea adds.

So the diamond's shape is roughly `{type, ...target} & ({functionName, args} | {init, onUpgrade})`, and the fresh/upgrade selector has to be resolved BEFORE the facet scan that looks for `options.execute.functionName`, since the two branches may name different functions.

## Related gap, worth resolving in the same design

Neither package can express "run this call although nothing else changed" (a storage migration needing no selector and no implementation change). With the proxy you can force it by bumping the implementation; the diamond has no equivalent lever. If that capability is wanted it needs its own explicit, non-default opt-in (something the caller has to write per run, not a flag that silently re-fires), because the whole point of the current gating is idempotence.

## Provenance

Came out of a third-party security review that reported the initializer-only skip as a HIGH severity bug (RCK-001). It is not a bug: the same gating exists in hardhat-deploy v1's two diamond implementations (`src/helpers.ts:1889/2156` and `3234/3407`) and in `@rocketh/proxy`, and removing it would break idempotence. The real gap is the missing `{init, onUpgrade}` expressiveness, recorded here.
