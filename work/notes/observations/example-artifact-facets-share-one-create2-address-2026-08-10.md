---
date: 2026-08-10
needsAnswers: true
---

# Three "different" facets in the diamond multi-facet test share one create2 address

`createExampleArtifact(name, templateNumber)` (`packages/rocketh-test-utils/src/index.ts:297`) varies only the ABI; the bytecode is whatever `createMockArtifact` returns, identical for every template. So in `packages/rocketh-diamond/test/diamond.integration.test.ts` → `should demonstrate diamond with multiple facets`, the `UserFacet` / `PaymentFacet` / `AdminFacet` facets (all deployed deterministically, as facets default to `deterministic: true`) all resolve to the SAME create2 address, and the diamond's facet snapshot lists three cuts pointing at one contract. The test still passes.

Pre-existing, not introduced by the `createTestEnvironment` migration (deterministic facet addresses are computed by `@rocketh/deploy` the same way under either harness), and left as-is to preserve the migrated test's intent. Spotted while migrating batch 2 (`migrate-proxy-diamond-tests`); fixing it means giving `createExampleArtifact` per-template bytecode.
