---
title: 'A skill file for agents deploying WITH rocketh, not agents developing rocketh'
slug: agent-skill-for-rocketh-users
humanOnly: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Decisions on the open questions

The spec launched with four open questions. The maintainer answered them on 2026-10-28, after the research in `work/notes/findings/ethskills-structure-coverage-and-reuse.md` and a review of the proposal. The answers are recorded here; the sections below are written to match them.

1. **Format, and how many skills.**
   - **Format:** `SKILL.md` with `name` and `description` frontmatter, the shape `skills/hardhat-deploy-migration/` already uses and the agent skills format defines (`name` equal to the folder, depth in `references/` loaded on demand, `SKILL.md` under 500 lines).
   - **Count: two new skills** next to the existing migration skill, `rocketh-deploy` and `rocketh-safe-owned-changes` (see [The skill set](#the-skill-set)).
   - **No separate hardhat-deploy skill.** The decision rules are identical whether a project runs `hardhat deploy` or `rocketh`, since both drive the same executor, and a second skill would duplicate every rule. What differs is the surface (commands, network configuration, fork flags, tests), so `rocketh-deploy` names both hardhat-deploy v2 and rocketh in its description and carries the differences in `references/hardhat-deploy.md` and `references/rocketh-cli.md`, each loaded only for the setup the project uses.
2. **Shipped where: by the user's own action, as ethskills does.**
   - **Consent is the principle.** Skills are never added to a user's agent environment without the user doing it. A dependency would not reach the agent anyway: no agent loads skills from `node_modules` by itself.
   - **One source:** `skills/<name>/SKILL.md` in this repository. No package carries them for now; a `@rocketh/skills` package can be added later if version-matched copies become important, without changing anything else here.
   - **Install paths, both usable before a project exists:** `npx skills add wighawag/rocketh` (into the current project, or user-wide with `-g`), and a one-line prompt, "Read https://rocketh.dev/skills/rocketh-deploy/SKILL.md and follow it before deploying", for an agent without skills support.
   - **rocketh.dev serves the raw files** at `rocketh.dev/skills/<name>/SKILL.md` (a change in the rocketh-website repository), and a documentation page, "Working with an AI agent", gives both install paths. The getting-started pages and the package READMEs link it.
   - **`hardhat-deploy init` writes an `AGENTS.md` that informs and loads nothing:** "This project deploys with hardhat-deploy v2 and rocketh. If the rocketh skills are not available to you, tell the user they exist and how to install them (`npx skills add wighawag/rocketh`, or the prompt at rocketh.dev)." The agent mentions it and the user decides; the user can also delete the file. This is what story 7's fragment becomes, with room below it for what no file in the project says (who approves a privileged change).
   - **No Claude Code plugin marketplace file.**
   - **A pull request to ethskills** that corrects its Foundry-only `yarn verify` statement for Scaffold-ETH 2's Hardhat flavor and points to `rocketh-deploy`, naming hardhat-deploy, since that is what Scaffold-ETH 2's Hardhat users see. A courtesy and a discovery path, not counted on.
   - **Version drift is stated, not hidden.** The skills follow `main`, like the documentation site. Each skill says which rocketh version it was written for and tells the agent to compare it with the project's installed `rocketh`, and on a mismatch to say so and defer to the documentation for that version.
3. **Staying correct:** the migration skill's mechanism, made stricter (see Implementation Decisions and Testing Decisions). Every TypeScript block in a skill is a marked fixture that is compiled and executed; links to rocketh.dev and CLI flags are checked too.
4. **Safety: operating rules, limited to what the skill can state truthfully,** each tied to the page or code that makes it true:
   - the user gives the yes on the environment and chain, whether at rocketh's confirmation or before the agent adds `--skip-prompts` (rocketh prints them and asks before a run from the `rocketh` command or `hardhat deploy`, except on hardhat's in-memory network, `packages/rocketh/src/executor/index.ts`; without a terminal that confirmation throws and names `--skip-prompts`, `packages/rocketh-node/src/environment/prompt.ts`); this holds with or without a terminal, since some agent harnesses run commands in a pseudo-terminal;
   - `--reset` runs only when the user asked for it, since its confirmation is the one before deleting the environment's records;
   - the hash at a pause comes from the user, who executed the transaction;
   - addresses come from deployment records and named accounts;
   - keys and RPC URLs come from the environment, and the agent never handles them.

## Problem Statement

Two people with nothing in common independently reported that agent-driven deployment is not a trend to prepare for but their current workflow (`work/notes/findings/deployment-workflow-field-study.md`). One named alignment with agent coding workflows as a deciding factor when choosing tools. The other put it plainly:

> i don't even run deploy commands any more. i just tell the bot to deploy. so maybe my feedback would be, have a really good skill file :)

rocketh has nothing for this. `AGENTS.md` and `CONTEXT.md` in this repo are about DEVELOPING rocketh: its packaging rules, its test harness, the meaning of `signer` and `signability` inside its own source. An agent working in somebody else's project, asked to deploy a contract, has the published documentation and nothing that tells it how to decide anything.

That gap costs more here than in most domains, for two reasons.

**The failure mode is expensive.** An agent that guesses wrong broadcasts a transaction that spends real money, or hands a governance action to a multisig, or records a deployment that did not happen. Most of the traps this repo has spent months naming are exactly the ones an agent will hit first: that a deferred step did NOT happen and the script must not continue as if it did, that `return true` asserts the whole script is done, that idempotency comes from on-chain state rather than from a file, that `catchUnknownSigner` takes a thunk (handed a promise, it refuses with an error naming the fix).

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

Installed by the user, from one source in this repository (decision 2), and kept true by construction rather than by discipline (decision 3).

### The skill set

Three skills, two of them new, each a `skills/<name>/SKILL.md` with frontmatter.

| Skill                               | Loaded when                                                                                                                                                                                                                                                                                            | Carries                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rocketh-deploy` (new)              | a project uses rocketh or hardhat-deploy v2 (a `rocketh/config.ts`, `deployScript` files, `rocketh` or `hardhat-deploy` ^2 in `package.json`, which includes the Hardhat flavor of Scaffold-ETH 2) and the task is to write, run, re-run or upgrade a deploy script, or to verify or export afterwards | the deploy decision rules, the network check, secrets, what rocketh does not do; `references/` for hardhat-deploy, the `rocketh` CLI, proxies and diamonds |
| `rocketh-safe-owned-changes` (new)  | _unsignable_: a step's `from` is an account rocketh cannot sign for; the run paused with `Unknown signer for account` or threw `UnknownSignerError`; a privileged change is to be rehearsed on a fork                                                                                                  | the deferral rules, the pause, governance owners, guards, fork rehearsal and captured transactions, the production-hardening checks                        |
| `hardhat-deploy-migration` (exists) | porting a hardhat-deploy v1 project                                                                                                                                                                                                                                                                    | scope unchanged; its body gains a pointer to `rocketh-deploy` for the work after the port                                                                  |

Each description is a context pointer written by the rules under Implementation Decisions ("How the skills are written"): it front-loads the leading word and lists one trigger per branch, and nothing else. Routing to a sibling lives in the BODY, at the point the branch is reached (`rocketh-deploy`, on an unsignable `from`: continue with `rocketh-safe-owned-changes`), not as a "Not for" clause in the description: that clause would be a negation, and it would repeat the sibling's trigger in a second always-loaded pointer. This is where the proposal departs from ethskills' description shape.

**Why `rocketh-safe-owned-changes` is its own skill.** Its trigger is different: it is reached because rocketh stopped (a pause, an `UnknownSignerError`) or because the account in the config is a Safe, not because the user asked to deploy. Its audience is different: teams operating governed production contracts, not someone deploying to a testnet. And it is where the stakes and most of the decision rules are: deferred is not done, the hash at the pause, the guard, a governance owner's `{to, data}`. The documentation already treats it as its own part (`documentation/unknown-signers/`, `safe-owned-project/`, `execute-guard/`, `script-lifecycle/`, `captured-transactions/`, `fork-runs/`, `production-hardening/`). Fork rehearsal goes with it because every page that explains rehearsal explains it as the way to exercise a step the run cannot sign for on a live network (`production-hardening/`, "Rehearse on a fork"; step 4 of `safe-owned-project/`; "On a fork or in the browser: impersonation instead" in `unknown-signers/`); `rocketh-deploy` points to it for a mainnet deploy.

**What `rocketh-deploy` says,** each rule tied to the page or code that makes it true:

- Re-running is how a deployment finishes and how an upgrade happens: a re-run redeploys only what changed, compared against the chain or the record (`documentation/deploy-contracts/`, "When does a re-run redeploy?"; `deploy-scripts/`, "A script must be safe to re-run").
- Addresses come from deployment records (`env.get`, `deployments/<environment>/`) and named accounts, never from memory or a chat message (`deployment-records/`, `named-accounts/`).
- The network check is rocketh's confirmation, and its yes is the user's: the `--skip-prompts` and `--reset` rules in decision 4.
- Keys and RPC URLs come from the environment and the agent never handles them: `MNEMONIC_<network>`, `ETH_NODE_URI_<network>` and their `SECRET` form (`hardhat-deploy/networks/`); `linkedData` is public (`exporting-and-verifying/`).
- What rocketh does not do: there is no built-in `live` tag, so `env.tags.live` is falsy on mainnet unless the config declares it (`environments/`, "Tags"); a proxy upgrade does not check storage-layout compatibility (read in `packages/rocketh-proxy/src/index.ts`, which reads the EIP-1967 slot and nothing about layout; the documentation does not say this yet, so a documentation change comes first, see Implementation Decisions); `rocketh-export` does not touch the chain unless given `--verify` (`exporting-and-verifying/`).

**What `rocketh-safe-owned-changes` says:**

It teaches rocketh's native path only: the pause under `ask`, `throw` when unattended, a `guard` so the re-run converges, and a fork rehearsal with captured transactions to get the whole batch in one pass. `catchUnknownSigner` is not taught: it is kept for porting hardhat-deploy v1 scripts. A script that already calls it is sent to the migration page's section on it (`hardhat-deploy/migration/#catch-unknown-signer`), not to the migration skill, whose trigger is porting a v1 project. A `TimelockController` owner needs no wrapper either: the run prints the `{to, data}` the timelock must end up calling, and an account holding the proposer role sends `schedule(...)` and later `execute(...)` with it, outside rocketh (`unknown-signers/`, "When the owner is governance, not a multisig"); the governance demo's scripted version uses the wrapper and is not what the skill teaches. Without it, the run-once hazard the spec started from (`return true` after a caught deferral) does not arise on the taught path: a `throw` aborts before the script returns, and a resolved pause is a step that happened. The documentation makes the same move (pull request #238, with an addendum to ADR 0016): the wrapper is documented on the migration page only, still frozen and not deprecated.

- A deferred step did not happen. Under `throw` the run aborts at that step and records nothing (`unknown-signers/`, "A run that threw will hand you the same transaction again"); the agent reports the printed transaction to the user verbatim as outstanding, and the deployment as unfinished.
- The hash at a pause is the human's to give. rocketh checks it, but "a user who deliberately confirms the wrong transaction is believed" (`unknown-signers/`, accepted residual risk), so the hash and the answer to the "different call" question come from the user, who executed the transaction. This holds whether or not the agent's shell is a terminal: some agent harnesses run commands in a pseudo-terminal, where the pause does appear, and the answer still comes from the user.
- Finishing after a deferral is a re-run: from a terminal, pasting the hash of the transaction the user executed ("A hash from an earlier run is still good"), or unattended, once a `guard` lets the re-run see the effect on chain.
- A privileged `execute` carries a `guard`, or every re-run hands the same transaction over again (`execute-guard/`; step 6 of `safe-owned-project/`).
- When the owner is a governance contract, the printed transaction is a `{to, data}` action for a proposal, not something to send (`unknown-signers/`, "When the owner is governance, not a multisig").
- A stop is resolved by the account that holds the authority: `autoImpersonate` and `onUnknownSigner` stay as the project configured them for a live network, and when the admin must stay external the script asserts it with `env.addressSignability` (`production-hardening/`, `unknown-signers/`).
- The rehearsal: `--is-fork` or `HARDHAT_FORK`, `environments.<name>.chain` for a hardhat fork that reports 31337, records read and not written, `--write-transactions` for the batch, `fundImpersonatedAccounts` (`fork-runs/`, step 4 of `safe-owned-project/`).

### ethskills: reuse it, or write our own

Researched before proposing anything, because a well-known catalogue of Ethereum skills for agents already exists and is listed on ethereum.org. Findings, with every source, are in `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. In short: ethskills is many short, standalone skills behind a hand-kept catalogue, fetched by URL or installed as a plugin; it covers deploying through Foundry and Scaffold-ETH 2, never names hardhat-deploy or rocketh, and states one Foundry-only fact about `yarn verify` as true of Scaffold-ETH 2 in general, which is wrong for the Hardhat flavor that runs on hardhat-deploy v2 and rocketh; it is MIT by declaration; and it is kept current by baseline-testing models and by benchmark-driven rewrites of every skill at once.

**Decision: write rocketh's own skills, and borrow the shape.** Its format is modular (a skill is a directory loaded only when fetched), but the project is not a host for a tool's skill: adding one means editing its catalogue in five places, the contribution bar is a measured model blind spot, a rewrite in October 2026 replaced every skill at once, and its content is not tested against any library, while ours is tested against this repository's code. A rocketh module there could not carry the fixture test that is this spec's acceptance criterion. Borrowed where there is reason to believe it works: one topic per skill, routing to a sibling skill (in the body here, see the skill set), short skills that link out for depth, the method of baseline-testing a stock agent on a realistic task and keeping only what changes its behaviour (`CONTRIBUTING.md`; the October rewrite was measured at 94% against 85% on their task suite), the one-line `AGENTS.md` pointer as the setup for agents without skills, and the wallet rule's form, "print what will happen, then stop until a human says yes". Borrowed for distribution too: the user installs the skills by their own action, a command or a one-line prompt pointing at a URL, which is how consent is kept (decision 2). Not borrowed: the feedback endpoint that has agents POST notes to a server.

The reach beyond agents is worth noting: the field study also found that people discover deployment tooling through the repositories of projects they follow, through developer social media, and at events, not through documentation sites. The `AGENTS.md` that `hardhat-deploy init` writes, and the ethskills pull request, put the skills in front of an agent already working on such a project, which is a discovery path the project does not currently have at all.

## User Stories

1. As a developer who tells an agent to deploy, I want the agent to know how rocketh works, so it does not invent a workflow.
2. As that developer, I want the agent to STOP when a transaction cannot be signed and tell me what to execute, rather than trying to work around it.
3. As that developer, I want the agent to know that a deferred step did not happen, so it does not report a deployment as complete.
4. As that developer, I want the agent to confirm which network it is about to touch before broadcasting anything.
5. As that developer, I want the agent to take addresses from deployment records and named accounts, never from a guess.
6. As that developer, I want the agent to know that re-running is normal, so it does not treat a second run as a failure recovery.
7. As a team adopting rocketh, I want a short fragment in my own project's agent instructions, so my repo tells an agent where the rocketh skills are and carries what is specific to my setup.
8. As a maintainer, I want every code sample in the skill to be known to compile against the current API, so the file cannot drift into confident falsehood.
9. As a maintainer, I want the skill to link the documentation rather than restate it, so there is one place to fix a description.
10. As a maintainer, I want an agent working in a project that depends on rocketh to learn the skills exist and tell its user, so the user can install them with one command and nothing is installed without their consent.
11. As a maintainer, I want the skill to say what rocketh does NOT do, because the failures come from an agent assuming a capability that is not there.

## Autonomy notes

`humanOnly: true`: this is a public artifact that speaks for the project, in a register (instructions to an autonomous agent operating on real value) where the maintainer's judgement is the content. A human drives the tasking.

`needsAnswers` cleared: the four open questions were answered by the maintainer on 2026-10-28, see [Decisions on the open questions](#decisions-on-the-open-questions).

## Implementation Decisions

- **Decision rules, not API reference.** Anything the documentation site already says is linked, not copied.
- **Every sample compiles.** The mechanism is decision 3, and the property is not negotiable: a sample that does not compile against the current API must fail something.
- **The skill states what rocketh does not do**, explicitly. The expensive agent failures are assumed capabilities: that a deferred transaction was sent, that a record proves a call happened, that a proxy upgrade validated its own storage layout.
- **No secrets, ever, and the skill says so.** Private keys and RPC credentials come from the environment, and the skill must not model a workflow in which an agent handles either.
- **The skill states the rocketh version it was written for**, and tells the agent to compare it with the project's installed `rocketh` and say so on a mismatch (decision 2: the skills follow `main` and no package carries them).
- **Format (decision 1):** `skills/<name>/SKILL.md`, `name` equal to the folder, a `description` that is a context pointer (see "How the skills are written"), the body under 500 lines, depth in `references/*.md` (one level, loaded on demand). The migration skill is 2485 lines and stays as it is; restructuring it is not this spec.
- **How the skills are written:** by the maintainer's `writing-for-agents` skill, which lives outside this repository and whose rules that matter here are listed below (context pointers, the information hierarchy, completion criteria, leading words, pruning), taking from ethskills only what it gives evidence for. Concretely:
  - The description is the always-loaded pointer: front-loaded leading word, one trigger per branch (the branches in the table above), identity left to the body. Both skills are model-invoked, which the split rule allows because each has a distinct trigger word the user actually types (_deploy_ / _upgrade_ versus _unsignable_, reached through _Safe_, _multisig_ or the `Unknown signer` message).
  - Leading words are the repository's own (_unsignable_ and _run-once_ are defined in `CONTEXT.md`, the others are the docs' words), so prompts, docs and skill share them: _deferred_, _unsignable_, _converge_, _rehearse_, _run-once_.
  - Rules are stated as the target behaviour. A prohibition stays only as a hard guardrail (secrets, the hash at a pause) and is paired with the positive target.
  - Steps end on a checkable completion criterion: a deployment is finished when a fork re-run of the same scripts sends nothing (a fork run reads the network's records and broadcasts nothing real), not when a command exits 0.
  - Anything the environment answers (`--help`, the docs pages, the config) is linked, not cached; the body carries the judgement no page or command confesses.
  - Pruning by measurement, ethskills' method and the no-op test of `writing-for-agents` alike: before a line ships, a stock agent without the skill is given a realistic task in a rocketh project, and a line it already gets right is cut. The task prompts are kept with the fixtures so the measurement can be re-run.
  - Not taken from ethskills: the "Not for" clause in descriptions (a negation, and a duplicated trigger), a root catalogue skill (it exists because ethskills is loaded by URL; three model-invoked skills route themselves) and the feedback endpoint.
- **One source (decision 2):** the repository's `skills/` is the only copy. It ships through `npx skills add wighawag/rocketh`, the raw files on rocketh.dev, the documentation page and the `AGENTS.md` that `hardhat-deploy init` writes; no package publishes it.
- **Documentation first, where the skill would say something the docs do not.** The documentation is the source of truth the skills must agree with. One gap was found while writing this proposal: no page says that a proxy upgrade does not check storage-layout compatibility. That sentence goes into `documentation/proxies/` before a skill states it.
- **Every code sample is a fixture (decision 3):** the migration-pairs mechanism, made stricter. Each fenced TypeScript block in a user skill, in `SKILL.md` or in `references/`, is preceded by `<!-- fixture: <path> -->` and is that file verbatim. Unlike the migration skill, an unmarked TypeScript block is an error, not an allowance. The fixtures are a miniature rocketh project, as `packages/hardhat-deploy/test/migration-pairs/` is, compiled by `pnpm typecheck` and run by `pnpm test`, each asserting the outcome the skill claims (a deferred step leaves no record and no run-once entry; a re-run after the Safe acted sends nothing). They cannot live in `rocketh`'s own tests, which may not depend on `@rocketh/test-utils` or the extensions (the nx cycle `CONTEXT.md` describes under _test environment_), so they go in a private workspace package or next to the migration pairs; which one is a tasking detail.

## Testing Decisions

- The compile check for every sample, by the mechanism of decision 3 (below). This is the acceptance criterion that matters.
- A check that the skill does not name a package export that no longer exists, which is the cheapest catch for the most likely drift.
- Prior art for known-good samples: `editable-deploy-scripts-in-the-docs`, which needs the same property for the docs site; it shares the property (what is shown is the file that runs) but not the mechanism, see decision 3.
- **Mechanism, concretely:** generalise `packages/hardhat-deploy/test/migration-pairs/skill.test.ts` from one skill to every `skills/*/` folder: marked blocks equal their files; a user skill has no unmarked TypeScript block; every fixture file is included or named by some skill, so a fixture cannot be orphaned.
- **Links resolve:** every `https://rocketh.dev/<path>/#<anchor>` in a skill maps to `<path>/index.md` in this repository, and the test fails when the page or the heading is missing. Since the skills link the documentation instead of restating it, a moved page is the most likely drift after an API change.
- **Flags exist:** every `--flag` in a skill's shell blocks is one the `rocketh` command or `hardhat deploy` defines, read from their option definitions (`packages/rocketh-node/src/cli-options.ts` and the hardhat-deploy task), so a renamed flag fails the suite.
- **The install path works:** a check that `npx skills` discovers every `skills/<name>/SKILL.md` (its `name` equals the folder, its frontmatter parses), so the one-command install cannot silently break.

## Out of Scope

- Any change to rocketh's runtime behaviour. This spec ships documentation shaped for a machine reader.
- A rocketh MCP server, an agent-facing API, or anything that lets an agent drive rocketh other than by writing and running deploy scripts as a human would.
- Guarantees about agent behaviour. The skill can state a rule; it cannot enforce one. Anything that must be enforced belongs in the code, which is where the deferral, the migration refusal and the guard already are.
- Instructions for developing rocketh itself, which are `AGENTS.md` and `CONTEXT.md` and stay separate.

## Further Notes

The evidence behind the reuse decision and the distribution answers is `work/notes/findings/ethskills-structure-coverage-and-reuse.md` (ethskills read at `47779e7`, 2026-10-26; Scaffold-ETH 2 at `87557d9`; the agent skills format and the skills CLI, all fetched 2026-10-28). One fact from it bears on discovery directly: the Hardhat flavor of Scaffold-ETH 2 depends on `hardhat-deploy` ^2 and `rocketh` ^0.23, so a skill shipped in `rocketh` reaches every project created from it.

The two corroborating reports came from opposite ends of the ecosystem, which is the useful signal: this is not one enthusiast's preference. It is also the cheapest item in the field study by a wide margin, and the only one whose absence is invisible to us, because an agent that guesses wrong about rocketh produces a frustrated user who blames the tool and never files anything.
