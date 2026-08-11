---
title: review-gate non-blocking nits for 'account-signability-classification' (Gate 2 approve)
date: 2026-08-09
status: open
reviewOf: account-signability-classification
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'account-signability-classification' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify: the 'never-seen returns unsignable' contract is implemented via a JS Proxy over the map (not a getter function, not a plain object with pre-seeded keys). It is undocumented on the type (which just describes the read result) and slightly non-obvious for consumers who iterate keys or spread the object — enumeration still only yields addresses actually classified. Task didn't specify the mechanism; worth ratifying vs a small `getSignability(address)` helper.
  (packages/rocketh/src/environment/index.ts: `new Proxy(addressSignabilityMap, {get(...) { if prop.startsWith('0x') return target[...] ?? 'unsignable' }})` returned as `addressSignability`.)
- Ratify: the commit body has no '## Decisions' block. Two in-scope choices worth surfacing for the human: (a) Proxy-vs-function for the default-`unsignable` behaviour, (b) the candidate-filter fix's accepted risk (a script calling `eth_sendTransaction` directly from a privateKey-derived named account on a dev node will stop working) — recorded in the changeset body but not in a Decisions block on the PR itself.
  (git show HEAD → commit message is the one-line title only; `.changeset/account-signability-classification.md` documents the behaviour narrowing but no Decisions block was authored.)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Residue worth knowing: the never-seen-returns-`unsignable` contract is implemented as a JS Proxy over the map and is undocumented on the type, so a consumer who iterates or spreads `addressSignability` sees only addresses actually classified. Accepted; a `getSignability(address)` helper is not being added now. The missing `## Decisions` block is covered by the separate, repo-wide process question.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
