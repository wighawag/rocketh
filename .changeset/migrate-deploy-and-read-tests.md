---
---

Migrate `@rocketh/deploy`'s and `@rocketh/read-execute`'s integration tests off the fabricated `createMockEnvironment` and onto `createTestEnvironment`, so they exercise the real environment and the single `broadcastTransaction` choke point instead of a parallel fake. Tests only, no published code changed; `createMockEnvironment` is untouched and still used by the proxy and diamond suites.
