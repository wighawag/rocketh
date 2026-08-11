---
promotedFrom: observation:strict-bytecode-match-untested-and-undocumented
reason: 'superseded: already delivered by bf7ee52 before this task was minted'
cancelledOn: 2026-08-11
---

> **CANCELLED, and the work is DONE — this is not an abandonment.** `documentation.md` gained the "When does a re-run REDEPLOY?" section covering `strictBytecodeMatch` alongside `skipIfAlreadyDeployed` and `alwaysOverride`, and `packages/rocketh-deploy/test/strict-bytecode-match.integration.test.ts` pins BOTH directions on the same pair of artifacts (a metadata-only difference is reused by default, redeployed under `strictBytecodeMatch: true`), verified by mutation. The follow-on commit `2ea36e3` then fixed two real bugs in the CBOR stripping that this coverage exposed.
>
> Why it was minted at all: `dorfl advance` created this task from a human answer that listed the item as live residue. The answer was written during the 2026-08-11 observation triage and was accurate WHEN WRITTEN; the residue was then executed later in that same session, before `advance` ran. The engine reads the ANSWER, not the code, so it could not know. The task template's own drift check ("check this task against current reality — it is a launch snapshot and may have DRIFTED") is the designed guard and would have fired here; cancelling just saves the agent run.

## Context

A code review (reviews/20260520_1445.md, 2026-05-20) flagged that the `strictBytecodeMatch` option — an opt-out of the non-strict bytecode matching decision recorded in ADR 0004 — was landed without tests or docs. Verified live:

- `strictBytecodeMatch` appears NOWHERE in `documentation.md`.
- No test references it. `packages/rocketh-deploy/test/deploy.integration.test.ts` covers `alwaysOverride` only.
- It is wired in four call sites: `packages/rocketh-deploy/src/index.ts:297` and `:345`, `packages/rocketh-diamond/src/index.ts:71`, `packages/rocketh-router/src/index.ts:63`.
- `@rocketh/proxy` deliberately sets `strictBytecodeMatch: false` for proxy deployments but the reason is not commented.

Because ADR 0004 makes non-strict matching a deliberate default, an undocumented + untested opt-out is a correctness edge, not a tidiness one — a user reaching for `strictBytecodeMatch` today has no reference for what it does or a regression net protecting the behaviour they depend on.

Sibling review points about `alwaysOverride` are already covered by existing tests; this task is scoped to `strictBytecodeMatch` plus the CBOR-strip cleanup that lives on the same code path.

## What to build

1. **Dedicated tests** for `strictBytecodeMatch` in `packages/rocketh-deploy/test/` (integration-style, following the existing `alwaysOverride` tests as a template). Cover at minimum:
   - `strictBytecodeMatch: true` — a deployment whose on-chain bytecode differs from the artifact ONLY in the CBOR metadata trailer is treated as a mismatch (redeploys / reports as changed), whereas the default behaviour would treat it as a match.
   - `strictBytecodeMatch: false` (or omitted) — the same metadata-only-differing bytecode is treated as a match (the ADR 0004 behaviour).
   - Interaction with `alwaysOverride` if any (document what wins).
   - If practical, a parallel test for the diamond and/or router call sites so all four wire-up points are exercised.
2. **Documentation** in `documentation.md`: a section describing `strictBytecodeMatch` (and, adjacent, `alwaysOverride`), what problem it solves, its relationship to ADR 0004's non-strict default, and when a user should reach for it. Cross-link the ADR.
3. **Named constants for the CBOR-strip magic values** in `packages/rocketh-deploy/src/index.ts` (currently around lines 297 and 345). Replace bare literals like the `parseInt(last2Bytes, 16)` CBOR-length read with named constants plus a short comment explaining the CBOR metadata trailer layout. Restructure the `!strictBytecodeMatch` guard so the stripping flow reads top-to-bottom.
4. **Explanatory comment** at the `@rocketh/proxy` call site that sets `strictBytecodeMatch: false`, stating why proxies opt out (bytecode metadata differences across proxy variants / compilations are expected and must not trigger redeploys).

## Acceptance

- New tests fail against a build where `strictBytecodeMatch` is silently ignored, and pass against current `main`.
- `documentation.md` contains a `strictBytecodeMatch` section discoverable by search.
- No unexplained magic numbers remain in the CBOR-strip block.
- `@rocketh/proxy`'s `strictBytecodeMatch: false` has an adjacent explanatory comment.
- `pnpm typecheck`, `pnpm test`, `pnpm format:check` all pass.

## Prompt

> `strictBytecodeMatch` shipped in `@rocketh/deploy` (and is threaded through `@rocketh/diamond` and `@rocketh/router`; `@rocketh/proxy` explicitly opts out) as an opt-out of the non-strict bytecode-matching default recorded in ADR 0004, but it has no tests and no mention in `documentation.md`. Add dedicated integration tests in `packages/rocketh-deploy/test/` (model them on the existing `alwaysOverride` tests) that prove `strictBytecodeMatch: true` treats CBOR-metadata-only bytecode differences as a mismatch while the default treats them as a match; extend coverage to the diamond/router call sites if practical. Add a `strictBytecodeMatch` section to `documentation.md` (also cover `alwaysOverride` there), cross-linking ADR 0004 and explaining when to reach for it. In `packages/rocketh-deploy/src/index.ts` around lines 297 and 345, replace the CBOR-strip magic values (notably the `parseInt(last2Bytes, 16)` CBOR-length read) with named constants and a short comment explaining the CBOR metadata trailer layout, and restructure the `!strictBytecodeMatch` guard so the flow reads top-to-bottom. Add a comment at the `@rocketh/proxy` site that sets `strictBytecodeMatch: false` explaining why proxies opt out. Verify: the new tests fail if `strictBytecodeMatch` is stubbed to a no-op, `pnpm typecheck`, `pnpm test`, and `pnpm format:check` all pass.
