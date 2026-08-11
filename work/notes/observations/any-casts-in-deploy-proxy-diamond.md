---
title: `any` casts in deploy/proxy/diamond encoding paths
slug: any-casts-in-deploy-proxy-diamond
needsAnswers: false
---

# `any` casts in deploy/proxy/diamond encoding paths

A code review flagged several `as any` casts that sidestep the project's "no `any`" rule:

- `packages/rocketh-deploy/src/index.ts` — `encodeDeployData(argsToUse as any)` (commented `// TODO any`).
- `packages/rocketh-proxy/src/index.ts` — `await _execute(proxyAdminContract.deployment, { ... } as any)`.
- `packages/rocketh-diamond/src/index.ts` — `args: diamondConstructorArgs as any`.

Worth investigating whether these can be replaced with proper type-safe alternatives, or whether they reflect a genuine typing gap in viem/abitype usage. Line numbers from the review may have drifted.

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Keep (resolve, note stays).** Verified still live and still accurate, so it remains a useful standing map of where the "no `any`" rule is broken: `packages/rocketh-deploy/src/index.ts:333` (`encodeDeployData(argsToUse as any) // TODO any`), `packages/rocketh-proxy/src/index.ts:347,352,359,364,371,376,475`, `packages/rocketh-diamond/src/index.ts:207,441`. Not promoting to a task now: the fix is a viem/abitype generics exercise with no user-visible payoff, and the note is worth more as the map than as a scheduled chore.
