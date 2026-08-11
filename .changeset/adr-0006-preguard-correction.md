---
---

Docs only: ADR 0006 gains a dated correction. Its sentence about `@rocketh/deploy`'s own pre-guard was in the present tense and overstated the guard's blast radius: the guard tested for the PRESENCE of an `addressSigners` entry, so it never fired for a named bare-address Safe (which always has one) and fired only for a deployer passed as a literal address. The guard has since been removed, and the correction also records the one user-visible consequence of removing it (a deterministic deploy from an unsignable deployer can emit the create2-factory transaction, and possibly a funding transfer from that account, before the `UnknownSignerError` surfaces).
