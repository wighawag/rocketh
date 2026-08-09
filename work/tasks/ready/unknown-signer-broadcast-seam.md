---
title: broadcastTransaction unknown-signer seam + onUnknownSigner policy + push/pop frame stack
slug: unknown-signer-broadcast-seam
spec: unknown-signer-core
blockedBy: [unknown-signer-error-type, account-signability-classification]
covers: [4, 5, 6, 11]
---

## Files this task owns

Scope fence, stated explicitly because an earlier draft of this task contradicted itself:

- `packages/rocketh/src/environment/` — the seam, the policy resolution, the frame stack.
- `packages/rocketh/src/executor/` and `packages/rocketh/src/environment/chains.ts` — the `onUnknownSigner` precedence chain, mirroring how `autoImpersonate` is already threaded.
- `packages/rocketh-core/src/types.ts` — two additions: the config/env types for `onUnknownSigner` (it sits beside `autoImpersonate`, which appears in several places in this file), AND the policy-frame push/pop helpers on the `Environment` interface. The helpers MUST be declared in core, not left as an untyped internal: `@rocketh/unknown-signer` depends on `@rocketh/core` only, so if they are not on the interface the wrapper package cannot call them without either a cast or a dependency it is not supposed to have.

Both `@rocketh/core` edits above are additive and PRE-AUTHORISED by this task, so do not stall on `AGENTS.md`'s ask-first rule for core types, and do not work around them with a cast.

NOT owned here: `packages/rocketh-deploy` (its own signer guard belongs to `deploy-unsignable-deployer-reaches-seam`), and the `contract` enrichment on the execute path (`unknown-signer-contract-enrichment`).

## What to build

Wire the "unsignable `from`" seam into rocketh at the ONE transaction choke point, `broadcastTransaction`. Because `deploy`, `execute`, `tx` and the proxy upgrade path all funnel through it, this is what makes the mechanism transaction-agnostic.

Pieces of the vertical:

1. **Decide on signability, not on signer presence.** Use the `addressSignability` view from the previous task. `local`, `node` and `impersonated` broadcast exactly as today. Only `unsignable` reaches the policy. Impersonation has already run by then, so if it resolved the account the seam never fires — `autoImpersonate` and `onUnknownSigner` stay orthogonal and `autoImpersonate` is not touched here.

2. **Add `onUnknownSigner: 'throw' | 'auto'`** as a run/chain-level policy resolved with the same precedence as the existing execution params (execution param > chain config > default). Default `'auto'`, which degrades to `'throw'` in this spec because no interactive resolver ships yet. Non-interactive/CI never prompts and never hangs. Do NOT add an `'impersonate'` value.

3. **A policy frame stack on the environment**, with push/pop helpers the wrapper package will call. A frame is an OBJECT carrying a policy (`{policy: 'throw'}`), never a bare string, so `unknown-signer-interactive` can push `'ask'` later without re-cutting this seam. The effective policy is `top-of-stack?.policy ?? resolvedGlobal`. Dynamic scope is safe because rocketh executes deploy scripts sequentially (single-await); document that invariant next to the helpers.

   **A frame changes what happens to an `unsignable` account only.** It never turns a `local` / `node` / `impersonated` account into a throw. This is the distinction that already drifted once and bounced an earlier task set (see ADR 0006): the frame forces `throw` over `ask`, never over impersonation. Encode it so it cannot be misread — the frame is consulted inside the `unsignable` branch, not before the signability check.

4. **Throw at the seam.** When the effective policy is `throw`, construct and throw `UnknownSignerError` populated from the tx (`from`, `to`, `data`, `value`), replacing the current opaque `cannot get signer for ${from}` error at this call site.

   **Keep a defensive not-found throw.** This task replaces the guard inside `broadcastTransaction` that today catches "classified signable, but no signer entry found". (The other such guard, in `@rocketh/deploy`, is NOT yours — see point 6.) The known cause of such a disagreement (the `addressSigners` key casing defect) was fixed in commit `09ea46d`, so this is not guarding a live hazard — do not go hunting for one. It guards future divergence between the signability view and the signer map, and it is cheap: if they ever disagree, the result must be a clear error naming the address rather than a `TypeError` on `undefined`.

5. **Leave `contract` unset.** The enrichment is a separate task (`unknown-signer-contract-enrichment`) because it necessarily touches three other packages. The error's `contract` field stays optional and unpopulated here. Note for that task's benefit: `broadcastExecution` currently calls `broadcastTransaction(transaction)` with NO options, so the enrichment is not merely a matter of adding a field to an existing bag — that task owns solving it.

