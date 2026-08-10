---
title: test:getting-started re-pollutes the root lockfile with a my-rocketh-project importer
slug: getting-started-test-pollutes-root-lockfile-2026-08-10
needsAnswers: true
---

# The verify gate itself re-pollutes `pnpm-lock.yaml`

A stale `my-rocketh-project` importer keeps reappearing in the root `pnpm-lock.yaml`. It has now been removed twice and come back once:

- removed in `08c3037` (after the review gate bounced `unknown-signer-error-type` for it, misattributing it to that task's diff, where it was not);
- **reintroduced by `4383bb6` (PR #70, `unknown-signer-package`)**, which slipped past the acceptance gate, the PR/code-review gate, the conductor's Gate-3 and an independent review, because none of them diffed the lockfile;
- removed again as a side effect of PR #73's own `pnpm install`.

## Root cause

```
"test:getting-started": "ezx --verbose README.md -s 'Getting Started' && rm -Rf my-rocketh-project"
```

That is part of the repo's `verify` gate. It runs the README's Getting Started section, which scaffolds `my-rocketh-project/` INSIDE the repo and installs there, linking workspace packages. The trailing `rm -Rf` deletes the DIRECTORY, but the importer block that install added to the ROOT lockfile survives it.

So the gate can dirty the lockfile on any run, and whether that dirt lands depends only on whether whoever ran it happened to `git add` the lockfile afterwards. Both previous removals treated the symptom.

## Why it is worth fixing rather than re-pruning

`.github/workflows/release.yml` runs `pnpm install --frozen-lockfile`. A phantom importer pinning its own `typescript`/`@types/node`/`hardhat` versions is a live risk there, and this will keep recurring on a random subset of PRs, costing a review cycle each time it is noticed and silently landing when it is not.

## Possible fixes (not chosen here)

- Scaffold the getting-started project OUTSIDE the repo (a temp dir) so the root workspace never sees it.
- Or run its install with `--ignore-workspace`.
- Or restore `pnpm-lock.yaml` after the step (`git checkout -- pnpm-lock.yaml`), which is the cheapest but leaves the cause in place.

Worth deciding deliberately: the first removes the cause, the third only stops the bleeding.
