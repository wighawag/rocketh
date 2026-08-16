---
---

Record why a duplicated `@rocketh/core` is currently harmless, and what would stop that being true.

`@rocketh/core` is a regular dependency published as an exact version, so a consumer mixing packages of different vintages can end up with several copies of it. That is safe only because core holds no module-level mutable state and no seam in the environment or extension path tests module identity: `withEnvironment` sniffs a class from its source text rather than with `instanceof`, `enhanceEnvIfNeeded` detects prior enhancement with a string key rather than a symbol brand, and `setupDeployScripts` layers each script's extensions onto a fresh object so scripts built against different copies coexist. Every module-level mutable binding in the monorepo lives in `rocketh` or `@rocketh/node`, which are peers and therefore single-copy.

Added as `docs/adr/0011-duplicable-core-stays-identity-free.md`, plus a comment on `enhanceEnvIfNeeded` recording that it is first-writer-wins by extension name and why the check is a string key. The invariant was load-bearing but undocumented, so it was easy to break innocently by adding state or an identity check to core.

Documentation and a comment only, no behaviour change, so no release.
