---
title: `any` casts in deploy/proxy/diamond encoding paths
slug: any-casts-in-deploy-proxy-diamond
needsAnswers: true
---

# `any` casts in deploy/proxy/diamond encoding paths

A code review flagged several `as any` casts that sidestep the project's "no `any`" rule:

- `packages/rocketh-deploy/src/index.ts` — `encodeDeployData(argsToUse as any)` (commented `// TODO any`).
- `packages/rocketh-proxy/src/index.ts` — `await _execute(proxyAdminContract.deployment, { ... } as any)`.
- `packages/rocketh-diamond/src/index.ts` — `args: diamondConstructorArgs as any`.

Worth investigating whether these can be replaced with proper type-safe alternatives, or whether they reflect a genuine typing gap in viem/abitype usage. Line numbers from the review may have drifted.

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._
