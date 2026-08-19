---
title: review-gate non-blocking nits for 'unknown-signer-v1-migration' (Gate 2 approve)
date: 2026-08-19
status: open
reviewOf: unknown-signer-v1-migration
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'unknown-signer-v1-migration' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Task 1 phrases 'value is a string (or undefined), never a bigint' while the spec text says 'value as a string'. Confirm intent: is undefined an allowed value for the 'value' key, or must it always be a string when the key is present?
  (v1-parity-tests-catch-unknown-signer.md acceptance vs spec Solution bullet 1. The task's phrasing is consistent with the 'every key present even when its value is undefined' clause, so likely correct — worth pinning in the test comment.)
- Two test files (parity + ported) both assert return-shape keys. Prompts steer away from duplication but the boundary could drift during implementation. Consider a one-line cross-reference in each file header pointing at the other.
  (Both tasks target packages/rocketh-unknown-signer/test/ and both cover story 6 / return-shape. Purposeful split (pin vs whole-script example) but the seam is thin.)
