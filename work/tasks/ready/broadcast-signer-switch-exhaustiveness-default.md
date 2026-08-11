---
promotedFrom: observation:broadcast-signer-switch-has-no-default-2026-08-09
needsAnswers: false
---

## What to build

Close the missing `default` in the signer-routing `switch` inside `broadcastTransaction` at `packages/rocketh/src/environment/index.ts:1203`. The switch currently covers the three `Signer` variants (`wallet | remote | signerOnly`) but has no `default:` at all, so a runtime `signer.type` outside the union falls off the end and `broadcastTransaction` silently returns `undefined` as a transaction hash — which then flows into `savePendingExecution` and fails somewhere confusing. This is precisely the class of opaque failure the unknown-signer work exists to remove.

The fix must match the idiom this repo already uses (see precedent at `packages/rocketh/src/environment/unknownSignerPolicy.ts:81`: `const exhaustive: never = policy;`): a `default:` branch that BOTH

1. performs a compile-time exhaustiveness assignment (`const _exhaustive: never = signer;` or equivalent) so a future fourth `Signer` variant fails to COMPILE at this site, AND
2. throws a clear runtime error naming the unexpected `signer.type` (for the cast / JS-caller / protocol-contract-violation paths that TypeScript cannot rule out — `Signer` values come from user-supplied `userConfig.signerProtocols`).

Do not invent a second idiom; mirror the `unknownSignerPolicy.ts` shape.

## Why this is its own task

The observation originally suggested riding along with `unknown-signer-contract-enrichment`, but that task has already landed (`work/tasks/done/unknown-signer-contract-enrichment.md`) and the same seam has since been touched twice more (`interactive-deployment-address-recovery`, `per-call-ask-override-and-deferral-precedence`) without anyone picking this up. Ride-along is not happening on its own; mint it explicitly.

## Acceptance

- `packages/rocketh/src/environment/index.ts` — the signer-routing `switch` in `broadcastTransaction` has a `default:` branch that (a) assigns `signer` (narrowed to `never`) to a `never`-typed local and (b) throws an `Error` whose message names the unexpected `signer.type`.
- Removing any one of the existing `case` arms causes `pnpm typecheck` to FAIL at the `never` assignment (manually verified once; do not commit the removal).
- `pnpm typecheck` and `pnpm test` pass.
- No behavioural change on the three real variants (`wallet`, `remote`, `signerOnly`).

## Prompt

> Add an exhaustive `default:` branch to the signer-routing `switch` in `broadcastTransaction` at `packages/rocketh/src/environment/index.ts` (around line 1203, which currently switches on `signer.type` over `wallet | remote | signerOnly` with no `default`). Mirror the idiom already used in this repo at `packages/rocketh/src/environment/unknownSignerPolicy.ts:81` (`const exhaustive: never = policy;`): inside the new `default:`, first do a compile-time exhaustiveness assignment against `signer` (narrowed to `never`) so a future fourth `Signer` variant fails to COMPILE at this call site, then `throw new Error(...)` with a message that names the unexpected `signer.type` at runtime — this covers cast / JS-caller / user-supplied-`signerProtocols`-that-violate-their-own-type-contract paths, which would otherwise cause `broadcastTransaction` to silently return `undefined` and fail confusingly downstream in `savePendingExecution`. Do not invent a second idiom; match `unknownSignerPolicy.ts`. Verify manually (do not commit) that temporarily deleting one of the `case` arms makes `pnpm typecheck` fail at the `never` assignment. Then confirm `pnpm typecheck` and `pnpm test` pass. No behavioural change on the three real variants.

## Applied answers 2026-08-11

### q1: 'task:broadcast-signer-switch-exhaustiveness-default' was bounced — how should we proceed?

**CONTINUE from the branch tip — do NOT discard the work and do NOT re-do it.**

The implementation on `work/task-broadcast-signer-switch-exhaustiveness-default` (`6a259e8`) is complete: the `default` branch with an exhaustiveness assignment plus a throw naming the unexpected `signer.type`, a changeset, and the `ready -> done` move. Nothing about the CODE was rejected.

The gate failed at its FIRST step, `pnpm format:check`, on two files, and only one of them belongs to this task:

- `packages/rocketh-core/src/types.ts` — **NOT this task's doing.** The dependency bump in `b34e921` brought a prettier whose union layout differs and left this file unformatted on `main`, so it failed EVERY gate run until `022aacd` fixed it. That fix is now on `main`, so this half is already gone.
- `packages/rocketh/src/environment/index.ts` — **this task's own new code**, genuinely unformatted.

So the remaining work is one `prettier --write` on that second file. Rebase the kept branch onto current `main` (which now carries the `types.ts` fix), run `pnpm format`, and re-run the gate; `format:check` should be clean.

Two things for whoever picks it up: verify the `default` branch still matches the repo idiom (`const exhaustive: never = signer;`, the precedent at `packages/rocketh/src/environment/unknownSignerPolicy.ts:81`) so a future fourth `Signer` variant fails to COMPILE and not merely at runtime; and note that this task's own acceptance asks for BOTH halves, compile-time and runtime, not either one.
