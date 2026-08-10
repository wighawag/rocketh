---
needsAnswers: true
---

# `deploy`'s pre-guard never fired for a NAMED bare-address Safe

2026-08-10, noticed while landing `deploy-unsignable-deployer-reaches-seam`.

ADR 0006 (and the task/spec text derived from it) states that `@rocketh/deploy` "performs its OWN `addressSigners` lookup and throws before the transaction reaches the choke point", implying every unsignable deployer died there. Verified against the code: that was only true for a deployer passed as a LITERAL address (no `addressSigners` entry). A named account declared as a bare address always has an entry (`{type:'remote', signer: provider}`), so the guard never fired for the canonical named-Safe spelling, which already reached the seam. Same reason the ADR itself gives for why the seam cannot key off signer-entry presence. The fix (removing the guard) was needed either way and now both spellings behave identically, but the ADR sentence overstates the old blast radius; worth a one-line correction if anyone edits ADR 0006.
