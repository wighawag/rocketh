---
title: '`save()` counts `numDeployments` into memory but writes the uncounted argument, so the field survives to disk only when a caller happens to spread it in'
type: observation
status: spotted
spotted: 2026-08-19
---

# `numDeployments` is computed for the in-memory record and dropped from the file

Spotted while verifying the stale-ABI fix against the governance demo. The fix works, and checking `numDeployments` on the resulting file turned up something adjacent. **Not investigated beyond what is written here, and one first reading of it was wrong** (see the correction below), so treat the mechanism as established and the consequences as suspected.

## What was measured

`packages/rocketh/src/environment/index.ts:979-996`. `save()` computes the counter and puts it in the in-memory map:

```ts
deployments[name] = {...deployment, numDeployments};
```

and then writes to disk:

```ts
JSONToString(deployment, 2);
```

That is `deployment`, the ARGUMENT, not `deployments[name]`, the counted record. So the counter reaches `env.get(name)` for the rest of the run and reaches the file only if the caller's own object already carried a `numDeployments`, which happens when the caller spreads a previously-loaded record (`{...oldDeployment, ...}`) and not when it spreads something else.

Observed on disk, after running the demoes:

| file                                                                         | `numDeployments` |
| ---------------------------------------------------------------------------- | ---------------- |
| `demoes/hardhat-deploy/proxies/deployments/localhost/Transparent.json`       | `1`              |
| `demoes/hardhat-deploy/proxies/deployments/localhost/GreetingsRegistry.json` | absent           |
| `demoes/hardhat-deploy/governance/deployments/localhost/Registry.json`       | absent           |

**Correction, recorded because the wrong version was believed for several minutes:** the first reading of this was "`numDeployments` is never persisted". That is false, as the table shows. The accurate statement is that persistence is incidental to how each call site builds its object.

## Suspected consequences, NOT verified

- **Across runs the counter cannot be trusted.** `save()` derives the next value from `deployments[name].numDeployments`, which after a reload is whatever the file happened to carry. Where the field is absent, `(undefined || 1) + 1` makes the next save `2` regardless of history.
- **`checkUpgradeIndex` reads it** (`packages/rocketh-proxy/src/utils.ts:20-42`) to decide whether an `upgradeIndex` is satisfied, including the error "expects Deployments numDeployments to be at least N". If the field is missing from the file, that logic is working from a number that restarts. Whether any real `upgradeIndex` user is affected was not checked.

## Relationship to the stale-ABI fix

The fix for `work/notes/observations/deferred-proxy-upgrade-leaves-stale-abi-in-the-record.md` deliberately did NOT touch this. Its tests assert the in-memory semantics (`env.get(name).numDeployments` within a run), which is what the record-refresh guard needs to be correct about, and they pass. The persistence gap is orthogonal, older, and has a much larger blast radius: changing what `save()` writes changes every deployment file every user has committed.

## Why it was not fixed on the spot

Writing `deployments[name]` instead of `deployment` is a one-word change and almost certainly the intent, but it would add a `numDeployments` field to files that do not currently have one, across every project on the next deploy. That is a visible diff in committed `deployments/` folders and wants its own decision, its own changeset note, and a check of whether anything consumes these files positionally or by exact shape (`@rocketh/export`, `@rocketh/doc`, the hardhat-deploy v1 compatibility surface).
