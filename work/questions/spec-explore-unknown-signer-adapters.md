<!-- dorfl-sidecar: item=spec:explore-unknown-signer-adapters type=spec slug=explore-unknown-signer-adapters allAnswered=false -->

Item: [`spec:explore-unknown-signer-adapters`](../specs/ready/explore-unknown-signer-adapters.md)

## Q1

**Batching vs active protocols: should batching live ONLY on the collect-and-defer side (a post-run batch consumer over collected txs), or is a deferring-protocol lifecycle hook (flush() after all scripts, reconcile results back into state) ever worth its weight? Spike to a recommendation.**

> Spec 'Open questions' #1 (work/specs/ready/explore-unknown-signer-adapters.md). catchUnknownSigner batches naturally (collect-and-defer, terminal, non-interactive); an ACTIVE per-tx protocol (prompt/propose per tx) is blocking and does not batch for free. 'Further Notes' records a lean toward batching-on-consumer-side, with the deferring-protocol hook left explicitly open.

_Suggested default: Batching lives only on the collect-and-defer consumer side; no deferring-protocol flush() hook in v1._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Persisted batch schema — what does the FIRST consumer need (raw tx list? Safe MultiSend encoding? Timelock-wrapped ops? provenance/origin.scriptId? chainId/safe address)? Design the schema AROUND that consumer.**

> Spec 'Open questions' #2. Implementation Decisions require the schema be defined WITH its consumer and NOT participate in script re-execution/idempotency (that stays on-chain-state-driven per unknown-signer-core). A .unsigned_transactions.json file only earns its place once a concrete consumer exists.

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

## Q3

**Safe submission surface: raw tx list for manual paste, Safe MultiSend calldata, or a direct Safe Transaction Service proposal via the Safe SDK — which? And does the Safe SDK become an OPTIONAL dependency kept out of core?**

> Spec 'Open questions' #3 + Implementation Decisions ('Safe SDK, if used, is an optional dependency kept out of @rocketh/core'). The three surfaces have very different dependency footprints and UX; picking one shapes the first-consumer schema in Q2.

_Suggested default: Start with MultiSend calldata as the first concrete consumer; Safe SDK, if adopted, ships as an optional dep in a separate @rocketh/safe package._

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

## Q4

**Does the v1-style account-scoped 'external'/'safe' active wait-for-hash protocol (alongside privateKey/ledger) still earn its place once the policy/call-level interactive resolver from unknown-signer-interactive exists, or does the resolver subsume it?**

> Spec 'Open questions' #4. v1 prior art referenced at ../hardhat-deploy-v1/src/helpers.ts:1680. Answering 'subsumed' avoids building redundant paths on the signer-protocol axis.

_Suggested default: Subsumed by the interactive resolver; do not port v1's account-scoped external/safe protocol._

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):

## Q5

**Is launching a browser tab / WalletConnect signing page in scope, and can it batch (one page for N txs)? Feasibility spike required before any build spec.**

> Spec 'Open questions' #5. User Story 5 asks for a feasibility read on whether it is worth a build spec at all.

_Suggested default: Out of scope for this exploration; record a feasibility note and defer to a separate future spec if demand appears._

<!-- q5 fields: id=q5 -->

**Your answer** (write below this line):
