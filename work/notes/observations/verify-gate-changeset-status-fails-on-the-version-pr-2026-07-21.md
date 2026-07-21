---
title: The verify gate's `changeset status --since=main` can never pass on the Version PR (changeset-release/main), which consumes changesets by design
type: observation
status: spotted
spotted: 2026-07-21
needsAnswers: true
---

## What was seen

With the pnpm + local-main CI fixes in place, PR #48 (`changeset-release/main`, the
changesets "Version Packages" PR) still fails `verify` at:

```
🦋 error Some packages have been changed but no changesets were found.
   Run `changeset add` to resolve this error.
```

## Why (this is inherent, not a bug in the fix)

rocketh's `verify` gate (`dorfl.json`) is:

```
pnpm format:check && pnpm changeset status --since=main && pnpm build && pnpm test && pnpm test:getting-started
```

`changeset status --since=main` asserts "every changed package has a changeset." The
Version PR's whole PURPOSE is the opposite: it DELETES the pending changesets and bumps
`package.json` versions. So on `changeset-release/main` the packages ARE changed (version
bumps) with NO changesets left — `changeset status` fails by construction. This gate can
NEVER be green on the Version PR.

This was always true; it was previously MASKED because the verify job failed earlier (on
`pnpm: command not found`, then on the missing local `main`). The CI fixes removed those
earlier failures and surfaced this pre-existing gate/branch mismatch.

## Options (rocketh gate-design decision)

- **Skip the changeset check on `changeset-release/main`** — e.g. the gate command guards
  `if [ "$GITHUB_HEAD_REF" != "changeset-release/main" ]` around the `changeset status`
  step, or the verify workflow excludes that branch. (Cleanest; the release PR is validated
  by the release workflow, not the changeset-presence gate.)
- **Move `changeset status` out of `verify`** into a separate PR-only check that excludes
  the release branch, keeping `verify` = build/test/format only.
- **Merge the Version PR promptly** so it does not sit red (it is not meant to pass the
  feature-PR gate).

Note the merge path interaction: rocketh runs `integration: merge`, so feature tasks land
via dorfl's OWN fresh-worktree gate (which runs `prepare`), NOT the GitHub `verify` check.
The GitHub `verify` check is the Tier-1 branch-protection gate; it still matters for any
human/`propose` PR and for the Version PR's own mergeability.

## Refs

- `dorfl.json` `verify`; `.github/workflows/verify.yml`; PR #48 verify run 29835270418.
- Sibling: `verify-ci-fails-pnpm-not-found-no-project-setup-hook-2026-07-21.md` (the fix that exposed this).