6. **NOT the second signer guard in `deploy`.** `packages/rocketh-deploy` performs its own `env.addressSigners[address]` lookup and throws the same opaque `cannot get signer` error before building the transaction, so a deploy from an unsignable account dies there and never reaches this choke point. That genuinely must be fixed, but NOT here: it changes another package and could not be tested from within this task's fence (`packages/rocketh/test/` cannot import `@rocketh/deploy`). It is owned by `deploy-unsignable-deployer-reaches-seam`, which is blocked on this task and on the harness. Leave that guard alone.

Test coverage on this task:

- (story 4) an unwrapped call from an `unsignable` `from` throws `UnknownSignerError` with the correct payload, not a raw RPC error.
- (story 5) the same fires through BOTH funnels, `broadcastExecution` (the path `execute`, `executeByName` and `tx` take) and `broadcastDeployment` (the path `deploy` takes), including a value-carrying transaction. Driving the extension helpers themselves is `unknown-signer-integration-scenarios`' job, not yours. NOTE the vocabulary trap: `TransactionToBroadcast` with `type: 'raw'` means an ALREADY-SIGNED transaction, which returns from `broadcastTransaction` before any signer lookup and can therefore never produce an `UnknownSignerError`. Do not write a test asserting it does; the intended "plain tx" path is `tx()`, which produces `type: 'object'`.
- (story 6) mixed: signable txs broadcast normally, only the unsignable one throws.
- (story 11) `onUnknownSigner: 'auto'` with no frame resolves to throw — no prompt, no hang.
- policy resolution: a pushed frame wins over the resolved global; popping restores it; `pop` is not skipped when the action throws. **This mechanism delivers no user story in this slice** and is built deliberately as forward-compat for `unknown-signer-interactive`, which adds the `'ask'` policy that makes the precedence observable (see that spec's story 8). Unit-test the plumbing; do not claim a story for it.
- an `impersonated` account still broadcasts, INCLUDING with a `'throw'` frame pushed. This is the anti-regression test for the drift ADR 0006 records.

Note on overlap: stories 5 and 6 are also covered by `unknown-signer-integration-scenarios`. That is deliberate and not duplication — here they are seam-level tests driven through the choke point, there they are headline documentation-style scenarios driven through `catchUnknownSigner`.

**Where these tests live.** In `packages/rocketh/test/`, building a real environment with a small local mock provider, following `addressSigners-casing.test.ts` and the sibling `account-signability-classification` tests. Do NOT use `@rocketh/test-utils`: `rocketh` deliberately does not depend on it, and adding that devDependency would close a project-graph cycle against `nx`'s `dependsOn: ["^build"]`.

That constrains HOW you drive the seam, and the constraint is a good one. You cannot import `@rocketh/deploy` or `@rocketh/read-execute` from here, so drive the two public funnels on the `Environment` interface directly: `broadcastExecution` (which is what `execute` and `tx` call) and `broadcastDeployment` (which is what `deploy` calls). Exercising both IS the proof that the choke point is single. End-to-end coverage through the extension packages belongs to `unknown-signer-integration-scenarios`, which lives in a package that may depend on the shared harness.

## Acceptance criteria

- [ ] The seam decides on `addressSignability`; `local` / `node` / `impersonated` broadcast unchanged, only `unsignable` reaches the policy.
- [ ] The `Signer` union's members are enumerated where the seam branches, and named in the PR/done record (see `CONTEXT.md` under `signer`) — a partial read of that union has already produced one wrong design.
- [ ] `onUnknownSigner: 'throw' | 'auto'` accepted at run/chain level with the documented precedence, defaulting to `'auto'`, which degrades to `'throw'`.
- [ ] No `'impersonate'` value exists on `onUnknownSigner`, and `autoImpersonate` behaviour is unchanged.
- [ ] Effective policy is `top-of-frame ?? resolved-global`; push/pop helpers are exposed and the frame is an object carrying a policy. The helpers are TYPED on the `Environment` interface in `@rocketh/core`, so a package depending on core alone can call them (`unknown-signer-package` does exactly that).
- [ ] A pushed frame affects ONLY the `unsignable` branch — an `impersonated` account still broadcasts with a `'throw'` frame pushed (explicit test).
- [ ] `broadcastTransaction` throws `UnknownSignerError` with `from`/`to`/`data`/`value` populated, replacing the opaque `cannot get signer for ...` error.
- [ ] If an address classifies signable but has no signer entry, a clear error naming the address is raised, never a `TypeError` (explicit test).

- [ ] The error's `contract` field is left unpopulated here (owned by `unknown-signer-contract-enrichment`).
- [ ] Tests cover stories 4, 6, 11 and the funnel half of story 5, plus policy resolution, pop-on-throw and the impersonation anti-regression. They live in `packages/rocketh/test/`, build a real environment locally, and drive `env.broadcastExecution` and `env.broadcastDeployment` — NOT `deploy`/`execute`/`tx` (importing those from here would close the dependency cycle) and NOT `broadcastTransaction`, which is deliberately unexported and must stay that way.
- [ ] A changeset accompanies the change (this task modifies published packages and the verify gate runs `changeset status`).
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Blocked by

- `unknown-signer-error-type` — the class thrown here.
- `account-signability-classification` — the signability view consulted here (also serializes edits to the same module).

Deliberately NOT blocked on `test-env-harness`: this task's tests live in `packages/rocketh/test/` and build a real environment locally, because `rocketh` must not depend on `@rocketh/test-utils`.

## Prompt

> Wire the "unsignable `from`" seam into the single `broadcastTransaction` choke point in `packages/rocketh`'s environment module, so a privileged call to an account rocketh cannot sign for surfaces a first-class `UnknownSignerError` (from `@rocketh/core`) instead of an opaque failure. `deploy`, `execute`, `tx` and the proxy upgrade path all funnel here, so this one edit makes the mechanism transaction-agnostic — do NOT touch those upstream packages.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `broadcastTransaction` is still the single choke point, and confirm `account-signability-classification` landed with the shape this task assumes (an additive per-address view with `local` / `node` / `impersonated` / `unsignable`). If either has shifted, route to needs-attention.
>
> Domain vocabulary (ADR 0006, `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` — read it, it constrains this task): `autoImpersonate` is a NODE CAPABILITY switch and runs BEFORE this seam; `onUnknownSigner` is the POLICY for accounts that are still unsignable afterwards. They are orthogonal. Do not merge them, do not add `'impersonate'` to the policy, do not change `autoImpersonate`.
>
> The single most important invariant: **the policy frame forces `throw` over `ask`, NEVER over impersonation.** A frame pushed by `catchUnknownSigner` exists so a wrapped action reliably receives its error rather than popping an interactive prompt at the user once `'ask'` lands. It must never turn a signable account (including an impersonated one) into a throw — that would break the mixed run and would silently change what a fork test does. Structure the code so the frame is consulted inside the `unsignable` branch, and write the anti-regression test (impersonated account + `'throw'` frame pushed still broadcasts). This exact confusion already produced one bounced task set.
>
> Frame shape: an object carrying a policy, pushed on enter and popped in `finally`, with the seam reading top-of-stack then falling back to the resolved global. Object rather than a bare `'throw'` string so `unknown-signer-interactive` can push `'ask'` later. Dynamic scope is safe because deploy scripts run sequentially (single-await) — document that invariant near the helpers.
>
> Scope: read the "Files this task owns" section and stay inside it. The `contract` enrichment on the execute path is explicitly NOT yours — it touches three other packages and has its own task.
>
> Seams to test at: a REAL environment built inside `packages/rocketh/test/` with a small local mock provider (follow `addressSigners-casing.test.ts`). Do NOT use `@rocketh/test-utils` — `rocketh` must not depend on it, or the project graph closes a cycle. Drive `env.broadcastExecution` and `env.broadcastDeployment`, the two public funnels on the `Environment` interface, rather than reaching for `broadcastTransaction`: that is a closure inside the module, absent from both the returned environment and the interface, and it should STAY private. Exercising both funnels is what proves the single-choke-point claim from inside this package.
>
> Watch the vocabulary trap on "raw tx": in this codebase `type: 'raw'` is an already-signed transaction that bypasses the signer lookup entirely. The plain-transaction path that CAN hit the seam is the `tx()` helper.
>
> Where to look: hardhat-deploy v1's `helpers.ts` around its unknown-account fallback is the prior art — this task is the rocketh-clean version of that check, done ONCE at the choke point rather than repeated in five places. Any local v1 clone lives under the gitignored `tmp/`, so do not depend on it being present.
>
> Done means: an unwrapped call from an unsignable `from` throws a fully-populated `UnknownSignerError`; signable and impersonated calls are completely unaffected; and the wrapper package (next task) can push a frame to force the throw policy for a scoped action.
