<!-- dorfl-sidecar: item=spec:explore-unknown-signer-adapters type=spec slug=explore-unknown-signer-adapters allAnswered=true -->

Item: [`spec:explore-unknown-signer-adapters`](../specs/ready/explore-unknown-signer-adapters.md)

## Q1

**Batching vs active protocols: should batching live ONLY on the collect-and-defer side (a post-run batch consumer over collected txs), or is a deferring-protocol lifecycle hook (flush() after all scripts, reconcile results back into state) ever worth its weight? Spike to a recommendation.**

> Spec 'Open questions' #1 (work/specs/ready/explore-unknown-signer-adapters.md). catchUnknownSigner batches naturally (collect-and-defer, terminal, non-interactive); an ACTIVE per-tx protocol (prompt/propose per tx) is blocking and does not batch for free. 'Further Notes' records a lean toward batching-on-consumer-side, with the deferring-protocol hook left explicitly open.

_Suggested default: Batching lives only on the collect-and-defer consumer side; no deferring-protocol flush() hook in v1._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

Collect-and-defer side only. No `flush()` hook, and the question is now settled by something stronger than a preference.

A deferring protocol that lets the run CONTINUE past an unsignable step has to return something to the caller, because the seam sits inside `broadcastTransaction` and must hand back a real transaction hash for the normal pipeline (`savePendingExecution` / `waitForTransaction`) to take over. It cannot, so it would have to fabricate a hash, a receipt, and for a deploy an address for a contract that does not exist. That is the same argument that rejected a `'collect'` policy value, recorded in ADR 0012.

The `flush()` half fails independently: "reconcile results back into state" means recording that a proposal was made, and a record can only assert what rocketh OBSERVED (ADR 0012 again). A proposal is not an observation. It would put authority in a cache, in the one place where the cache being wrong means somebody took over your governance.

The producer side is now specced concretely as `deferred-transaction-collector`: a scope form over `catchUnknownSigner` returning the collected transactions in order, persisting nothing, knowing nothing about Safe.

## Q2

**Persisted batch schema — what does the FIRST consumer need (raw tx list? Safe MultiSend encoding? Timelock-wrapped ops? provenance/origin.scriptId? chainId/safe address)? Design the schema AROUND that consumer.**

> Spec 'Open questions' #2. Implementation Decisions require the schema be defined WITH its consumer and NOT participate in script re-execution/idempotency (that stays on-chain-state-driven per unknown-signer-core). A .unsigned_transactions.json file only earns its place once a concrete consumer exists.

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

There IS a file, and the first consumer already exists: the user's own `runAtTheEnd` script plus the Safe library they have already written. Both production teams in the field study built exactly that, so the rule "design the schema around its consumer" is satisfiable now rather than deferred.

(An earlier answer here said no file, on the grounds that the consumer did not exist yet. That was over-reading "rocketh persists nothing", which is a property of the SEAM. See the 2026-08-27 amendment to ADR 0012. Keeping it in memory also made a halted run lose the batch, which is a worse outcome than the file it was avoiding.)

The schema is what a proposer needs and nothing more: the deferred transactions in `{from, to, value, data}` v1 shape, in the order they were surfaced, plus the chain id and which script surfaced each. It ships in `deferred-transaction-collector` as `.pending_transactions.json`, dot-prefixed so the deployment loader ignores it, written through `deploymentStore` so it works in the browser.

Three constraints that make it safe: it is OPT-IN, so the v1 no-side-effects guarantee holds for anyone who did not ask; NOTHING READS IT, so it never becomes a second source of truth or participates in idempotency; and it is cleared at run start and written when the script phase completes, so a halted run leaves it empty rather than partial or stale.

Still NOT in scope here: MultiSend encoding, which is Q3.

## Q3

**Safe submission surface: raw tx list for manual paste, Safe MultiSend calldata, or a direct Safe Transaction Service proposal via the Safe SDK — which? And does the Safe SDK become an OPTIONAL dependency kept out of core?**

> Spec 'Open questions' #3 + Implementation Decisions ('Safe SDK, if used, is an optional dependency kept out of @rocketh/core'). The three surfaces have very different dependency footprints and UX; picking one shapes the first-consumer schema in Q2.

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

rocketh ships the ARTIFACT, never the proposal.

Concretely: the collected transaction list (which `deferred-transaction-collector` already produces) and, if a consumer is built, MultiSend calldata, which is pure encoding with no network, no authentication, no service URL per chain, and works offline and in the browser. A direct Safe Transaction Service proposal is the opposite on every one of those axes, and it is the part teams already have: both production teams in the field study wrote their own proposal layer, one of them noting their deployer holds a delegate role, which is an authorisation arrangement rocketh has no business modelling.

So the Safe SDK does not enter this repo at all in M1. If a `@rocketh/safe` package is ever built, the SDK is its dependency and nobody else's, per ADR 0005.

## Q4

**Does the v1-style account-scoped 'external'/'safe' active wait-for-hash protocol (alongside privateKey/ledger) still earn its place once the policy/call-level interactive resolver from unknown-signer-interactive exists, or does the resolver subsume it?**

> Spec 'Open questions' #4. v1 prior art referenced at ../hardhat-deploy-v1/src/helpers.ts:1680. Answering 'subsumed' avoids building redundant paths on the signer-protocol axis.

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):

Subsumed. Do not port it, and there is a sharper reason than redundancy.

v1's `external` protocol was a category error: it lived on the signer-protocol axis, alongside `privateKey` and the hardware protocols, and it never signed anything. ADR 0006 removed exactly that confusion by making signability an explicit classification (`local` / `node` / `impersonated` / `unsignable`) computed at setup rather than inferred from the presence of a signer entry. Reintroducing a "protocol" for an account that cannot sign would put the old ambiguity back one layer down.

The behaviour it provided (present the transaction, wait for the hash, continue) is what the `ask` policy does now, at the seam, for any unsignable account, with inclusion verified and the pasted hash's intent classified before anything is saved. That is strictly more than v1 did.

If per-ACCOUNT control is ever wanted (this Safe always waits, that one always throws), the right shape is a policy declared per named account, not a signer protocol, because the axis is "what should happen when we cannot sign" and not "how do we sign". Related: `work/notes/ideas/per-call-autoimpersonate.md`.

## Q5

**Is launching a browser tab / WalletConnect signing page in scope, and can it batch (one page for N txs)? Feasibility spike required before any build spec.**

> Spec 'Open questions' #5. User Story 5 asks for a feasibility read on whether it is worth a build spec at all.

<!-- q5 fields: id=q5 -->

**Your answer** (write below this line):

Out of scope, and not spiked, because it is not on the milestone's path.

The feasibility note for the record: a signing page is a UI and runtime concern rather than a deployment-flow one, it needs a served page and a wallet session that core cannot assume, and rocketh already has an unresolved question one layer beneath it, namely how a browser run asks a human for anything at all (`work/notes/ideas/web-text-prompt-needs-a-ui-integration-point.md`, and ADR 0007 on the prompt capability). Answering that is the prerequisite; a signing page is one possible consumer of the answer, and `@rocketh/web` is where it would live.

Revisit only if someone asks for it. Nobody in the field study did.
