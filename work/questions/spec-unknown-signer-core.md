<!-- dorfl-sidecar: item=spec:unknown-signer-core type=spec slug=unknown-signer-core allAnswered=false -->

## Q1

**'spec:unknown-signer-core' was bounced — how should we proceed?**

> The task acceptance gate (fresh-context review of the produced SET) blocked 'unknown-signer-core'. The spec is routed to needs-attention with no tasks landed; a human must resolve the blocking findings, then re-task.
>
> PR/code review (Gate 2) blocked this work:
> - Story 9 ('catchUnknownSigner forces throw even under a global impersonate/auto default') is not actually delivered by this task set — the two tasks contradict each other on its mechanism. (unknown-signer-broadcast-seam.md open question 2 states plainly: 'story 9 ... is undelivered by this plan' because the seam only consults the pushed policy when !signer, and an impersonated `from` has a signer entry from env setup, so the pushed 'throw' frame is never read. unknown-signer-catch-wrapper-package.md nonetheless lists story 9 under 'covers' and claims 'the push/pop stack works end-to-end' — but if the seam never reads the stack for impersonated accounts, the wrapper's push is a no-op for exactly the scenario story 9 describes. The set must pick option (i)/(ii)/(iii) before it can land; the wrapper's covers-9 claim is currently incorrect-if-implemented.)
> - The `contract.name` source for the `execute`/`executeByName` call sites is unresolved (broadcast-seam open question 1) and picks between four options with materially different surface areas — one of them widens `MinimalDeployment` in `@rocketh/core`, which is a broader core change the spec did not sanction. This must be resolved before the seam task lands; leaving it to the builder invites silent spec drift on a core type.
> - The spec's Autonomy notes explicitly assert 'no open questions — every story is resolved and agent-taskable', yet the tasker surfaced two genuine decomposition-level questions (`needsAnswers: true` on the seam task). The spec needs to be updated (or the questions answered) before the set is coherent; otherwise the seam task cannot start and its downstream (wrapper) inherits an unstable premise.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
