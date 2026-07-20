---
title: Commented-out proxy tests and documentation drift
slug: commented-out-proxy-tests-and-doc-drift
needsAnswers: true
---

# Commented-out proxy tests and documentation drift

A code review flagged two maintenance signals:

**Commented-out tests:**
- `packages/rocketh-proxy/test/proxy.integration.test.ts` — Transparent Proxy and Optimized Transparent Proxy tests are commented out with `// TODO`. Either implement or remove.

**Documentation drift:**
- `documentation.md` references `rocketh.ts` but the current pattern uses `rocketh/config.ts`.
- Some examples use older patterns that have been superseded.
- Complex functions (deploy, deployViaProxy, diamond) lack JSDoc.

Also noted (lower priority): potential code duplication of bytecode-matching logic across deploy/proxy/diamond that could be extracted to `@rocketh/core`; coupling to `hardhat-deploy-v1-artifacts` in `@rocketh/proxy`.

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._
