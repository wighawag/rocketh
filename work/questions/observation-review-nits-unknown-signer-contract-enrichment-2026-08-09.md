<!-- dorfl-sidecar: item=observation:review-nits-unknown-signer-contract-enrichment-2026-08-09 type=observation slug=review-nits-unknown-signer-contract-enrichment-2026-08-09 allAnswered=false -->

Item: [`observation:review-nits-unknown-signer-contract-enrichment-2026-08-09`](../notes/observations/review-nits-unknown-signer-contract-enrichment-2026-08-09.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Ratified: threading the metadata into the private choke point rather than catch-and-rethrow; swallowing an ABI-conflict throw during name enrichment and emitting `logger.warn` instead; and `contract` metadata being sent on every `broadcastExecution` call without being validated against the calldata (presentation-only, since `to` and `data` are still printed verbatim).

Two items here are now ACTED ON, not just ratified:

- the sibling unguarded call site (`read`'s retry path calling `fromAddressToNamedABIOrNull` inside a `catch`) is FIXED. A conflict is now treated exactly like no match, so the decode error survives.
- the `origin` naming collision is resolved by renaming the choke point's bag to `BroadcastSource`.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
