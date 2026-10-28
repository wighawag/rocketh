---
title: 'Script folders: load only script files, and run the folders in the order they are listed'
slug: script-folders-load-only-scripts-in-listed-order
blockedBy: []
covers: []
---

## What to build

The node executor discovers deploy scripts by walking every folder in `scripts` and importing every file it finds, skipping only names that start with `_` (and, in the walk itself, `.`). Then it sorts all the collected paths together, as strings. Two consequences break the documented way of running another package's deploy scripts (Share contracts between projects: `scripts: ['node_modules/my-protocol-contracts/dist/deploy', 'deploy']`):

1. **Non-script files are imported.** A package compiled with `tsc` and `declaration` / `sourceMap` (as template-ethereum-contracts builds its contracts package) has `.d.ts`, `.d.ts.map` and `.js.map` files next to each compiled script. Importing the `.d.ts` fails (`ReferenceError: _default is not defined`, observed with template-ethereum-contracts' `examples/deploy-export` as the dependency); the map files cannot be imported either. With only the `.js` left in the folder, the same configuration works.
2. **The order of the folders is ignored.** Sorting all paths together puts `deploy/001_...` before `node_modules/...`, so a project's own scripts run before the imported ones whatever order `scripts` lists them in, contrary to the guide's "list their folder before yours". Only `dependencies` between scripts restore the intended order today.

Change the discovery so that:

- only script files are loaded: `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, excluding declaration files (`.d.ts`, `.d.mts`, `.d.cts`); the `_` and `.` exclusions stay;
- folders run in the order `scripts` lists them, each folder's files sorted by their path relative to that folder (subfolders included, as now);
- `dependencies` between scripts keep their current meaning on top of that order.

This changes behaviour for a project whose `scripts` lists several folders and relies on their files being interleaved by name (`deploy/001`, `extra/002`, `deploy/003`). Ship it with a changeset that says so, and a line in the migration notes.

Then make the guide true: the Share contracts between projects page keeps "list their folder before yours", and says that compiled folders may hold declaration and map files, which are skipped. The configuration reference for `scripts` states the order rule.

Related, separate: the same guide's "Publishing a contracts project" does not say that what the compiled deploy scripts and `rocketh` folder import (`rocketh`, the `@rocketh/*` extensions, `viem` as the peer of `@rocketh/viem`) must be `dependencies` of the published package. template-ethereum-contracts lists them as `devDependencies`, and installed from its tarball with hoisting off the package fails with `Cannot find package '@rocketh/signer'` (its `examples/deploy-export` branch shows the fix). Worth a sentence on that page, in this task or its own.

## Acceptance criteria

- [ ] A scripts folder containing `x.js`, `x.d.ts`, `x.d.ts.map` and `x.js.map` loads and runs `x.js` only, and the run succeeds.
- [ ] `.mjs`, `.cjs`, `.mts`, `.cts` and `.ts` scripts are still loaded; `_`-prefixed files are still skipped.
- [ ] With `scripts: ['b', 'a']`, every script of `b` runs before every script of `a`, regardless of file names; within a folder, files keep their path order.
- [ ] `dependencies` between scripts still override that order where they apply.
- [ ] Tests cover discovery and ordering, extending the existing traversal tests of the node package.
- [ ] Changeset for `@rocketh/node` describing the ordering change; migration note.
- [ ] The sharing-contracts guide and the `scripts` configuration reference match the new behaviour.

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: make rocketh's node executor load only real script files from the `scripts` folders, and run those folders in the order the configuration lists them, so that `scripts: ['node_modules/<pkg>/dist/deploy', 'deploy']` works against a package compiled by `tsc` with declarations and source maps, and runs the package's scripts first.
>
> Where to look: the script discovery in the node package's executor (it calls the multi-directory traversal from the package's fs utilities, filters `_`-prefixed basenames, then sorts all paths together), the traversal utilities and their existing tests, the configuration types and resolution of `scripts`, and the documentation pages "Share contracts between projects" and the configuration reference for `scripts`.
>
> FIRST, check this task against current reality: if discovery already filters by extension or keeps folder order, or the guide no longer documents the folder approach, route the task to needs-attention with the discrepancy instead of building on a stale premise.
>
> Done means: the acceptance criteria above pass, with tests at the discovery seam (a temporary folder with the mixed files, two folders listed in reverse name order), a changeset describing the ordering change, and the two documentation pages updated. Record any non-obvious choice (for example how a file directly listed in `scripts`, rather than a folder, is treated, or whether `.json` should ever be allowed) in a `## Decisions` block in your final report.

---

### Claiming this task

```sh
dorfl claim script-folders-load-only-scripts-in-listed-order --arbiter origin
git fetch origin && git switch -c work/script-folders-load-only-scripts-in-listed-order origin/main
# on completion, in the work branch's PR/merge:
git mv work/tasks/ready/script-folders-load-only-scripts-in-listed-order.md work/tasks/done/script-folders-load-only-scripts-in-listed-order.md
```
