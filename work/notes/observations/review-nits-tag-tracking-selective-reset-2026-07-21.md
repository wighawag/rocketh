---
title: review-gate non-blocking nits for 'tag-tracking-selective-reset' (Gate 2 approve)
date: 2026-07-21
status: open
reviewOf: tag-tracking-selective-reset
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'tag-tracking-selective-reset' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Task 1 says the optional tags/dependencies on Deployment are already sketched — good — but does not explicitly call out that types.ts line 237 already has readonly tags?: readonly string[]; it should verify readonly-ness matches (mutable vs readonly) so the setter/save path does not fight the type.
  (packages/rocketh-core/src/types.ts:237 already declares readonly tags?: readonly string[]; task uses readonly form — consistent, just worth a sanity check during build.)
- Task 2 assumes a confirmation prompt exists for reset today. The executor exposes a PromptExecutor and uses confirm prompts (executor/index.ts:413,424), but the builder should verify the current --reset branch actually prompts (vs deletes silently) before layering the scope prompt on top.
  (packages/rocketh/src/executor/index.ts:413-441 shows the prompt surface; spec/task both call for a scope-confirmation prompt on selective reset.)
