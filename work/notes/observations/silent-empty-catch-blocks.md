---
title: Silent empty catch blocks in deploy/proxy
slug: silent-empty-catch-blocks
needsAnswers: true
---

# Silent empty catch blocks in deploy/proxy

A code review flagged `catch (err) {}` blocks that swallow errors silently:

- `packages/rocketh-deploy/src/index.ts` — `} catch (err) {}`.
- `packages/rocketh-proxy/src/index.ts` — `} catch (err) {}` (around the owner-address fallback logic).

The proxy package also has multiple fallback attempts to obtain the owner address that "could mask issues". Either handle these errors or document why they are intentionally swallowed.

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._
