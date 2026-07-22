---
title: review-gate non-blocking nits for 'verifier-linked-library-source-key' (Gate 2 approve)
date: 2026-07-22
status: open
reviewOf: verifier-linked-library-source-key
needsAnswers: true
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
