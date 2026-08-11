---
title: review-gate non-blocking nits for 'verifier-linked-library-source-key' (Gate 2 approve)
date: 2026-07-22
status: open
reviewOf: verifier-linked-library-source-key
needsAnswers: false
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'verifier-linked-library-source-key' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Regex fallback in findLibrarySourcePath can match 'library <Name>' inside comments or string literals — should we harden it (e.g. strip comments first, or require it not preceded by //)?
  (packages/rocketh-verifier/src/library-source.ts: fallback uses /\blibrary\s+<Name>\b/ over raw source content; a stray occurrence in a comment or docstring in any source file would win. Low real impact since AST path is preferred and library-name collisions in comments are rare.)
- If two sources declare a library with the same name (e.g. across dependency trees), the first hit wins arbitrarily — should we prefer a compilationTarget-anchored resolution or at least warn?
  (library-source.ts iterates Object.entries(metadataSources) and returns on first match for both AST and regex passes. Name collisions are rare but real (test fixtures, forks); a non-obvious tie-break decision worth ratifying.)
- Ratify: error-path uses the existing 'return logError(...); Skipping.' pattern (skip this deployment, continue with the rest) rather than throwing — matches the file's convention but is a user-visible policy choice the task did not spell out.
  (etherscan.ts ~L253-L258: on unresolved library the current contract is skipped and the loop continues to the next deployment. Consistent with sibling error branches at L169/183/196/210/220. No Decisions block was published on the commit; flagging for human ratification.)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all three findings accepted as-is; keep the note.** The task this reviews is in `work/tasks/done/` and this is the oldest note in the inbox (2026-07-22), so nothing here has proved urgent in practice.

Accepted: the `library <Name>` regex fallback can match inside a comment or a string literal (low impact, since the AST path is preferred and the fallback only runs when it fails); the first hit wins arbitrarily when two sources declare a library of the same name; and the error path skips the deployment and continues rather than throwing, matching the file's existing convention.

Live residue, in the order it would bite: the duplicate-name tie-break is the one with a plausible real trigger (test fixtures, forked dependency trees), and the cheapest improvement there is a WARNING naming both candidates rather than a full compilation-target-anchored resolution. The regex hardening (strip comments first) is a smaller win. Neither is scheduled.
