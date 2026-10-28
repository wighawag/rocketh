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

This changes behaviour for a project whose `scripts` lists several folders and relies on their files being interleaved by name (`deploy/001`, `extra/002`, `deploy/003`). Ship it with a changeset for `@rocketh/node` that says so; the changeset is where releases are described, so it carries the upgrade note too.

Then make the documentation true:

- Deploy scripts, "Which files run, and in what order": today it says that every file not skipped by name is imported as a script, and that scripts run in the alphabetical order of their paths. Both change: only script extensions are imported (declaration and map files are skipped), and folders run in the order they are listed, each in the order of its paths, with dependencies still running first.
- Share contracts between projects keeps "list their folder before yours", which becomes true, and says that a compiled folder's declaration and map files are skipped.
- The configuration reference states the order rule for both the top-level `scripts` and `environments.<name>.scripts`.

## Acceptance criteria

- [ ] A scripts folder containing `x.js`, `x.d.ts`, `x.d.ts.map` and `x.js.map` loads and runs `x.js` only, and the run succeeds.
- [ ] `.mjs`, `.cjs`, `.mts`, `.cts` and `.ts` scripts are still loaded; `_`-prefixed files are still skipped.
- [ ] With `scripts: ['b', 'a']`, every script of `b` runs before every script of `a`, regardless of file names; within a folder, files keep their path order.
- [ ] `dependencies` between scripts still override that order where they apply.
- [ ] Tests cover discovery and ordering at the executor level, alongside the existing discovery tests of the node package (which already cover path order and the `_` filter), plus the traversal tests where the walk itself changes.
- [ ] Changeset for `@rocketh/node` describing the ordering change and what a project interleaving several folders has to do.
- [ ] The deploy-scripts page ("Which files run, and in what order"), the sharing-contracts guide, and the configuration reference (top-level `scripts` and `environments.<name>.scripts`) match the new behaviour.

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: make rocketh's node executor load only real script files from the `scripts` folders, and run those folders in the order the configuration lists them, so that `scripts: ['node_modules/<pkg>/dist/deploy', 'deploy']` works against a package compiled by `tsc` with declarations and source maps, and runs the package's scripts first.
>
> Where to look: the script discovery in the node package's executor (it calls the multi-directory traversal from the package's fs utilities, filters `_`-prefixed basenames, then sorts all paths together), the traversal utilities and their tests, the node package's script-discovery tests (executor level: path order, the `_` filter), the configuration types and resolution of `scripts`, and three documentation pages: Deploy scripts ("Which files run, and in what order", which states today's rule), Share contracts between projects, and the configuration reference (`scripts` and `environments.<name>.scripts`). The executor that runs the modules keeps the order it is given and only pulls a script's dependencies in first, so the order is decided entirely at discovery.
>
> FIRST, check this task against current reality: if discovery already filters by extension or keeps folder order, or the guide no longer documents the folder approach, route the task to needs-attention with the discrepancy instead of building on a stale premise.
>
> Done means: the acceptance criteria above pass, with tests at the discovery seam (a temporary folder with the mixed files, two folders listed in reverse name order), a changeset describing the ordering change, and the three documentation pages updated. Record any non-obvious choice (for example how a file directly listed in `scripts`, rather than a folder, is treated, or whether `.json` should ever be allowed) in a `## Decisions` block in your final report.

---

### Claiming this task

```sh
dorfl claim script-folders-load-only-scripts-in-listed-order --arbiter origin
git fetch origin && git switch -c work/script-folders-load-only-scripts-in-listed-order origin/main
# on completion, in the work branch's PR/merge:
git mv work/tasks/ready/script-folders-load-only-scripts-in-listed-order.md work/tasks/done/script-folders-load-only-scripts-in-listed-order.md
```
