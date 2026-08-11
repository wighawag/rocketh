---
title: Silent empty catch blocks in deploy/proxy
slug: silent-empty-catch-blocks
needsAnswers: false
---

# Silent empty catch blocks in deploy/proxy

A code review flagged `catch (err) {}` blocks that swallow errors silently:

- `packages/rocketh-deploy/src/index.ts` — `} catch (err) {}`.
- `packages/rocketh-proxy/src/index.ts` — `} catch (err) {}` (around the owner-address fallback logic).

The proxy package also has multiple fallback attempts to obtain the owner address that "could mask issues". Either handle these errors or document why they are intentionally swallowed.

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Amend, keep.** The note is now half stale: the `@rocketh/deploy` occurrence it names is GONE. Only `packages/rocketh-proxy/src/index.ts:477` (`} catch (err) {}`, the owner-address fallback) remains. Narrow the note to that one site (append an `## Update` rather than rewriting — this bucket is append-only), and keep it: the surviving site is a real signal, and the fix is probably a comment saying why the throw is deliberately swallowed rather than a behaviour change.
