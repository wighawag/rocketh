---
title: 'A cycle of deploy-script dependencies overflows the stack, and a dependency on a tag no script has is silently ignored'
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

Spotted while writing the deploy-scripts page of the documentation, by reading the code, then confirmed with a throwaway test against `executeDeployScriptModules` (two modules depending on each other rejected with `Maximum call stack size exceeded`; a module depending on an unknown tag ran alone, without a word).

`executeDeployScriptModules` in `packages/rocketh/src/executor/index.ts` orders scripts with `recurseDependencies`:

- A script is marked registered (`scriptsRegisteredToRun[id] = true`) only AFTER its dependencies have been recursed into. Two scripts whose `dependencies` name each other's tags therefore recurse into each other until the call stack overflows (`RangeError: Maximum call stack size exceeded`), with no message naming the scripts or the cycle.
- A dependency is looked up in `scriptIdBags[dependency]` and skipped when no script carries that tag. A typo in `dependencies` runs nothing and reports nothing; it surfaces only when a `--tags` run selects the dependent script without the script it needed.

The old hardhat-deploy how-to page promised "circular dependency errors"; the restructured `documentation/deploy-scripts/` page now states what the code does instead (no cycle detection, unknown tags ignored).

# Why it matters

Both are configuration mistakes that the executor could name before running anything, and today one crashes with an unhelpful error and the other is invisible.

# Fix shape

Detect the cycle (a "visiting" set during the recursion) and throw naming the scripts and tags on it; warn (or throw) for a dependency tag that no script carries. Both are checks over the module list, before any script runs.
