---
title: Magic storage-slot addresses and CBOR constants undocumented
slug: magic-storage-slots-and-cbor-constants
needsAnswers: true
---

# Magic storage-slot addresses and CBOR constants undocumented

A code review flagged hardcoded magic values that should be named, documented constants:

- `packages/rocketh-proxy/src/index.ts` — proxy storage-slot addresses
  `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` (EIP-1967 implementation slot) and
  `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103` (EIP-1967 admin slot).
- `packages/rocketh-deploy/src/index.ts` — CBOR length handling magic number.

These are well-known EIP-1967 slots; naming + a comment citing the EIP would aid readers. (The EIP-1967 slot values themselves are external ground truth — if verified against the spec they could become a `finding`.)

_Source: reviews/20260520_1445.md (external-agent code review, 2026-05-20). Unverified against current code._
