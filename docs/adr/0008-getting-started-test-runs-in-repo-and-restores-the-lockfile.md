# The getting-started test runs INSIDE the repo and restores the lockfile, rather than scaffolding in a temp dir

`pnpm test:getting-started` executes the README's Getting Started section with `ezx`, which scaffolds `my-rocketh-project/` **inside the repo** and installs there. That install adds a `my-rocketh-project:` importer to the ROOT `pnpm-lock.yaml`, and the obvious fix is to scaffold in a temp dir instead so the workspace never sees it. **Do not do that.**

Inside the repo, pnpm links the scaffolded project straight at the working tree: `version: link:../packages/rocketh-deploy`, and the same for `rocketh`, `hardhat-deploy` and `@rocketh/node`. That linking is the whole value of the test, because it is the only end-to-end check that the documented user flow works against the code you just changed. (Proof it is not incidental: against an unbuilt workspace the run fails with `Cannot find module '.../hardhat-deploy/dist/index.js'`, which an install of published packages could never do.) Move the scaffold to a temp dir and pnpm resolves the PUBLISHED packages instead, so the test would verify the last release rather than the working tree, and would go green on a branch that broke everything. `--ignore-workspace` was rejected for the same reason: it is precisely the switch that turns the links off.

So the cause is kept and the symptom is removed: the script snapshots `pnpm-lock.yaml` to a temp file, runs the section, then unconditionally removes the scaffold and restores the snapshot, preserving the exit code.

## Consequences

- **Snapshot, never `git checkout -- pnpm-lock.yaml`.** Restoring to HEAD would destroy a developer's own uncommitted lockfile edit: they add a dependency, run `pnpm test`, and silently lose it. The snapshot restores whatever state the file was in, dirty or clean.
- **Cleanup is unconditional**, not `&&`-chained. The previous form skipped cleanup when the run failed part-way, which is the likeliest way the phantom importer reached a commit (it was introduced once by a PR that four review layers missed, because none diffed the lockfile).
- `my-rocketh-project/` is already gitignored, so the directory itself never leaks; the lockfile was the only escape route, and it is now closed.
- Making the temp-dir approach actually work would mean injecting `link:` overrides so the local packages are still used, which makes the executed script diverge from what the README tells a user to type, and so stops the test checking the documentation as well. That is a deliberate piece of work with its own trade-off, not a flag change.
