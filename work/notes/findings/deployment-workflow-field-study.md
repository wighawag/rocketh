---
title: 'What EVM teams actually do when they cannot sign: a deployment-workflow field study'
slug: deployment-workflow-field-study
source: 'Public survey of EVM smart-contract developers, 11 responses, closed 2026-04-22, plus 5 tailored follow-up conversations (2026-04-24 to 2026-04-28) and 1 unsolicited contribution. Compiled for the Ethereum Foundation ESP grant application behind hardhat-deploy v2 + rocketh. Quotes are verbatim from the replies. Respondents are ANONYMISED here by deliberate choice: names, handles, contact details and identifying project affiliations are recorded in the grant application, not in this repo.'
---

# Why this note exists

Primary evidence, from users rather than from the maintainer, for most of the unknown-signer line of work. It is cited by ADR 0012, `execute-state-guard` and `deploy-and-upgrade-hooks`, all of which rest on claims that came from here, so the claims are written down rather than remembered.

It is **load-bearing** in one specific way: two teams, working independently, described building the SAME workaround on top of `catchUnknownSigner`, and one of them described where that workaround breaks. That convergence, not the survey checkboxes, is what justifies the design.

## The single most corroborated finding: everyone builds the same thing on top of `catchUnknownSigner`

Two production DeFi teams, unprompted and unaware of each other, described the same architecture.

The first, on hardhat-deploy v1, asked what their flow looks like when ownership is on a Safe:

> In very simple words, v1 has `catchUnknownSigner` which allow to execute a function via hardhat-deploy and if it fails we save all such txns in json file and another script with `runAtTheEnd = true` will read json and push all txns to safe. So we have a small library which uses safe packages and prep and propose txns from that json, given deployer has delegate role.

The second, running several DeFi protocols:

> When upgrading contracts or changing parameters (I often use deployment scripts to track contract parameters), transactions that require the Safe to be the sender are batched and sent as a Safe proposal. The flow is as follows: I save safe txs to a temp file, and the final scripts generate the batch proposal.

Three things follow directly, and each of them shaped a decision:

1. **The primitive is right, the batteries are missing.** Both teams hand-rolled the same two pieces: a place to accumulate the deferred transactions, and a run-end consumer that batches and proposes. Neither asked for a new policy or a different wrapper.
2. **Both pieces are already expressible on v2.** `catchUnknownSigner` returns the transaction, and `runAtTheEnd` exists in the executor. Nothing was missing to rebuild this; nothing said so, which is why `document-migrations-and-run-at-the-end` exists.
3. **This is the exact shape that can silently poison the migrations record.** A script that wraps each privileged call, keeps going, and then returns `true` records its `id` and is skipped forever, including the step that never happened. The workaround the users converged on is what makes that bug reachable by the intended workflow rather than by misuse (see ADR 0012 and `refuse-migration-record-when-a-script-deferred`).

## Where the workaround breaks, in the words of someone it broke for

The same second team described the failure mode, and this is the most technically precise answer in the study:

> This works fine, but there are some trickies for more complex scenarios:
>
> 1. I have to re-run the script after Safe execution in order to update deployment files (i.e., ABI changes and new implementation address).
> 2. Because of the issue above, if I want to call a new function right away after the upgrade, I need to have two separate batch proposals (because ABI didn't change, and the script throws if I try to have just one batch for all). In some more complex cases, I need 3 batches that, in theory, could all be executed within a single safe proposal.

What this establishes, and what it does NOT establish, both matter:

- It establishes that **dependent steps across a governance boundary are normal**, not an edge case. Step N+1 cannot be encoded before step N executes, because the ABI it must encode against does not exist yet.
- It therefore establishes that **a "collect everything and continue" mode would produce a batch computed against a counterfactual chain**. This is the concrete evidence behind rejecting a `'collect'` policy value in ADR 0012.
- It does NOT establish that batching would fix his problem. It would not. The dependency is real, and no amount of batching removes it. Anything we build here must not imply otherwise.

## A named migration blocker, and a named API request

Asked what would trigger an actual move from v1 to v2, the first team gave two reasons, the second of which is a tooling fact rather than a priority call:

> 2\) Last I check there was no `catchUnknownSigner` like option in v2 which can be blocker or we may have to find something to get it working in v2.

The same respondent, asked whether they wanted rocketh to own proxy-upgrade validation, declined and asked for a seam instead:

