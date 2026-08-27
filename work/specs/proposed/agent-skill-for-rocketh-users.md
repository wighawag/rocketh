---
title: 'A skill file for agents deploying WITH rocketh, not agents developing rocketh'
slug: agent-skill-for-rocketh-users
humanOnly: true
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

<!-- open-questions -->

## Open questions

1. **Which format, and how many?** A single `SKILL.md` loaded on description match, an `AGENTS.md` fragment a user pastes into their own project, or both. And one skill or several (deploy, upgrade a proxy, verify, export)? A single file is easier to keep true; several match how skills are selected. Leaning one skill file plus a short copy-pasteable `AGENTS.md` fragment, because the two surfaces answer different questions: the skill is loaded when the agent decides deployment is the task, the fragment is always in context for a project that uses rocketh.
2. **Shipped where?** In the `rocketh` package (which currently publishes only `dist` and `src`, so `files` would need an entry), in a dedicated package, or only in the repo and the docs site. Shipping it in the package puts it where an agent working in a user's project can actually find it, which is the point; publishing docs on a website does not help an agent that never browses.
3. **How is it kept from going stale?** This is the question that decides whether the artifact is worth having, see the Problem Statement. Candidates: every code sample lives in a compiled fixture and the skill embeds it, a test asserts the skill's samples typecheck, or the samples are generated from the same source as the documentation site's. Related work exists in `editable-deploy-scripts-in-the-docs`, which has the same underlying need for samples that are known to run.
4. **How far does it go on safety?** An agent driving a deployment can spend real money and can put a governance action in front of a multisig. Does the skill merely describe rocketh, or does it carry operating rules (confirm the target network before broadcasting, never invent an address, stop and ask when a transaction is deferred)? Leaning yes on the rules, but they must be rules the SKILL can state truthfully, not aspirations about what the agent will do.

<!-- /open-questions -->

## Problem Statement

Two people with nothing in common independently reported that agent-driven deployment is not a trend to prepare for but their current workflow (`work/notes/findings/deployment-workflow-field-study.md`). One runs a fully onchain game and mentioned alignment with agent coding workflows as a deciding factor when choosing tools. The other, who runs a large builder community, put it plainly:

> i don't even run deploy commands any more. i just tell the bot to deploy. so maybe my feedback would be, have a really good skill file :)

rocketh has nothing for this. `AGENTS.md` and `CONTEXT.md` in this repo are about DEVELOPING rocketh: its packaging rules, its test harness, the meaning of `signer` and `signability` inside its own source. An agent working in somebody else's project, asked to deploy a contract, has the published documentation and nothing that tells it how to decide anything.

That gap costs more here than in most domains, for two reasons.

**The failure mode is expensive.** An agent that guesses wrong broadcasts a transaction that spends real money, or hands a governance action to a multisig, or records a deployment that did not happen. Most of the traps this repo has spent months naming are exactly the ones an agent will hit first: that a deferred step did NOT happen and the script must not continue as if it did, that `return true` asserts the whole script is done, that idempotency comes from on-chain state rather than from a file, that `catchUnknownSigner` takes a thunk and silently does nothing useful if handed a promise.

**A confidently wrong skill file is worse than none.** An agent will follow a stale instruction without the hesitation a human reader would have, and rocketh's own history contains several claims that were plausible, secondhand and wrong (this repo's `AGENTS.md` lists them). A skill file is a machine for repeating claims, so it must be the kind of artifact that fails a build when it stops being true, not prose that quietly rots.

## Solution

A skill file that encodes DECISION RULES, not API surface.

The published documentation already says what `deploy` and `execute` do, and duplicating it creates two things to keep true. What is missing, and what only this project knows, is the set of judgements a competent rocketh user makes without thinking:

- a deferred transaction means the step did not happen, so do not continue as if it did, and do not report success
- re-running is the normal way to finish a governance-owned deployment, not a workaround
- idempotency comes from on-chain state, so ask "what on chain tells me this is done" rather than "what did I record"
- `return true` with an `id` claims the entire script is done; it is wrong after anything was deferred
- addresses come from deployment records or named accounts, never from a guess or from a chat message
- a wrapper takes a thunk, and the failure when it does not is loud but easy to write

