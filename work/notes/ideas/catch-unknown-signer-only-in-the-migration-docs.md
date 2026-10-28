---
title: 'Document catchUnknownSigner only for porting hardhat-deploy v1 scripts'
slug: catch-unknown-signer-only-in-the-migration-docs
---

# Document `catchUnknownSigner` only for porting hardhat-deploy v1 scripts

Raised in the review of the user-skills proposal (spec `agent-skill-for-rocketh-users`): `catchUnknownSigner` exists for v1 scripts, rocketh now handles an unsignable account natively, so the documentation should present it only on the migration page. The user skills already follow this (they teach the native path and route a script that calls `catchUnknownSigner` to the migration skill). This note is the documentation half, which needs a decision first.

## What the repository says today

Checked 2026-10-28 on `75d1eac`:

- Nothing marks it deprecated: no `@deprecated` in `packages/rocketh-unknown-signer/src`, nothing in its README or the docs.
- `documentation/unknown-signers/` presents it as "the **other** workflow", for two situations: porting a v1 script, and "you deliberately want the non-interactive flow". It adds: "If neither applies, prefer the default interactive flow".
- ADR 0016 (maintainer decision, 2026-10-27) freezes it for the 0.x line and opens with "`catchUnknownSigner` and the rest of the unknown-signer handling are what a project with a Safe, a multisig or a governance contract as owner builds its deploy scripts, wrappers and batch proposers on". Demoting it in the docs does not break the freeze (frozen means not removed or changed, not recommended), but it contradicts that opening framing, so the ADR would want an addendum.
- `documentation/script-lifecycle/`, "The batch proposer", uses it as the documented way to collect "what the run could NOT send" in a `runAtTheEnd` script, as the complement of a fork rehearsal's captured transactions.

## What replaces each use

- **Porting a v1 script:** unchanged, it stays on the migration page (`hardhat-deploy/migration/#catch-unknown-signer`).
- **An unattended run:** `onUnknownSigner: 'throw'` (or `auto` without a terminal) defers and aborts; a `guard` makes the re-run converge once the Safe has acted; a terminal re-run accepts the hash of a transaction executed in between.
- **A batch for the Safe:** a fork rehearsal with `--write-transactions` gives every Safe-owned step in one pass, executed against real state, which the unknown-signers page presents as the one-pass route ("instead of deferring each privileged call, executing it, and re-running to reach the next one").

## What is genuinely lost

One capability has no native equivalent: a LIVE, unattended run that continues past an unsignable step, so later steps that do not depend on it still run, and that hands several deferred transactions back as values in the same run. Under `throw` the run stops at the first one. The fork rehearsal covers the batch, but needs a node that can fork the network. Whether any user needs the live variant is the question to answer before deciding; the batch-proposer pattern in `script-lifecycle/` was motivated by teams porting v1 proposers, which the migration page would still serve.

## Pages that would change

Main text: `documentation/unknown-signers/` (the "Deferring instead of asking" section moves to, or is reduced to a pointer to, the migration page), `documentation/script-lifecycle/` (the "never `return true` after a caught deferral" warning and the deferred half of the batch proposer), `documentation/captured-transactions/`, `documentation/execute-guard/`, `documentation/fork-runs/`, `documentation/safe-owned-project/` (one link each).

Lists of packages that describe `@rocketh/unknown-signer` by `catchUnknownSigner`: `README.md`, `documentation/reference/packages/`, `documentation/reference/environment/`, `documentation/extending/architecture/`, `packages/rocketh-unknown-signer/README.md`. Incidental mentions that stay true either way: `documentation/viem/`, `documentation/extending/`, `documentation/extending/testing/`.

## Decision needed

1. Is the live, unattended, continue-past-a-deferral run a use to keep documenting outside the migration page?
2. If not: an addendum to ADR 0016 recording that the surface stays frozen but is documented for migration only, and optionally `@deprecated` JSDoc pointing at the native path (which would show in every editor of every ported script, so it should say "kept for ported scripts", not "will be removed").
