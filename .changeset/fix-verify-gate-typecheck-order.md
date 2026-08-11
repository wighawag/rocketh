---
---

Fix the `verify` gate ordering: `pnpm typecheck` now runs AFTER `pnpm build`, not before it. Cross-package imports resolve through the workspace link to `packages/*/dist/*.d.ts`, which only exists once a build has run, so on a clean checkout `typecheck` fails with `Cannot find module '@rocketh/core'` for every package that imports a sibling. This was invisible in local runs (an existing `dist/` masks it) and bit only a FRESH gate worktree, where it failed a completed task twice for reasons unrelated to that task's work. `TESTING.md` now states the dependency explicitly.
