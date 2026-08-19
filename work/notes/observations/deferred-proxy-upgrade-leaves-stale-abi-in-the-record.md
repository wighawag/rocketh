---
title: 'A deferred proxy upgrade never updates the proxy deployment record, so its ABI stays on the old implementation forever'
type: observation
status: spotted
spotted: 2026-08-19
---

# `deployViaProxy` saves the merged ABI only on the run that performs the upgrade, and the deferral path never has one

Spotted while running `demoes/hardhat-deploy/governance` end to end for the first time. **Measured, not inferred**, but it concerns OUR code rather than an external system, so it is an observation rather than a finding.

## What was measured

`scenario-multisig`, four runs against a local node: deploy v1, ask for v2 (upgrade deferred to the multisig), execute it through the multisig, re-run to converge. Afterwards:

| | value |
| --- | --- |
| proxy's EIP-1967 implementation slot, on chain | `0x5fc8…707` (the v2 implementation) |
| `deployments/localhost/Registry_Implementation.json` | `0x5fc8…707`, ABI contains `getMessage` (v2 only) |
| `deployments/localhost/Registry.json` (the proxy) | ABI does **not** contain `getMessage`, i.e. still v1 |

So the chain runs v2 and the proxy's saved record describes v1.

## Why

In `packages/rocketh-proxy/src/index.ts`, the existing-deployment branch reads the implementation slot at `:465-469` and compares it at `:471`. The `env.save<TAbi>(name, {...proxyDeployment, ...artifactToUse, abi: mergedABI, ...})` that writes the merged ABI is at `:579`, **inside** that `if`. So the record is only ever rewritten on a run that actually performs an upgrade.

On the deferral path there is no such run:

- the run that wants the upgrade throws `UnknownSignerError` from the `_execute` at `:550`/`:557`/`:565`/`:572`, which is BEFORE the save at `:579`, so the save is skipped;
- the run after governance executes finds the slot already equal to the target implementation, so the `if` at `:471` is false and the entire block, save included, is skipped.

The record is therefore never updated by any run. It is not a race or an ordering accident: no execution path writes it.

This is invisible in the ordinary signable flow, because there the upgrade and the save happen in the same run. It requires an unsignable owner to show up, which is why it has survived.

## Why it matters

The proxy's record is the thing everything downstream reads:

- `@rocketh/export` would ship the stale v1 ABI to a frontend;
- `env.get<Abi>('Registry')` in a later script or test hands back the v1 ABI, so calling a v2-only method fails against a chain that supports it;
- `@rocketh/doc` documents the old interface.

All three are silent: nothing errors, the ABI is simply old. And it affects exactly the users the unknown-signer work exists for, since a governed upgrade is the only way to reach it.

## Not yet established

- Whether the same hole exists in `@rocketh/diamond`'s deferral path, which has its own save logic.
- Whether the ERC173/UUPS proxy-direct branches behave identically (they share the same `if`, so almost certainly, but only the ProxyAdmin path was measured).
- What the fix should be. Moving the save out of the `if` is the obvious candidate, but the save also carries `linkedData` and a merged ABI, so "save unconditionally when the on-chain implementation already matches the target" needs checking against the fresh-deployment path at `:451` and against `numDeployments` semantics before it is assumed safe.

## Reproduction

```bash
cd demoes/hardhat-deploy/governance
pnpm deploy:dev localhost --tags scenario-multisig
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig
pnpm act-as-governance scenario-multisig
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig
node -p "require('./deployments/localhost/Registry.json').abi.some(e => e.name === 'getMessage')"   # false, should be true
```
