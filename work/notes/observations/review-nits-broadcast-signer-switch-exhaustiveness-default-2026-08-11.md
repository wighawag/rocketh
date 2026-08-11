---
title: review-gate non-blocking nits for 'broadcast-signer-switch-exhaustiveness-default' (Gate 2 approve)
date: 2026-08-11
status: open
reviewOf: broadcast-signer-switch-exhaustiveness-default
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'broadcast-signer-switch-exhaustiveness-default' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify the observation note added in this PR (work/notes/observations/pnpm-typecheck-tests-npx-tsc-broken.md) — it is unrelated to the signer-switch fix and was picked up while completing the task; harmless but a small scope drift.
  (git diff main...HEAD --name-status shows an added observation file alongside the changeset + src edit; content explicitly says 'not fixed (out of scope)'.)
- Ratify the runtime-message shape choice: the throw uses `(exhaustive as {type: string}).type` rather than the simpler `${exhaustive}` pattern used at unknownSignerPolicy.ts:88.
  (Signer is an object union so plain string interpolation would yield `[object Object]`; naming `signer.type` is what the task asked for, and the cast is only needed because TS narrows `signer` to `never`. Reasonable, but a minor divergence from the precedent's exact shape.)
