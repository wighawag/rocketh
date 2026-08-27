---
title: 'Pre and post hooks around deploy and upgrade, so validation lives outside rocketh'
slug: deploy-and-upgrade-hooks
humanOnly: true
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

<!-- open-questions -->

## Open questions

1. **Where are hooks declared: config, or per call?** Config-level (`hooks: {...}` in `rocketh/config.ts`) suits the cross-cutting validator, which is the motivating case: storage-layout checking applies to EVERY upgrade in the project, and declaring it per call means one forgotten call site is one unvalidated upgrade. Per-call suits a one-off. Leaning config-level only, on the reasoning that a validator you can forget to attach is a validator that will be forgotten, and that a one-off check is just code in the deploy script. If both, the precedence rule has to be one rule, not two.
2. **Can a pre-hook MODIFY what happens, or only veto it?** Veto-only (return nothing, or throw to abort) is far easier to reason about and cannot surprise. Allowing a hook to rewrite the transaction turns it into middleware, and middleware that can rewrite a privileged governance call is a large thing to hand to a third-party package. Leaning veto-only, and letting anything richer be argued for later with a concrete case.
3. **What exactly identifies the artifact a hook receives?** A storage-layout validator needs the ABI, the storage layout from the compiler output, the proxy address, the current implementation address and the incoming implementation address. The first two come from the artifact, which is available, but this spec must not assume the shape without checking what `@rocketh/deploy` and `@rocketh/proxy` actually have in hand at those points. Enumerate before designing.
4. **Does a hook run in the browser?** rocketh core is browser-capable (ADR 0002). A hook is user code, so it can do anything, including reading the filesystem. Either hooks are declared as Node-only (and the browser runtime refuses them loudly), or the contract states that a hook must not assume a filesystem. Decide, do not leave it to discovery.

<!-- /open-questions -->

## Problem Statement

Two requests from production teams, which look like one feature and are actually two halves of one:

A DeFi team maintaining a proxy-upgrade validation package asked for exactly one thing from rocketh: "just need a clean post-deploy/upgrade hook from your side so I can stamp the new baseline, and we're good". They explicitly did NOT want rocketh to do the validation. That is the good outcome: rocketh exposes a seam, somebody else's package owns the protocol knowledge, and we do not accumulate a validation framework.

Separately, another team asked, unprompted and on behalf of their colleagues, for "storage-related tooling to catch any upgrade that might break contracts storage (similar to what oz-upgrades does)".

Those two are the same feature seen from both ends, and the second one exposes what the first request under-specifies: **a check that runs after the upgrade is worthless.** Storage-layout compatibility has to be decided BEFORE the implementation is live, because once the upgrade lands, an incompatible layout has already corrupted the contract's storage. So the hook cannot only be a post hook. It has to be a pair with different jobs:

- **pre**: validate, and be able to STOP the run. This is where storage-layout checking belongs.
- **post**: stamp the new baseline, record, notify. This can only run once the change is real.

Today there is neither. Grepping the packages finds no hook mechanism of any kind, so a team wanting either must fork a deploy script or wrap every call site by hand.

## Solution

A declared pair of hooks around the two operations that change what code is live: a deploy, and an upgrade.

A pre-hook receives what is about to happen and may throw to abort. A post-hook receives what happened and may not change it. Neither is required, and a project with no hooks behaves exactly as today.

The subtle part, and the reason this spec is worth writing carefully rather than adding a callback: **a post-hook must fire when rocketh OBSERVES the change, not when rocketh SENDS the transaction.**

Consider the case the whole unknown-signer line of work exists for. The upgrade's `from` is a Safe. Run 1 surfaces the transaction and defers; nothing happened, so no post-hook may fire, and a baseline stamped here would be a lie (ADR 0012). The operator executes it on the Safe. Run 2 reads the chain, sees the new implementation, and updates the deployment record. The upgrade HAS happened, and the baseline still needs stamping. If the post-hook is wired to "we broadcast a transaction", it never fires for any Safe-owned system, which is precisely the population that asked for it.

That rule is not new, it is the existing doctrine applied consistently: `numDeployments` already "counts how many times the RECORD changed, whether rocketh made the change or merely observed it. An upgrade performed by a Safe out-of-band and picked up on the next run counts exactly like one rocketh sent itself, because from the record's point of view the same thing happened" (`packages/rocketh-core/src/types.ts`, on `save`). Hooks fire on the same event, for the same reason.

