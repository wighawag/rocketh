<!-- dorfl-sidecar: item=task:devmethoddoc-custom-natspec-keys type=task slug=devmethoddoc-custom-natspec-keys allAnswered=false -->

## Q1

**'task:devmethoddoc-custom-natspec-keys' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):

Proceed. The gate failed ONLY because no changeset was added — `@rocketh/core` changed but `.changeset/` had no entry, so `pnpm changeset status --since=main` (part of the `verify` gate) failed at land time on the rebased tip. The code on the `work/task-devmethoddoc-custom-natspec-keys` branch is correct and complete (the `@custom:${string}` index signature on `DevMethodDoc` + the `devMethodDoc.test.ts` assignability test for issue #44).

On the re-drive, ADD a changeset entry before landing: create `.changeset/devmethoddoc-custom-natspec-keys.md` with frontmatter `'@rocketh/core': patch` and a one-line summary ("Allow arbitrary `@custom:*` natspec keys (e.g. `@custom:oz-upgrades-unsafe-allow`) on `DevMethodDoc` so OpenZeppelin upgradeable-contract natspec type-checks without casting — issue #44"). Do NOT run `pnpm changeset` (interactive); write the file directly, per `CONTEXT.md` → `## Conventions`. Then the full gate (`format:check && changeset status --since=main && build && test && test:getting-started`) passes and the task lands.
