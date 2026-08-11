---
title: Fix unknownSignerPolicy doc residue falsified by per-call ask/auto override
status: open
reviewOf: per-call-ask-override-and-deferral-precedence
promotedFrom: observation:review-nits-per-call-ask-override-and-deferral-precedence-2026-08-10
---

## Context

Gate 2 review of `per-call-ask-override-and-deferral-precedence` (see the review-nits note that spawned this task (deleted on mint; see git history)) approved the change but flagged doc residue. Decisions 1, 2 and 3 from that task were ratified as-is; the only live residue is stale/misplaced documentation that this task fixes.

Before the per-call override shipped, the only thing a policy frame could do was force `throw` (that is what `catchUnknownSigner` pushes). `withUnknownSignerPolicy` from `@rocketh/unknown-signer` now lets a frame push `'ask'` or `'auto'` as well. That invalidates a specific one-directional invariant paragraph, and it also means users need a nesting caveat next to `catchUnknownSigner`'s "always takes the throw path" claim.

## What to build

Four disjoint doc/comment fixes, no runtime behaviour change:

1. **`packages/rocketh/src/environment/unknownSignerPolicy.ts` (~line 28, the `DYNAMIC SCOPE INVARIANT` paragraph immediately BELOW the JSDoc that was updated in the per-call-override commit).** It currently asserts the `Promise.all` frame-leak can only make a concurrent action THROW where it would have prompted, "never the other way round, since a frame only ever forces `throw`". That reason is now false: `withUnknownSignerPolicy` can push `'ask'` or `'auto'`. Rewrite the paragraph so the leak is described as bidirectional (a leaked `throw` frame can make a concurrent action throw where it would have prompted; a leaked `ask`/`auto` frame can make a concurrent action prompt where it would have thrown), and drop the "only forces throw" justification.
2. **Matching text in the `@rocketh/unknown-signer` package module JSDoc and in ADR 0006.** Find the parallel paragraphs there and bring them into line with (1) — same bidirectional framing, no "only forces throw" claim. Grep for the invariant wording to locate both.
3. **`documentation.md` around line 574** (the `catchUnknownSigner` section that flatly says it always takes the throw path whatever the ambient policy). Add a short nesting caveat: an explicit per-call override written INSIDE `catchUnknownSigner` wins, because policy frames are LIFO. This caveat currently only lives in the module JSDoc and in the `## Decisions` block of `work/tasks/done/per-call-ask-override-and-deferral-precedence.md` (decision 3); mirror it into the user-facing doc. The existing test `lets an inner explicit override win over an outer one` is the behavioural anchor.
4. **`documentation.md` new `#### Choosing the policy for ONE call` subsection.** It was inserted mid-narrative and now sits BETWEEN the pause-answers list and the paragraph starting `A DEPLOYMENT from an unsignable from pauses and asks in exactly the same way`, so the deployment address-recovery paragraphs from the previous task render UNDER the wrong heading. Move the new subsection to AFTER that interactive-policy block so the address-recovery paragraphs stay under the interactive-policy heading they belong to.

Out of scope: ratifying decisions 1/2/3 (already ratified on the decisions note); documenting `'auto'` as public per-call surface (ratified as-is, no new user-facing doc required beyond what already ships); any code change to the policy stack itself.

## Acceptance

- The `DYNAMIC SCOPE INVARIANT` paragraph in `unknownSignerPolicy.ts` no longer claims frames only force `throw`, and describes the leak as bidirectional.
- The parallel paragraphs in the `@rocketh/unknown-signer` module JSDoc and ADR 0006 match.
- `documentation.md`'s `catchUnknownSigner` section carries the LIFO / inner-override-wins caveat.
- In `documentation.md`, the `A DEPLOYMENT from an unsignable from …` paragraph renders under the interactive-policy heading, not under `Choosing the policy for ONE call`.
- `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass.

## Prompt

> Fix four pieces of documentation residue left behind by the `per-call-ask-override-and-deferral-precedence` task. No runtime change.
>
> 1. In `packages/rocketh/src/environment/unknownSignerPolicy.ts`, find the `DYNAMIC SCOPE INVARIANT` paragraph (~line 28, just below the JSDoc that was updated in the per-call-override commit). It currently says the `Promise.all` frame leak can only make a concurrent action throw where it would have prompted, "never the other way round, since a frame only ever forces `throw`". That is now false because `withUnknownSignerPolicy` (from `@rocketh/unknown-signer`) can push `'ask'` or `'auto'`. Rewrite the paragraph so the leak is bidirectional (leaked `throw` → concurrent action throws where it would have prompted; leaked `ask`/`auto` → concurrent action prompts where it would have thrown) and drop the "only forces throw" justification.
> 2. Grep for the same invariant wording in the `@rocketh/unknown-signer` package module JSDoc (`packages/rocketh-unknown-signer/src/index.ts`) and in ADR 0006 under `docs/adr/`. Bring both into line with fix (1).
> 3. In `documentation.md` around line 574, the `catchUnknownSigner` section flatly says it always takes the throw path whatever the ambient policy. Add a short nesting caveat: an explicit per-call override written INSIDE `catchUnknownSigner` wins, because policy frames are LIFO. The behavioural anchor is the test `lets an inner explicit override win over an outer one`; the caveat currently only lives in the module JSDoc and in the `## Decisions` block of `work/tasks/done/per-call-ask-override-and-deferral-precedence.md` (decision 3).
> 4. In `documentation.md`, the new `#### Choosing the policy for ONE call` subsection was inserted between the pause-answers list and the paragraph beginning `A DEPLOYMENT from an unsignable from pauses and asks in exactly the same way`. That paragraph belongs under the interactive-policy heading, not under the new one. Move the new subsection to AFTER the deployment address-recovery paragraphs.
>
> Then run `pnpm typecheck`, `pnpm test`, `pnpm format:check`. Do NOT change runtime behaviour. Do NOT re-litigate decisions 1/2/3 from the reviewed task — they are ratified.
>
> Read the `## Decisions` block of `work/tasks/done/per-call-ask-override-and-deferral-precedence.md` for the source context before you start.
