---
'@rocketh/test-utils': minor
---

**Breaking:** remove the legacy `createMockEnvironment` (and its `MockEnvironmentOptions` / `MockEnvironmentResult` types), a fabricated `Environment` literal that reimplemented `broadcastExecution` / `broadcastDeployment` and therefore never executed the real environment module. Migration: use `createTestEnvironment` instead, and `await` it (it is async and returns a REAL rocketh environment wired to a mock provider). `createMockProvider`, `createMockArtifact`, `createMockArtifactWithLibrary` and `createExampleArtifact` are unchanged.