The pre-hook has the mirror-image subtlety. It must run before the transaction is BUILT, so that a validator can abort before anything is broadcast, before anything is deferred, and before a governance proposal is put in front of a human. Aborting an upgrade that is already sitting in a Safe queue is not aborting it.

Nothing here does any validation. rocketh gains a seam and no protocol knowledge, which is what the requesting team asked for and what keeps `@rocketh/proxy` from slowly becoming an upgrade-safety framework.

## User Stories

1. As a team with a storage-layout validator, I want a pre-upgrade hook that can abort the run, so an incompatible layout is caught before the implementation goes live rather than after.
2. As that team, I want the hook to receive the outgoing and incoming implementation artifacts, so I can compare layouts without re-deriving which contract is being replaced.
3. As that team, I want a post-upgrade hook, so I can stamp the new layout as the baseline once the upgrade is real.
4. As a team whose proxy is owned by a Safe, I want the post-hook to fire on the run that OBSERVES the upgrade, not only on a run that sent it, so the baseline is stamped for governance-owned systems at all.
5. As that same team, I want NO post-hook to fire on the run that merely deferred the transaction, because nothing happened yet and a stamped baseline would be wrong.
6. As a team, I want a pre-hook that throws to stop the run before anything is broadcast or deferred, so an aborted upgrade never reaches a multisig queue.
7. As a maintainer, I want rocketh to contain no storage-layout logic, so the protocol knowledge lives in the package whose authors maintain it.
8. As a user with no hooks declared, I want nothing whatsoever to change.
9. As a hook author, I want a hook that throws to fail the run loudly with my error, not to be swallowed or downgraded to a warning, because a silent validator is worse than none.
10. As a hook author, I want to know whether my hook may touch the filesystem, so the same package can be used in the browser runtime or refuse clearly.
11. As a team deploying (not upgrading), I want the same pair around a fresh deploy, so a check that applies to both does not need two mechanisms.
12. As a maintainer, I want the hook contract expressed so that adding a new hook point later is additive.

## Autonomy notes

`humanOnly: true`: this adds a public extension point to `rocketh/config.ts` that third-party packages will depend on, so a human drives the tasking.

`needsAnswers: true`: four questions above, two of which (where hooks are declared, and whether a pre-hook can rewrite) determine the shape rather than the detail.

## Implementation Decisions

- **Two hook points, four positions**: pre/post deploy, pre/post upgrade. Named so a fifth is additive.
- **The post-hook fires on OBSERVED change**, aligning with the `numDeployments` doctrine quoted above, so an out-of-band Safe execution picked up on a later run fires it exactly as a rocketh-sent transaction does.
- **No post-hook on a deferral.** A run that surfaced an `UnknownSignerError` observed nothing (ADR 0012). This holds for the `throw` path and the caught path alike. The interactive `ask` path DOES fire it, because there the transaction was verified to have landed.
- **The pre-hook runs before the transaction is built**, so it precedes the broadcast choke point and the unknown-signer seam, and an abort costs nothing on chain.
- **A throwing hook aborts the run with the hook's own error.** Not wrapped into something generic, not downgraded, not caught.
- **rocketh ships no validators.** The storage-layout checker is somebody else's package, by explicit request of the team that asked for the hook.

## Testing Decisions

- The governance path end to end, as an integration test that doubles as documentation: an upgrade from an unsignable `from` fires the pre-hook and NO post-hook on run 1, and fires the post-hook on run 2 where the change is observed. This is the story the spec exists for.
- A pre-hook that throws aborts before anything is broadcast: assert no transaction was sent, not merely that the run failed.
- A project with no hooks declared produces byte-identical behaviour, which is the same shape of test `unsignable-routes` uses for zero declared routes and is the strongest single test here.
- Hook ordering relative to the deployment record being saved, pinned explicitly, because a post-hook that reads the record needs to know whether it is looking at the new one.
- Prior art: the unknown-signer integration tests for style, `createTestEnvironment` from `@rocketh/test-utils` for setup.

## Out of Scope

- Any storage-layout implementation, which is the whole point.
- Hooks around arbitrary `execute` calls. The motivating requests are about deploys and upgrades, and "is this call needed" is answered by the guard in `execute-state-guard`, not by a hook.
- Middleware that rewrites transactions (see open question 2).
- Anything to do with verification or export, which have their own packages and lifecycles.

## Further Notes

Worth recording because it shaped the spec: the original request was for a POST hook only, and taken literally it would have shipped something that could not do the job it was asked for, since storage validation after an upgrade is a post-mortem. The pre half came from asking what the validator would actually do with the seam. That is a general lesson for feature requests received as an API shape rather than as a goal.
