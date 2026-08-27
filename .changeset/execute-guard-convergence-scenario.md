---
---

Document the loop the `execute` guard closes: a new scenario suite in `@rocketh/unknown-signer` runs one unedited script twice, deferring a Safe-only proxy upgrade on the first run and skipping it on the second once the Safe executed it out of band, asserting that nothing is persisted between the two. Tests and README only; no shipped code changes.
