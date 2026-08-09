---
'@rocketh/test-utils': minor
---

Add `createTestEnvironment`, an async harness that constructs a REAL rocketh environment against a mock EIP-1193 provider — so tests exercise the actual `broadcastTransaction`, account-resolution, and impersonation paths instead of a parallel fake. Also exports a Map-backed `createMapDeploymentStore` and gives the default mock receipt a per-transaction `contractAddress`. The legacy `createMockEnvironment` is unchanged and still exported.