> Yeah package alone should be enough — using it inside `@rocketh/proxy` like you suggested is honestly the perfect level of integration. Just need a clean post-deploy/upgrade hook from your side so I can stamp the new baseline, and we're good.

This is the origin of `deploy-and-upgrade-hooks`, and it is worth noting what the request under-specifies: taken literally, a post-only hook cannot do the job, because storage-layout validation after an upgrade is a post-mortem. The pre half came from asking what the validator would do with the seam.

Independently, the second team consulted their colleagues and came back with:

> They also added that it would be very useful to have some storage-related tooling to catch any upgrade that might break contracts storage (similar to what oz-upgrades does).

Two separate teams, one asking for the seam and one for the thing that plugs into it.

## "State checks beyond the contract deploy itself"

An infrastructure/protocol team, and one of the few respondents already using v2, answered the question about what is missing with:

> State checks beyond the contract deploy itself, i.e. have these functions been called? and explicit artifacts from other state changes.

Two requests in one sentence, and they are the two halves of `execute-state-guard`. The first is the guard (`deploy` compares bytecode, `deployViaProxy` compares the implementation address, `execute` compares nothing). The second is provenance, which a second respondent asked for in a different vocabulary:

> also audit trails could be awesome, to attach audit reports to specific deployments and commit

The same v2 team also reported "deployment state is brittle or gets corrupted" as a frustration, which recurs across respondents on completely different stacks (v1, v2, forge scripts, custom scripts). Treat it as a category-wide property, not a rocketh defect.

## Agent-driven deployment, corroborated from two unrelated directions

An onchain-game developer, on choosing tooling:

> Right now, many people are using vibe coding tools, so being well aligned with that development workflow would be a big plus.

And, arriving separately and unsolicited, from someone running a large Ethereum builder community:

> i don't even run deploy commands any more. i just tell the bot to deploy. so maybe my feedback would be, have a really good skill file :)

Two vantage points with nothing in common, same conclusion. The concrete deliverable implied is small: a skill file shipped for teams USING rocketh, which does not currently exist (the repo has `AGENTS.md` and `CONTEXT.md`, both about developing rocketh itself).

## Findings that constrain how we ship rather than what we ship

**Migration cost is social, not technical.** A respondent maintaining contract templates:

> Migration cost is getting the maintainer to accept a pull request into a project that they control. So the problem is if I want to do a full refactor then that's a big PR that they don't want to review. And testing is never a revenue generator. So leadership will not accept an extra cost or time to review it.

The barrier is not learning the API, it is getting a large refactor reviewed by a project you do not control, in an area leadership does not value. This argues for incremental adoption paths over clean-rewrite migration, and it is a direct argument for keeping `catchUnknownSigner`'s signature frozen.

**Tool-stack risk is a user-facing concern, not a maintainer's footnote.** An onchain-game developer, on a framework whose maintaining team wound down:

> If the official team stops maintaining it for any reason, application developers are left with limited options: continue building on an outdated version, maintain it themselves, or migrate to another tool. All of these options put developers in a very passive position.

This is a user-side argument for the fine-grained modular packaging of ADR 0005.

**Foundry interop has to be Solidity-side, not only JS-side.** The initial framing (write deployments in TS, consume typed artifacts from Foundry tests) was put to a respondent who deploys via Solidity batch constructors and was rejected outright for their own use ("i would just use solidity"), while the inverse (a Solidity-side deployment mechanism writing hardhat-deploy-compatible JSON) was endorsed. Another respondent uses both (Foundry for unit/fuzz/invariant, Hardhat for E2E and deployment), so both modes have real constituencies. Relevant to `work/notes/ideas/foundry-support-via-forge-deploy.md`.

**The category is a public good, not a business.** A respondent who had run a commercial zero-config Foundry deployment platform shut it down in January 2026, publicly citing no traction and no viable business model. External evidence, from someone with no stake in the outcome.

## Caveats

- 11 survey responses and 6 conversations is a qualitative field study, not a representative sample. Where a finding rests on one respondent, this note says so.
- Free-text answers are reproduced as received, including typos and informal phrasing. Quotes are evidence of what people said, not of what is true about their codebases: no respondent's repository was read as part of this study. Where repository ground truth was needed, it was gathered separately (`governance-upgrade-topologies-in-the-wild.md`).
- Two respondents who opted in did not reply before the study closed, one of them the other known v2 user, so the v2-user sample here is a single team.
