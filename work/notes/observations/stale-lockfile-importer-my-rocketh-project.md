---
date: 2026-08-10
---

`pnpm install` (run while adding test-only devDependencies for `unknown-signer-integration-scenarios`) removed a stale `my-rocketh-project` importer block from `pnpm-lock.yaml`. That directory does not exist in the repo and is not matched by `pnpm-workspace.yaml` (`packages/*`, `website`), so the entry looks like a leftover from a local-only folder; any `pnpm install` on a clean checkout drops it. Flagging in case someone expects that importer to stay in the lockfile.
