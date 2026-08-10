---
---

Migrate `@rocketh/proxy`'s and `@rocketh/diamond`'s integration tests off the fabricated `createMockEnvironment` and onto `createTestEnvironment`, so every implementation, facet and proxy deployment goes through the real environment and the single `broadcastTransaction` choke point instead of a parallel fake. Tests only, no published code changed.
