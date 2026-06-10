---
title: <Human Readable Title>
slug: <url-safe-slug>
# issue: 123          # optional: the issue this PRD was spawned from (the surviving thread)
# humanOnly: true     # optional: a HUMAN must drive the slicing of this PRD (a decision). OMIT otherwise.
# needsAnswers: true  # optional: open questions block AUTO-slicing (spec incomplete). OMIT otherwise. List the questions in the body.
# sliceAfter: []      # optional: PRD slugs that must be SLICED first (so this PRD's slices can reference their slugs in blockedBy).
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/backlog/` slices. (The technical-detail sections below are trimmed by `to-slices` once the work is sliced — they move into slices/ADRs and this PRD settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

The problem the user faces, from the user's perspective.

## Solution

The solution, from the user's perspective.

## User Stories

A LONG, numbered list — the heart of the PRD. Format:

1. As a <actor>, I want <feature>, so that <benefit>.

Cover all aspects of the feature, extensively.

### Autonomy notes (the two gate axes — set the frontmatter flags accordingly)

The PRD now CARRIES the slicing gate (because an agent may auto-slice it with no human in the loop). Record, in prose here AND as the frontmatter flags above:

- **`humanOnly` (DECIDED):** set `humanOnly: true` on the PRD ONLY to mean "a human must drive the _slicing_ of this PRD" (sole effect: an agent may not auto-slice it). This is DISJOINT from slice `humanOnly` — it does NOT propagate to or guide the slices' gates (a `humanOnly` PRD can yield fully agent-buildable slices). The slicer sets each slice's gate from that slice's own build-nature.
- **`needsAnswers` (DISCOVERED):** are there open questions the spec has not yet resolved? If so, set `needsAnswers: true` and **list the questions in this section** — the auto-slicer will refuse to slice until they are answered and the flag cleared. Be HONEST: a flagged-incomplete PRD is correct; a falsely-complete one produces wrongly-cut slices. (Omit both flags if everything is resolved and straightforwardly agent-sliceable.)

## Implementation Decisions

Decisions made at launch (modules to build/modify, interfaces, architectural choices, schema, API contracts, specific interactions). No file paths or code snippets (they go stale) — except a decision-encoding snippet from a prototype (state machine, reducer, schema, type shape), trimmed to the decision-rich part.

> Trimmed at slice-time: this detail moves into the slices (what to build) and, where it's a durable rationale, into an ADR (`docs/adr/`). It is here only to seed the slicing.

## Testing Decisions

What makes a good test (external behaviour, not implementation details); which modules/seams will be tested; prior art in the codebase.

> Also trimmed at slice-time (moves into slices' acceptance criteria / an ADR).

## Out of Scope

What is deliberately not being done (and, where useful, where it lives instead — e.g. an incubating idea in `work/ideas/`).

## Further Notes

Anything else worth recording at launch.
