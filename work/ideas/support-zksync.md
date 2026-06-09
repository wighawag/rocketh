---
title: Support zkSync
slug: support-zksync
---

## Idea

Add support for deploying to **zkSync** networks.

Blocked on external: gated on **Hardhat v3 supporting zkSync** (per the original `TODO.md` note). Until that lands this is not buildable — captured here as a proposed direction rather than a backlog slice.

## Provenance

Migrated from `TODO.md`: "support zksync (once hardhat v3 supports it)".

## Notes

When the upstream dependency lands, this can graduate to a PRD/slice. At that point, scope what zkSync support means for rocketh specifically (its non-standard deployment / bytecode model may interact with `strictBytecodeMatch` and the deploy path).
