---
title: the signer-routing switch in broadcastTransaction has no default case
slug: broadcast-signer-switch-has-no-default-2026-08-09
needsAnswers: true
---

# The signer-routing `switch` has no `default`

Spotted at Gate-3 while reviewing `unknown-signer-broadcast-seam` (PR #69, merged). Non-blocking there: no acceptance criterion covers it, and the task is otherwise complete.

## What was seen

The seam replaced the old `if (signer.type === 'wallet' || signer.type === 'remote') { … } else { … }` in `packages/rocketh/src/environment/index.ts` with an exhaustive `switch` over the three `Signer` variants. Enumerating the union is exactly right (it is what `AGENTS.md` now asks for, and the old form hid the fact that `signerOnly` was the local-signing one).

But the `switch` has no `default`, so a runtime `signer.type` outside the union falls off the end of `broadcastTransaction`, which then returns `undefined` as a transaction hash. The previous if/else sent anything non-`wallet`/non-`remote` down the sign-then-send-raw path instead.

## Why it might matter

`Signer` values are produced by `userConfig.signerProtocols`, which are USER-SUPPLIED functions. TypeScript constrains them to return a `Signer`, so reaching this needs a JS caller, a cast, or a protocol that violates its own type contract — narrow. But the consequence is a silent `undefined` at the single broadcast choke point, which then flows into `savePendingExecution` and fails somewhere confusing.

That is precisely the class of opaque failure the unknown-signer work exists to remove, so it seems worth closing even though it is unreachable from well-typed code.

## Suggested disposition

A `default` that throws a clear error naming the unexpected `signer.type` (or a `satisfies never` exhaustiveness check, which would also make a future fourth variant a compile error rather than a runtime hole). Small enough to ride along with whichever task next touches that function — `unknown-signer-contract-enrichment` is the obvious candidate.
