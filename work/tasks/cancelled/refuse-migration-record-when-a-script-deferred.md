---
title: 'Refuse to record a migration for a script that deferred an unsignable transaction'
slug: refuse-migration-record-when-a-script-deferred
reason: 'out-of-scope: enforcement is trivially bypassed by a plain try/catch, so it taxes the careful user and stops nobody. The hazard is real and moves to documentation (`document-migrations-and-run-at-the-end`).'
cancelledOn: 2026-08-27
blockedBy: []
covers: []
---

> **CANCELLED BEFORE BUILD, and the analysis is kept because the hazard it found is real.** What was rejected is the ENFORCEMENT, not the finding.

## What it would have built

`catchUnknownSigner` catches a deferral, so a script that wraps a privileged call keeps running and can reach `return true`. With an `id` set, the executor records that id to `.migrations.json` and the WHOLE script is skipped on every later run, including the step that never happened. The operator executes the transaction on their Safe, re-runs, and the script never runs again, so nothing reconciles.

Successive drafts proposed: refusing the record outright; then allowing it behind a declaration (`deferralIsCompletion: true`); then, once the halt case was spotted, holding such migrations until the run completed so that a later script throwing could not seal a script whose collected transactions died with the process.

## Why it was cancelled

**Enforcement here is trivially bypassed, so it only ever reaches the careful user.** `catchUnknownSigner` is a try/catch. A user who writes

```typescript
try {
	await execute(env)(target, {account: 'safeOwner', functionName: 'setX', args: [1]});
} catch {}
return true;
```

gets none of this machinery, and produces exactly the same outcome. Policing our own wrapper while the plain-language equivalent goes unpoliced taxes the user who reached for the supported tool and stops nobody. This is the same argument that settled the guard question (`execute-state-guard`: a user who does not want a guard can reach the chain by other means, so enforcement at one option is theatre), and it should be applied consistently rather than only where it was convenient.

**Migration semantics are the user's to understand.** `return true` with an `id` means "this script is done and never needs to run again". That is a claim the author makes about their own script, and rocketh has no better information about it than they do. A script whose deliverable IS the surfaced transactions is a legitimate thing to write, and so is a script that collects one step and still needs to re-run for another. Adding `deferralIsCompletion` invented a public concept to let users re-state something they had already stated.

**The cost was rising fast.** The final draft added a script option, a per-script deferral mark, and a change to WHEN `.migrations.json` is written (provisional commits held until end of run). Three moving parts, one of them touching a mechanism every script uses, to protect one path of one wrapper.

## What survives

- **The hazard, as documentation.** `document-migrations-and-run-at-the-end` states it: catching a deferral and returning `true` seals a script containing a step that never happened, and nothing will ever reconcile it. That is the whole of the fix now.
- **The halt analysis, as a design constraint elsewhere.** The reason the enforcement kept growing is that in-memory collection dies with the process, so sealing a collecting script could lose its transactions permanently. `deferred-transaction-collector` answers that directly by writing the collected transactions to an opt-in file, which is durable, inspectable, and what two production teams already do by hand. That is a better answer than any amount of migration bookkeeping.
- **The distinction that the `ask` path does not defer**, since it verifies a real transaction landed. Worth keeping in the docs because it is the one case where a deferral-shaped situation legitimately ends in a recorded migration.

## What did NOT survive, so it is not re-proposed

- `deferralIsCompletion` as a public script option.
- Provisional migrations committed at end of run. `recordMigration` keeps writing immediately, as it does today.
- A per-script deferral mark exposed for other callers to read. `deferred-transaction-collector`'s nested-wrapper detection, which was going to reuse it, now stands on its own or does not ship.

## Further note

An optional, non-coercive residue was considered and left undecided rather than dropped: a one-line note at end of run when a script both deferred and recorded a migration. It is information rather than enforcement, so it does not fall to the argument above. It is not specced; raise it only if the documentation proves insufficient.
