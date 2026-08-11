---
---

Repo tooling and docs only: make `test:getting-started` restore the root lockfile instead of leaking a phantom importer, and record why it is not moved to a temp dir (ADR 0008). No package behaviour changes.
