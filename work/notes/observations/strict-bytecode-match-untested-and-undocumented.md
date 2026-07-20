---
title: strictBytecodeMatch feature lacks tests and docs
slug: strict-bytecode-match-untested-and-undocumented
needsAnswers: true
---

# strictBytecodeMatch feature lacks tests and docs

A code review noted that the recently-added `strictBytecodeMatch` (and `alwaysOverride`) options are well-implemented and follow existing patterns, but:

- have **no dedicated tests** (a critical feature for deployment verification);
- are **not documented** in the main documentation;
- the CBOR-stripping logic uses magic values (e.g. `parseInt(last2Bytes, 16)` for CBOR length) that should be named constants with explanation;
- the `!strictBytecodeMatch` condition controlling CBOR stripping is correct but the flow could be clearer.

Also noted: `@rocketh/proxy` correctly sets `strictBytecodeMatch: false` for proxy deployments, but this should be documented with a comment explaining why.

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._
