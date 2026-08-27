---
title: 'An nx cache HIT on a demo build restores nothing, so `pnpm typecheck` fails on a fresh checkout with TS2307'
type: observation
status: spotted
spotted: 2026-08-27
---

# What happens

On a fresh worktree whose nx cache is already warm for the current inputs, `pnpm build` reports success in under a second and `pnpm typecheck` then fails:

```
NX   Successfully ran target build for 23 projects
Nx read the output from the cache instead of running the command for 23 out of 23 tasks.
Run duration: 663ms
Cache: 23/23 hit (100%)

> pnpm -r --parallel exec tsc --noEmit
rocketh/deploy.ts(10,28): error TS2307: Cannot find module '../generated/artifacts/index.js' or its corresponding type declarations.
rocketh/environment.ts(12,28): error TS2307: Cannot find module '../generated/artifacts/index.js'
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 2: tsc --noEmit
```

# Why

Three facts that are individually reasonable and collectively broken:

1. `nx.json`'s `targetDefaults.build` sets `cache: true` and declares `inputs`, but declares **no `outputs`**.
2. The demo projects' `build` is `hardhat compile`, whose products are `artifacts/`, `cache/` and the plugin-generated `generated/artifacts/index.ts`.
3. Every one of those is gitignored (`demoes/hardhat-deploy/*/.gitignore` line 7 is `generated`), so a fresh checkout does not have them.

With no `outputs` declared, nx has nothing to restore on a hit. It therefore replays a build that produced files, without producing the files, and reports the target as successful. The demos' `rocketh/deploy.ts` and `rocketh/environment.ts` import `../generated/artifacts/index.js`, so `tsc --noEmit` fails immediately afterwards.

# Why it is worth a note rather than a shrug

**It is nondeterministic in the worst direction.** Whichever run warms the cache passes; every later run on a clean tree with the same inputs fails. Observed live, two consecutive acceptance-gate runs of the same repo an hour apart: `execute-guard-seam-and-call-kind` got 12 of 23 cache hits, so the demo builds actually ran, and its gate went green through typecheck, test and test:getting-started. The very next task, `execute-guard-equals-and-output-selection`, got 23 of 23 and failed typecheck. Nothing about either task touched the demos.

**It cannot be reproduced in a working checkout.** `pnpm typecheck` passes locally because `generated/` is sitting there from a previous real build, so the natural first reaction is to blame the branch under test. That is exactly what it looks like: a red typecheck on somebody's PR, in files their diff never mentions.

**It reaches CI and any fresh clone**, not just this drive. Any environment that restores a warm nx cache into a tree without `generated/` gets it.

# Where the fix could go

- **Declare `outputs` on the demo `build` target** (`artifacts`, `cache`, `generated`), which is the honest fix: it makes the cache entry describe what the build actually produces, so a hit restores it.
- **Or set `cache: false`** for the demo projects, cheaper and slower, and it leaves the same trap for any future target whose outputs are undeclared.
- **Or make `typecheck` depend on a genuinely-produced build** rather than on files a sibling target may or may not have left behind.

The first is the only one that fixes the class rather than the instance. Note that the root `targetDefaults` applies to every project's `build`, so any package whose build writes outside `dist` has the same hole.

# Workaround used while driving

`NX_SKIP_NX_CACHE=true` on the acceptance-gate run, verified to make `hardhat compile` actually execute rather than replay. That unblocks a drive but is not a fix.
