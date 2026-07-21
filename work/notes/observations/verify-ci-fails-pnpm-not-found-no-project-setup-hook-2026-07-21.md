---
title: dorfl `verify` CI job fails with `pnpm: command not found` — the dorfl-setup action does not provision pnpm (no project-setup hook configured)
type: observation
status: spotted
spotted: 2026-07-21
---

## What was seen

PR #47 (`devmethoddoc-custom-natspec-keys`) has its `verify` GitHub check FAILING with:

```
bash: line 1: pnpm: command not found
##[error]Process completed with exit code 127.
```

(run 29779384832, job "run the repo verify gate"). The failure is NOT the changeset
(PR #47 already carries `.changeset/devmethoddoc-custom-natspec-keys.md`) and predates the
`dorflCmd` pin commit — it is a CI PROVISIONING gap.

## Mechanism

- `.github/workflows/verify.yml` = checkout → `./.github/actions/dorfl-setup` → `dorfl verify`.
- `dorfl verify` runs this repo's gate: `pnpm format:check && pnpm changeset status --since=main
  && pnpm build && pnpm test && pnpm test:getting-started` — ALL `pnpm`.
- BUT `dorfl-setup/action.yml` deliberately provisions ONLY dorfl's own runtime (Node 22 +
  `npm install -g dorfl` + the pi harness). Its own header documents the **project-toolchain
  boundary**: it does NOT install the project's package manager — *"A custom or conflicting
  project toolchain is supported ONLY via the project-setup hook (install-ci-project-setup-hook);
  without that hook the conflicting case is unsupported."*
- rocketh has **no project-setup hook configured** (no `projectSetup` in the CI config, no
  `pnpm/action-setup` step in `dorfl-setup`). So `pnpm` is never on PATH in the `verify` job →
  the gate dies at the first `pnpm`.

rocketh's OWN workflows (`release.yml`, `test.yml`, `deploy.yml`) all DO provision pnpm via
`pnpm/action-setup` — only the dorfl-managed `verify.yml` (through `dorfl-setup`) does not.

## Fix options (rocketh CI config — a human decision)

1. **Configure the project-setup hook** (the documented path): re-run `dorfl install-ci` with a
   project-setup payload that runs `pnpm/action-setup` (+ `setup-node` cache) BEFORE dorfl-install,
   so `pnpm` is on PATH for `dorfl verify`. This is the intended mechanism (`install-ci-project-setup-hook`).
2. Or make the `verify` gate not depend on an un-provisioned `pnpm` (e.g. `corepack enable` at the
   top of the gate) — weaker; the hook is the right layer.

## Related (separate, lower priority)

- rocketh's `dorfl-setup` still carries the OLD `node_modules/.bin/dorfl` PREFER-LOCAL RESOLVER
  shim. dorfl 0.8.0 REMOVED that shim (task `install-ci-shim-converges-on-dorfl-cmd`) in favour of
  the generic `dorflCmd` self-forward, which rocketh now declares (`dorfl.json` `dorflCmd:
  node_modules/.bin/dorfl`). Re-running `install-ci` on 0.8.0 would regenerate `dorfl-setup`
  WITHOUT the shim — worth doing at the same time as fix (1), but it is not what fails the gate
  (the shim is harmless; `pnpm not found` is the blocker, hit before any dorfl-forward).

## Refs

- `.github/workflows/verify.yml`; `.github/actions/dorfl-setup/action.yml` (toolchain-boundary header).
- Working precedent: `.github/workflows/release.yml` L36-37 / `test.yml` L22-23 (`pnpm/action-setup`).
- PR #47 verify run 29779384832 (`pnpm: command not found`, exit 127).
