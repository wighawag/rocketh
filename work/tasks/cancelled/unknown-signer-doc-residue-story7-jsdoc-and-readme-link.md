---
promotedFrom: observation:review-nits-unknown-signer-integration-scenarios-2026-08-10
reason: 'superseded: already delivered by c833bda before this task was minted'
cancelledOn: 2026-08-11
---

> **CANCELLED, and the work is DONE — this is not an abandonment.** Story 7's JSDoc no longer claims the whole re-run loop is chain-driven: it separates the deferred UPGRADE (chain-derived) from the v2 implementation DEPLOY (skipped from the persisted deployment record). The README's worked-examples reference is now a GitHub link, since the npm tarball ships `dist` and `src` only.
>
> Why it was minted at all: `dorfl advance` created this task from a human answer that listed the item as live residue. The answer was written during the 2026-08-11 observation triage and was accurate WHEN WRITTEN; the residue was then executed later in that same session, before `advance` ran. The engine reads the ANSWER, not the code, so it could not know. The task template's own drift check ("check this task against current reality — it is a launch snapshot and may have DRIFTED") is the designed guard and would have fired here; cancelling just saves the agent run.

## What to build

Two small documentation fixes in `@rocketh/unknown-signer`, both surfaced as non-blocking nits on the (already-done) `unknown-signer-integration-scenarios` task and ratified by the human as the live residue to act on. Both concern files whose job is to be documentation, so the wording/link matters.

### 1. Narrow the Story 7 JSDoc idempotency claim

File: `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts`, Story 7 `describe` block JSDoc.

Current JSDoc claims the re-run's idempotency comes entirely from on-chain state and "not from anything rocketh wrote down". That is only true for the UPGRADE skip. The second run also skips the v2 implementation DEPLOY, and that skip is driven by the persisted deployment record, not by chain state: see `packages/rocketh-deploy/src/index.ts` around lines 303-373, where the skip path is `env.getOrNull(name)` plus a `deployedBytecode`-minus-CBOR compare — no `eth_getCode` on that path.

Rewrite the JSDoc so the "chain-derived, nothing written down" claim applies ONLY to the deferred upgrade step, and explicitly acknowledge that the v2 implementation deploy is skipped via the persisted deployment record + bytecode compare in `@rocketh/deploy`. A reader of this file (which is the documentation deliverable) must not conclude that `deploy` re-checks code on-chain.

Verify the claim by opening `packages/rocketh-deploy/src/index.ts:303-373` before writing the new wording — do not paraphrase this task's summary of it.

### 2. Fix the README "Worked examples" link

File: `packages/rocketh-unknown-signer/README.md`, "Worked examples" section.

It currently points readers at `test/scenarios.integration.test.ts` "in this package", but `packages/rocketh-unknown-signer/package.json` has `files: [dist, src]`, so the test directory is NOT in the published npm tarball. An npm reader following that pointer finds nothing.

Replace the in-package pointer with a GitHub link to the file at a stable ref (repo `main` is acceptable; match whatever convention other package READMEs in this repo already use for source links — check one or two before choosing). Keep the surrounding prose intact; only the pointer changes.

## Out of scope / already ratified

The other two findings on the parent observation are ratified as-is and MUST NOT be undone by this task:

- `viem` as a test-only devDependency of `@rocketh/unknown-signer` stays.
- The stale `my-rocketh-project` importer block removed from `pnpm-lock.yaml` stays removed.

The parent observation note (the review-nits note that spawned this task (deleted on mint; see git history)) is the only durable record of these ratifications and should be left in place; a separate rung will retire it once this task lands.

## Verification

- `pnpm -F @rocketh/unknown-signer test` still passes (JSDoc-only change to the test file must not alter behaviour).
- `pnpm typecheck` clean.
- `pnpm format:check` clean.
- Manually re-read the Story 7 JSDoc and confirm the claim boundary matches what `packages/rocketh-deploy/src/index.ts:303-373` actually does.
- Manually click the new README link and confirm it resolves to the intended file on GitHub.

## Prompt

> You are picking up two documentation nits left over from the completed `unknown-signer-integration-scenarios` task in the `@rocketh/unknown-signer` package. Both are cheap and both are about files whose job is to be documentation.
>
> 1. In `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts`, the Story 7 `describe` block JSDoc claims the re-run's idempotency comes entirely from on-chain state, "not from anything rocketh wrote down". Before editing, open `packages/rocketh-deploy/src/index.ts` lines 303-373 and confirm for yourself that the deploy-skip path uses `env.getOrNull(name)` plus a `deployedBytecode`-minus-CBOR compare, with no `eth_getCode`. Then narrow the JSDoc so the chain-derived / nothing-written-down claim applies only to the deferred UPGRADE step, and explicitly note that the v2 implementation DEPLOY is skipped via the persisted deployment record plus bytecode compare in `@rocketh/deploy`. Do not change any test behaviour.
> 2. In `packages/rocketh-unknown-signer/README.md`, the "Worked examples" section points at `test/scenarios.integration.test.ts` "in this package", but the package's `files` field is `[dist, src]`, so a reader who installs from npm does not have that file. Replace the in-package pointer with a GitHub link to the test file at a stable ref; match the convention already used by other package READMEs in this repo for source links (grep first).
>
> Do NOT touch the ratified items: leave `viem` as a devDependency of `@rocketh/unknown-signer` alone, and leave the `pnpm-lock.yaml` change (removed `my-rocketh-project` importer block) alone. Leave the parent observation note in `work/notes/observations/` in place.
>
> Verify with `pnpm -F @rocketh/unknown-signer test`, `pnpm typecheck`, and `pnpm format:check`. Follow the repo's ESM + `.js` import rules from `AGENTS.md` even though these edits are prose-only.
