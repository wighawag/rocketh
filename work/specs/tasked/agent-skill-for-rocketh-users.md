---
title: 'A skill file for agents deploying WITH rocketh, not agents developing rocketh'
slug: agent-skill-for-rocketh-users
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

> Tasked on 2026-10-28. The decisions on the open questions, the distribution and the reuse of ethskills are in ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`); what to build, the rules each skill states and the tests are in the tasks that carry `spec: agent-skill-for-rocketh-users`.

## Problem Statement

Two people with nothing in common independently reported that agent-driven deployment is not a trend to prepare for but their current workflow (`work/notes/findings/deployment-workflow-field-study.md`). One named alignment with agent coding workflows as a deciding factor when choosing tools. The other put it plainly:

> i don't even run deploy commands any more. i just tell the bot to deploy. so maybe my feedback would be, have a really good skill file :)

rocketh has nothing for this. `AGENTS.md` and `CONTEXT.md` in this repo are about DEVELOPING rocketh: its packaging rules, its test harness, the meaning of `signer` and `signability` inside its own source. An agent working in somebody else's project, asked to deploy a contract, has the published documentation and nothing that tells it how to decide anything.

That gap costs more here than in most domains, for two reasons.

**The failure mode is expensive.** An agent that guesses wrong broadcasts a transaction that spends real money, or hands a governance action to a multisig, or records a deployment that did not happen. Most of the traps this repo has spent months naming are exactly the ones an agent will hit first: that a deferred step did NOT happen and the script must not continue as if it did, that `return true` asserts the whole script is done, that idempotency comes from on-chain state rather than from a file, that a privileged `execute` with no on-chain check hands the same transaction over again on every re-run.

**A confidently wrong skill file is worse than none.** An agent will follow a stale instruction without the hesitation a human reader would have, and rocketh's own history contains several claims that were plausible, secondhand and wrong (this repo's `AGENTS.md` lists them). A skill file is a machine for repeating claims, so it must be the kind of artifact that fails a build when it stops being true, not prose that quietly rots.

## Solution

A skill file that encodes DECISION RULES, not API surface.

The published documentation already says what `deploy` and `execute` do, and duplicating it creates two things to keep true. What is missing, and what only this project knows, is the set of judgements a competent rocketh user makes without thinking:

- a deferred transaction means the step did not happen, so do not continue as if it did, and do not report success
- re-running is the normal way to finish a governance-owned deployment, not a workaround
- idempotency comes from on-chain state, so ask "what on chain tells me this is done" rather than "what did I record"
- `return true` with an `id` claims the entire script is done; it is wrong after anything was deferred
- addresses come from deployment records or named accounts, never from a guess or from a chat message
- a privileged call converges only when something on chain says it is done: `deployViaProxy` reads the proxy, an `execute` needs a `guard`

Plus the operating rules that belong to the situation rather than to the API: know which network is being targeted before broadcasting, and treat "rocketh could not sign this" as a point to stop and involve a human rather than a problem to route around.

Installed by the user, from one source in this repository, and kept true by construction rather than by discipline: every code sample is a fixture that runs (ADR 0017).

### The skill set

Three skills, two of them new, each a `skills/<name>/SKILL.md` with frontmatter.

| Skill                               | Loaded when                                                                                                                                                                                                                                                                                            | Carries                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rocketh-deploy` (new)              | a project uses rocketh or hardhat-deploy v2 (a `rocketh/config.ts`, `deployScript` files, `rocketh` or `hardhat-deploy` ^2 in `package.json`, which includes the Hardhat flavor of Scaffold-ETH 2) and the task is to write, run, re-run or upgrade a deploy script, or to verify or export afterwards | the deploy decision rules, the network check, secrets, what rocketh does not do; `references/` for hardhat-deploy, the `rocketh` CLI, proxies and diamonds |
| `rocketh-safe-owned-changes` (new)  | _unsignable_: a step's `from` is an account rocketh cannot sign for; the run paused with `Unknown signer for account` or threw `UnknownSignerError`; a privileged change is to be rehearsed on a fork                                                                                                  | the deferral rules, the pause, governance owners, guards, fork rehearsal and captured transactions, the production-hardening checks                        |
| `hardhat-deploy-migration` (exists) | porting a hardhat-deploy v1 project                                                                                                                                                                                                                                                                    | scope unchanged; its body gains a pointer to `rocketh-deploy` for the work after the port                                                                  |

Each description is a context pointer written by the rules the skill tasks carry: it front-loads the leading word and lists one trigger per branch, and nothing else. Routing to a sibling lives in the BODY, at the point the branch is reached (`rocketh-deploy`, on an unsignable `from`: continue with `rocketh-safe-owned-changes`), not as a "Not for" clause in the description: that clause would be a negation, and it would repeat the sibling's trigger in a second always-loaded pointer. This is where the proposal departs from ethskills' description shape.

`rocketh-safe-owned-changes` is its own skill because it is reached differently (rocketh stopped, or the owner is a Safe), serves a different audience (teams operating governed production contracts), and holds most of the expensive decision rules. There is no separate hardhat-deploy skill: the decision rules are the same whichever command drives the executor, so `rocketh-deploy` names both and keeps the differences in `references/`.

## User Stories

1. As a developer who tells an agent to deploy, I want the agent to know how rocketh works, so it does not invent a workflow.
2. As that developer, I want the agent to STOP when a transaction cannot be signed and tell me what to execute, rather than trying to work around it.
3. As that developer, I want the agent to know that a deferred step did not happen, so it does not report a deployment as complete.
4. As that developer, I want the agent to confirm which network it is about to touch before broadcasting anything.
5. As that developer, I want the agent to take addresses from deployment records and named accounts, never from a guess.
6. As that developer, I want the agent to know that re-running is normal, so it does not treat a second run as a failure recovery.
7. As a team adopting rocketh, I want a short fragment in my own project's agent instructions (written by `hardhat-deploy init` for a new project, pasted from the documentation page into an existing one), so my repo tells an agent where the rocketh skills are and carries what is specific to my setup.
8. As a maintainer, I want every code sample in the skill to be known to compile against the current API, so the file cannot drift into confident falsehood.
9. As a maintainer, I want the skill to link the documentation rather than restate it, so there is one place to fix a description.
10. As a maintainer, I want an agent working in a project that depends on rocketh to learn the skills exist and tell its user, so the user can install them with one command and nothing is installed without their consent.
11. As a maintainer, I want the skill to say what rocketh does NOT do, because the failures come from an agent assuming a capability that is not there.

## Out of Scope

- Any change to rocketh's runtime behaviour. This spec ships documentation shaped for a machine reader.
- A rocketh MCP server, an agent-facing API, or anything that lets an agent drive rocketh other than by writing and running deploy scripts as a human would.
- Guarantees about agent behaviour. The skill can state a rule; it cannot enforce one. Anything that must be enforced belongs in the code, which is where the deferral, the migration refusal and the guard already are.
- Instructions for developing rocketh itself, which are `AGENTS.md` and `CONTEXT.md` and stay separate.
