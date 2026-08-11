<!-- dorfl-sidecar: item=observation:decisions-impersonation-unsupported-hint-and-web-guidance-2026-08-11 type=observation slug=decisions-impersonation-unsupported-hint-and-web-guidance-2026-08-11 allAnswered=false -->

Item: [`observation:decisions-impersonation-unsupported-hint-and-web-guidance-2026-08-11`](../notes/observations/decisions-impersonation-unsupported-hint-and-web-guidance-2026-08-11.md)

## Q1

**Do decisions 3 (note position above tx fields) and 4 (candidacy wording narrowed to remote-signer named accounts) also need explicit ratification, or are they accepted implicitly since they are pinned by a test and are text-only respectively?**

> The note explicitly records that decisions 1 and 2 were RATIFIED by the conductor at the 2026-08-11 requeue and are not reopened; decisions 3 and 4 carry no such ratification marker. Decision 3 is pinned by packages/rocketh-core/test/errors.test.ts; decision 4 is described as unreachable at the seam today and text-only.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Should the staleness risk recorded in decision 2 (call-site infers 'attempted' from the candidate set, second source of truth vs impersonateAccounts) be lifted into a follow-up task now, or left latent until the helper is actually optimised?**

> Decision 2 states the fix if the helper ever early-returns is to have it return {attempted, succeeded} rather than patch the call site; today the per-address try/catch in packages/rocketh/src/environment/index.ts keeps the inference accurate, so no bug exists yet. The observation records the risk deliberately but does not schedule work against it.

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):
