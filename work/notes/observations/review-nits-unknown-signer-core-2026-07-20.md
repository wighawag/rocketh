---
title: review-gate non-blocking nits for 'unknown-signer-core' (Gate 2 approve)
date: 2026-07-20
status: open
reviewOf: unknown-signer-core
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'unknown-signer-core' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Prompt in unknown-signer-package.md points to 'packages/rocketh-execute/' as a skeleton reference, but no such package exists — execute lives in packages/rocketh-read-execute/. Fix the pointer or drop it (packages/rocketh-deploy/ alone is enough).
  (work/tasks/backlog/unknown-signer-package.md → 'Where to look: packages/rocketh-deploy/ and packages/rocketh-execute/'; ls packages/ shows rocketh-read-execute, not rocketh-execute.)
- Stories 4/5/6 are covered by both the seam task and the integration-scenarios task. Intentional (seam-level unit vs headline documentation vs package-level scenarios), but worth calling out explicitly in the covers field or a short note so a later reviewer does not read it as duplication.
  (seam covers [4,5,6,11]; package covers [2,3,9,10]; integration covers [1,5,6,7,8] — 5 and 6 land in two tasks.)
