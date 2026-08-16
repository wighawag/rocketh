---
---

Test-only: resolve the TypeScript compiler used by `@rocketh/export`'s compile tests through the module system rather than from `process.cwd()`, and fail loudly when it cannot run at all. No change to published code.