Plus the operating rules that belong to the situation rather than to the API: know which network is being targeted before broadcasting, and treat "rocketh could not sign this" as a point to stop and involve a human rather than a problem to route around.

Shipped where an agent will find it (open question 2), and kept true by construction rather than by discipline (open question 3).

The reach beyond agents is worth noting: the field study also found that people discover deployment tooling through the repositories of projects they follow, through developer social media, and at events, not through documentation sites. A skill file shipped in the package is found by the agent working in a project that already depends on rocketh, which is a discovery path the project does not currently have at all.

## User Stories

1. As a developer who tells an agent to deploy, I want the agent to know how rocketh works, so it does not invent a workflow.
2. As that developer, I want the agent to STOP when a transaction cannot be signed and tell me what to execute, rather than trying to work around it.
3. As that developer, I want the agent to know that a deferred step did not happen, so it does not report a deployment as complete.
4. As that developer, I want the agent to confirm which network it is about to touch before broadcasting anything.
5. As that developer, I want the agent to take addresses from deployment records and named accounts, never from a guess.
6. As that developer, I want the agent to know that re-running is normal, so it does not treat a second run as a failure recovery.
7. As a team adopting rocketh, I want a short fragment I can paste into my own project's agent instructions, so my repo carries the rules that are specific to my setup.
8. As a maintainer, I want every code sample in the skill to be known to compile against the current API, so the file cannot drift into confident falsehood.
9. As a maintainer, I want the skill to link the documentation rather than restate it, so there is one place to fix a description.
10. As a maintainer, I want the skill to be discoverable by an agent working in a project that depends on rocketh, without the human having installed anything extra.
11. As a maintainer, I want the skill to say what rocketh does NOT do, because the failures come from an agent assuming a capability that is not there.

## Autonomy notes

`humanOnly: true`: this is a public artifact that speaks for the project, in a register (instructions to an autonomous agent operating on real value) where the maintainer's judgement is the content. A human drives the tasking.

`needsAnswers: true`: four questions. Question 3 in particular decides whether this is worth building at all, since an unverifiable skill file is a liability rather than an asset.

## Implementation Decisions

- **Decision rules, not API reference.** Anything the documentation site already says is linked, not copied.
- **Every sample compiles.** The mechanism is open question 3, but the property is not negotiable: a sample that does not compile against the current API must fail something.
- **The skill states what rocketh does not do**, explicitly. The expensive agent failures are assumed capabilities: that a deferred transaction was sent, that a record proves a call happened, that a proxy upgrade validated its own storage layout.
- **No secrets, ever, and the skill says so.** Private keys and RPC credentials come from the environment, and the skill must not model a workflow in which an agent handles either.
- **The skill is versioned with the package it describes**, so an old install carries the instructions that were true for it.

## Testing Decisions

- The compile check for every sample, whatever mechanism open question 3 picks. This is the acceptance criterion that matters.
- A check that the skill does not name a package export that no longer exists, which is the cheapest catch for the most likely drift.
- Prior art for known-good samples: `editable-deploy-scripts-in-the-docs`, which needs the same property for the docs site and should share the mechanism rather than invent a second one.

## Out of Scope

- Any change to rocketh's runtime behaviour. This spec ships documentation shaped for a machine reader.
- A rocketh MCP server, an agent-facing API, or anything that lets an agent drive rocketh other than by writing and running deploy scripts as a human would.
- Guarantees about agent behaviour. The skill can state a rule; it cannot enforce one. Anything that must be enforced belongs in the code, which is where the deferral, the migration refusal and the guard already are.
- Instructions for developing rocketh itself, which are `AGENTS.md` and `CONTEXT.md` and stay separate.

## Further Notes

The two corroborating reports came from opposite ends of the ecosystem, which is the useful signal: this is not one enthusiast's preference. It is also the cheapest item in the field study by a wide margin, and the only one whose absence is invisible to us, because an agent that guesses wrong about rocketh produces a frustrated user who blames the tool and never files anything.
