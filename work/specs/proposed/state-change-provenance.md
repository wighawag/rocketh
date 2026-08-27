---
title: 'State-change provenance: an explicit record of what a run changed beyond the contracts it deployed'
slug: state-change-provenance
humanOnly: true
taskedAfter: [execute-state-guard]
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

A deployment run leaves a precise record of the contracts it deployed and nothing at all about the state it changed. Set a fee, grant a role, point a registry at a new address, transfer ownership to a multisig: none of it is written down anywhere. The deploy script is the only account of what happened, and the deploy script describes intent, not outcome, since a step may have been skipped as already satisfied or deferred to a Safe and never executed.

Two respondents in the field study asked for this, in different vocabularies (`work/notes/findings/deployment-workflow-field-study.md`).

An infrastructure team already using v2, listing what is missing: "State checks beyond the contract deploy itself, i.e. have these functions been called? **and explicit artifacts from other state changes.**" The first half is `execute-state-guard`; this is the second.

A respondent who had run a commercial deployment platform, on what would make deployments legible to people who are not the deployer: "deployments get missing sometimes by devs that dont know what they are doing, so having a way to automatically kept track of all deployments would be needed", and separately, "audit trails could be awesome, to attach audit reports to specific deployments and commit".

The two asks converge on the same artifact: a durable, committable, human-readable account of what a run changed, sitting next to the deployment records that already account for what it deployed.

## Solution

An opt-in file recording each state change the run OBSERVED, written next to the deployment records, read by nothing.

The last clause is the whole design, and it is ADR 0012 applied to this feature: **record state changes for provenance, never branch on the record.** Writing down that the owner went from X to Y at block N is safe and useful. Reading that record to decide whether to act creates a second source of truth, and it is systematically blind exactly where it is most wanted, because in a Safe-owned system the privileged calls are the ones rocketh never sends. So this artifact has no authority, nothing consults it, and its absence changes no behaviour. That inertness is what makes it cheap to add and safe to keep.

It consumes what `execute-state-guard` already exposes. A guarded call knows what it read before it acted and can read it again after, which is what turns "we called `setFeeBps(30)`" into "the fee went from 25 to 30 at block N in transaction 0x…". An unguarded call still records what it did, without the before and after.

Two constraints shape the rest.

**Opt-in, not on by default.** Not a taste call. `unknown-signer-v1-migration` pins a no-side-effects guarantee, tested by asserting that a deferring run leaves the filesystem and the deployment records byte-identical, so a migrated v1 script does not start failing a "working tree is clean" check in CI. A file written by default would break that guarantee for every run that executed anything.

**Observed, never intended.** An entry exists because rocketh saw a transaction land. A deferred step writes nothing on the run that surfaced it. A step skipped by its guard writes nothing, because nothing changed. A step resolved through the interactive `ask` path DOES write, because inclusion was verified before anything was saved.

## User Stories

1. As an infrastructure team, I want an explicit record of the state changes a run made, so the account of a deployment is not just the contracts it created.
2. As that team, I want each entry to say what the value was before and what it became, so the record is readable without cross-referencing a block explorer.
3. As a team with an auditor, I want the file committable next to the deployment records, so a change can be pointed at and an audit report attached to it.
4. As a team lead, I want to see what a colleague's run actually changed, without reading their deploy script and reasoning about which steps were skipped.
5. As a deployer whose privileged call was deferred to a Safe, I want NO entry on the run that deferred it, because nothing happened.
6. As that deployer, I want an entry on the later run that observes the change, so a governance-owned system is not invisible in the record.
7. As a deployer, I want a step skipped by its guard to write nothing, so the file records changes rather than run attempts.
8. As a v1 migrant, I want a run that writes no artifact unless I asked for one, so my repo diff after a deploy is what it always was.
9. As a browser-runtime user, I want this to work through the same storage rocketh already uses, or to be cleanly unavailable, rather than assuming a filesystem.
10. As a maintainer, I want the record inert with respect to control flow, so nothing can start branching on it later without that being a deliberate, reviewable change.
11. As a maintainer, I want the file invisible to the deployment loader, so it can never be mistaken for a deployment record.

## Autonomy notes

`humanOnly: true`: this adds a public config key and a persisted file format that we then keep, and it touches a compatibility guarantee. A human drives the tasking.

`taskedAfter: [execute-state-guard]`: the richest entries (before and after) come from the guard's evaluation, and the guard's decision to expose that evaluation rather than reduce it to a boolean was made for this. Tasking this first would mean designing against a remembered description of a seam that does not exist yet.

No `needsAnswers`: the shape questions were settled while splitting this out of the guard spec. What remains is build detail.

## Implementation Decisions

- **A dot-prefixed file in the environment's deployment folder** (`.state-changes.json`, alongside `.migrations.json`), written through `deploymentStore` so it works in the browser like every other record. The dot prefix is load-bearing rather than cosmetic: the deployment loader lists files with a filter that drops dot-prefixed names other than `.migrations.json` (`packages/rocketh/src/environment/index.ts`, the `listFiles` predicate), so a new dot file is invisible to the deployment scan for free. Verify that filter still holds at build time rather than trusting this sentence.
- **An entry records one OBSERVED state change**: when, at which block, which transaction, `from`, `to`, the contract name where known, the function and args, the guard's read before and after where a guard was declared, and the script that caused it.
- **Opt-in via config.** See the Solution; this is what keeps the v1 no-side-effects parity guarantee intact.
- **Nothing reads it.** No code path consults the file to make a decision, and a test should assert that deleting it changes no behaviour.
- **Append-only in meaning, whatever the file shape.** An entry is a historical fact and is never rewritten. Whether that is a JSON array rewritten wholesale or a line-delimited file is a build detail, but no entry may be edited once written.
- **Human-readable first.** The audience includes an auditor and a team lead, not only a script, so entries are formatted for reading and stable in ordering so a diff is legible.

## Testing Decisions

- A guarded call that executes writes one entry, with before and after populated from the guard's evaluation.
- A guarded call skipped by its guard writes nothing.
- A deferred call writes nothing on the run that deferred it, and writes an entry on the later run that observes the change. This pair is the story the record exists for and should read as documentation.
- A call resolved through the interactive `ask` path writes an entry, because inclusion was verified.
- With the feature off, the filesystem and the deployment records are byte-identical before and after a run, mirroring the no-side-effects test `unknown-signer-v1-migration` specifies.
- Deleting the file changes no behaviour on the next run, which is the executable form of "nothing reads it".
- The file is not picked up as a deployment by the loader.

## Out of Scope

- Any use of the record to decide whether a step is needed. That is the guard's job, and doing it here would be the exact mistake ADR 0012 exists to prevent.
- Deployment records themselves, which already account for deployed contracts and are not changed by this.
- A GUI or a hosted view over the record. One respondent asked for a GUI, and it is a different product question; this spec produces the data such a thing would need and stops there.
- Attaching audit report documents to entries. The respondent asked for it, but the file is the prerequisite, and a link is something a team can add in their own repo once entries are addressable.
- Anything about non-deploy state changes made outside rocketh, which are invisible to it by construction.

## Further Notes

Worth recording: this was originally the second half of `execute-state-guard` and was split out on three grounds. It has a different risk profile (a persisted file format and a config key, versus an option on a function). It maps to a different funding row (deferred, where the guard sits inside the funded milestone), so keeping them together would have made funded work wait on unfunded design. And the guard turned out to be larger than expected after its paper validation, which found a required second guard kind. The connection is preserved by the fact that both answer one sentence from one user, quoted in both specs.
