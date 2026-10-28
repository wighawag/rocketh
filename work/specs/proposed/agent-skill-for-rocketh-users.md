---
title: 'A skill file for agents deploying WITH rocketh, not agents developing rocketh'
slug: agent-skill-for-rocketh-users
humanOnly: true
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

<!-- open-questions -->

## Open questions

The four questions as first asked, each with what the evidence now settles and what is left. Question 3 is settled by evidence (an existing, tested mechanism); 1, 2 and 4 each leave a judgement call, with a recommendation. The proposal they add up to is under [The proposed skill set](#the-proposed-skill-set) in the Solution, and the research behind it is `work/notes/findings/ethskills-structure-coverage-and-reuse.md`.

1. **Which format, and how many?** A single `SKILL.md` loaded on description match, an `AGENTS.md` fragment a user pastes into their own project, or both. And one skill or several (deploy, upgrade a proxy, verify, export)? A single file is easier to keep true; several match how skills are selected. Leaning one skill file plus a short copy-pasteable `AGENTS.md` fragment, because the two surfaces answer different questions: the skill is loaded when the agent decides deployment is the task, the fragment is always in context for a project that uses rocketh.
   - **Settled by evidence, the format:** `SKILL.md` with `name` and `description` frontmatter, the shape `skills/hardhat-deploy-migration/` already uses and the one the agent skills format defines (`name` equal to the directory name, a `description` that says when to use it, optional `references/` files loaded on demand, `SKILL.md` kept under 500 lines). Every agent the skills CLI supports reads it.
   - **Settled by evidence, the fragment is a pointer, not a second copy of the rules:** ethskills' "Persistent Setup" is a single line pasted into `AGENTS.md` or a Cursor rule that tells the agent to read the skill. The fragment is that pointer plus the facts only the project knows (which networks are live, which named accounts it cannot sign for), which is what story 7 asks for. A fragment that restated the rules would be a second artifact to keep true, with no fixture behind it.
   - **Left open, the count. Recommendation: two new skills next to the existing migration skill**, split where the trigger and the audience differ and nowhere else: `rocketh-deploy` (writing, running, re-running and upgrading deploy scripts, then verifying and exporting) and `rocketh-safe-owned-changes` (a step rocketh cannot sign for, and rehearsing it on a fork). Upgrade, verify and export stay inside `rocketh-deploy`, because an upgrade is an edit of the same deploy script followed by a re-run (`documentation/proxies/`, "Upgrading"; step 3 of `documentation/safe-owned-project/`) and verify and export are commands run after it: splitting them would repeat the core rules three times. The reasons for the one split are under the skill set below.
2. **Shipped where?** In the `rocketh` package (which currently publishes only `dist` and `src`, so `files` would need an entry), in a dedicated package, or only in the repo and the docs site. Shipping it in the package puts it where an agent working in a user's project can actually find it, which is the point; publishing docs on a website does not help an agent that never browses.
   - **Settled by evidence, the repo:** the canonical copy stays at `skills/<name>/SKILL.md` in this repository. That layout is already installable today with `npx skills add wighawag/rocketh`, which discovers `skills/<name>/SKILL.md` in a repository.
   - **Settled by evidence, the package is `rocketh`, under `skills/<name>/`:** `skills/<name>/SKILL.md` at a package's root is the layout the skills CLI's `experimental_sync` finds in an installed dependency and links into the project, updating with the package. `rocketh` is the one package every project on either path depends on directly: the template, the Hardhat flavor of Scaffold-ETH 2 (`rocketh ^0.23.1` at `87557d9`), and every project the migration skill produces. A build step copies `skills/` into the package and `files` gains `skills`, so the repository keeps one source and the installed copy matches the installed version (the spec's "versioned with the package" decision). A dedicated package would add a dependency nobody installs.
   - **Settled by evidence, the docs and the install paths:** one documentation page, "Working with an AI agent", lists the skills and gives three install paths: `npx skills add wighawag/rocketh` (every agent the skills CLI supports), copying the folder into `.claude/skills/` or `.agents/skills/` by hand, and the one-line `AGENTS.md` pointer for an agent without skills support. The getting-started pages and the package READMEs link it, as `packages/hardhat-deploy/README.md` links the migration skill today.
   - **Left open, four judgement calls, with recommendations.** (a) Serve the raw files at `rocketh.dev/skills/<name>/SKILL.md`, as ethskills serves `ethskills.com/<skill>/SKILL.md`: recommended, but it is a change in the separate rocketh-website repository; until then the docs link the raw GitHub URL. (b) A `.claude-plugin/marketplace.json` so Claude Code can `/plugin marketplace add wighawag/rocketh`: not now, and if ever, with a test that it lists every `skills/` folder, since ethskills' own hand-kept `plugin.json` already omits two of its skills. (c) Have `hardhat-deploy init` write the `AGENTS.md` pointer into the project it scaffolds: recommended, it is the cheapest route to story 10. (d) A pull request to ethskills that corrects its Foundry-only `yarn verify` statement for Scaffold-ETH 2's Hardhat flavor and points to `rocketh-deploy`: recommended as a courtesy and a discovery path, not counted on, because ethskills dropped its one outbound pointer to a tool's own skill in a wholesale rewrite.
3. **How is it kept from going stale?** This is the question that decides whether the artifact is worth having, see the Problem Statement. Candidates: every code sample lives in a compiled fixture and the skill embeds it, a test asserts the skill's samples typecheck, or the samples are generated from the same source as the documentation site's. Related work exists in `editable-deploy-scripts-in-the-docs`, which has the same underlying need for samples that are known to run.
   - **Settled by evidence: the first candidate, the one the migration skill already uses and tests.** `packages/hardhat-deploy/test/migration-pairs/` is a miniature rocketh project whose files are compiled by `pnpm typecheck` and run by `pnpm test` against `createTestEnvironment`, and `skill.test.ts` fails when a code block marked `<!-- migration-pair: <file> -->` in the skill differs from its file. The user skills take the same mechanism, made stricter, as set out under Implementation Decisions and Testing Decisions. The editable-docs spec shares the property (what is shown is the file that runs) but not the mechanism (it bundles modules for a browser), so neither waits for the other.
4. **How far does it go on safety?** An agent driving a deployment can spend real money and can put a governance action in front of a multisig. Does the skill merely describe rocketh, or does it carry operating rules (confirm the target network before broadcasting, never invent an address, stop and ask when a transaction is deferred)? Leaning yes on the rules, but they must be rules the SKILL can state truthfully, not aspirations about what the agent will do.
   - **Left open, it is the maintainer's register to set. Recommendation: yes, limited to rules that describe what rocketh does or whose authority a step needs**, each tied to the code or page that makes it true. The strongest candidate was found in the code and is specific to agents: before a run from the `rocketh` command or `hardhat deploy` (except on hardhat's in-memory network), rocketh prints the environment, chain and tags and asks for confirmation (`askBeforeProceeding`, `packages/rocketh/src/executor/index.ts`); in an agent's shell, which is not a terminal, that question cannot be asked, so rocketh throws and names `--skip-prompts` as the way through (`packages/rocketh-node/src/environment/prompt.ts`). An agent will follow that message. The rule: show the user the environment and chain that message printed and get a yes before adding `--skip-prompts`, and never add it to a `--reset` run the user did not ask for, since that confirmation is the one before deleting the environment's records. The others are in the skill set below.

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

### The proposed skill set

Three skills, two of them new, each a `skills/<name>/SKILL.md` with frontmatter. The names are proposals; the split is the substance.

| Skill                               | Loaded when                                                                                                                                                                                                                                                                                            | Carries                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `rocketh-deploy` (new)              | a project uses rocketh or hardhat-deploy v2 (a `rocketh/config.ts`, `deployScript` files, `rocketh` or `hardhat-deploy` ^2 in `package.json`, which includes the Hardhat flavor of Scaffold-ETH 2) and the task is to write, run, re-run or upgrade a deploy script, or to verify or export afterwards | the deploy decision rules, the network check, secrets, what rocketh does not do; `references/` for proxies and diamonds             |
| `rocketh-safe-owned-changes` (new)  | a step's `from` is an account rocketh cannot sign for (a Safe, multisig, timelock, governance executor, hardware wallet), a run printed `Unknown signer for account` or threw `UnknownSignerError`, a privileged `execute` needs a `guard`, or a production change is to be rehearsed on a fork        | the deferral rules, the pause, governance owners, guards, fork rehearsal and captured transactions, the production-hardening checks |
| `hardhat-deploy-migration` (exists) | porting a hardhat-deploy v1 project                                                                                                                                                                                                                                                                    | unchanged; its description gains a pointer to `rocketh-deploy` for the work after the port                                          |

Each description is a context pointer written by the rules under Implementation Decisions ("How the skills are written"): it front-loads the leading word, lists one trigger per branch, and routes the neighbouring branch to its sibling by name, the way ethskills routes between its own skills but phrased positively: `rocketh-deploy` sends an account it cannot sign for to `rocketh-safe-owned-changes`, and a v1 project to `hardhat-deploy-migration`.

**Why `rocketh-safe-owned-changes` is its own skill.** Its trigger is different: it is reached because rocketh stopped (a pause, an `UnknownSignerError`) or because the account in the config is a Safe, not because the user asked to deploy. Its audience is different: teams operating governed production contracts, not someone deploying to a testnet. And it is where the stakes and most of the decision rules are: deferred is not done, the hash at the pause, the guard, a governance owner's `{to, data}`. The documentation already treats it as its own part (`documentation/unknown-signers/`, `safe-owned-project/`, `execute-guard/`, `script-lifecycle/`, `captured-transactions/`, `fork-runs/`, `production-hardening/`). Fork rehearsal goes with it because every page that explains rehearsal explains it as the way to exercise a step the run cannot sign for on a live network (`production-hardening/`, "Rehearse on a fork"; step 4 of `safe-owned-project/`; "On a fork or in the browser: impersonation instead" in `unknown-signers/`); `rocketh-deploy` points to it for a mainnet deploy.

**What `rocketh-deploy` says,** each rule tied to the page or code that makes it true:

- Re-running is how a deployment finishes and how an upgrade happens: a re-run redeploys only what changed, compared against the chain or the record (`documentation/deploy-contracts/`, "When does a re-run redeploy?"; `deploy-scripts/`, "A script must be safe to re-run").
- Addresses come from deployment records (`env.get`, `deployments/<environment>/`) and named accounts, never from memory or a chat message (`deployment-records/`, `named-accounts/`).
- The network check is rocketh's confirmation, and an agent's shell cannot answer it: the `--skip-prompts` rule in open question 4.
- Keys and RPC URLs come from the environment and the agent never handles them: `MNEMONIC_<network>`, `ETH_NODE_URI_<network>` and their `SECRET` form (`hardhat-deploy/networks/`); `linkedData` is public (`exporting-and-verifying/`).
- What rocketh does not do: there is no built-in `live` tag, so `env.tags.live` is falsy on mainnet unless the config declares it (`environments/`, "Tags"); a proxy upgrade does not check storage-layout compatibility (read in `packages/rocketh-proxy/src/index.ts`, which reads the EIP-1967 slot and nothing about layout; the documentation does not say this yet, so a documentation change comes first, see Implementation Decisions); `rocketh-export` does not touch the chain unless given `--verify` (`exporting-and-verifying/`).

**What `rocketh-safe-owned-changes` says:**

It teaches rocketh's native path only: the pause under `ask`, `throw` when unattended, a `guard` so the re-run converges, and a fork rehearsal with captured transactions to get the whole batch in one pass. `catchUnknownSigner` is not taught: it exists to port hardhat-deploy v1 scripts, and a script that already calls it is routed to `hardhat-deploy-migration` and the migration page. Without it, the run-once hazard the spec started from (`return true` after a caught deferral) does not arise on the taught path: a `throw` aborts before the script returns, and a resolved pause is a step that happened. Whether the documentation should demote it the same way is a separate decision, `work/notes/ideas/catch-unknown-signer-only-in-the-migration-docs.md`.

- A deferred step did not happen. Under `throw` the run aborts at that step and records nothing (`unknown-signers/`, "A run that threw will hand you the same transaction again"); the agent reports the printed transaction to the user verbatim as outstanding, and the deployment as unfinished.
- The hash at a pause is the human's to give. rocketh checks it, but "a user who deliberately confirms the wrong transaction is believed" (`unknown-signers/`, accepted residual risk), so the hash and the answer to the "different call" question come from the user, who executed the transaction. In an agent's own shell there is no pause at all: `auto` takes the `throw` path without a terminal ("In CI it does not hang, it throws").
- Finishing after a deferral is a re-run: from a terminal, pasting the hash of the transaction the user executed ("A hash from an earlier run is still good"), or unattended, once a `guard` lets the re-run see the effect on chain.
- A privileged `execute` carries a `guard`, or every re-run hands the same transaction over again (`execute-guard/`; step 6 of `safe-owned-project/`).
- When the owner is a governance contract, the printed transaction is a `{to, data}` action for a proposal, not something to send (`unknown-signers/`, "When the owner is governance, not a multisig").
- A stop is resolved by the account that holds the authority: `autoImpersonate` and `onUnknownSigner` stay as the project configured them for a live network, and when the admin must stay external the script asserts it with `env.addressSignability` (`production-hardening/`, `unknown-signers/`).
- The rehearsal: `--is-fork` or `HARDHAT_FORK`, `environments.<name>.chain` for a hardhat fork that reports 31337, records read and not written, `--write-transactions` for the batch, `fundImpersonatedAccounts` (`fork-runs/`, step 4 of `safe-owned-project/`).

### ethskills: reuse it, or write our own

Researched before proposing anything, because a well-known catalogue of Ethereum skills for agents already exists and is listed on ethereum.org. Findings, with every source, are in `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. In short: ethskills is many short, standalone skills behind a hand-kept catalogue, fetched by URL or installed as a plugin; it covers deploying through Foundry and Scaffold-ETH 2, never names hardhat-deploy or rocketh, and states one Foundry-only fact about `yarn verify` as true of Scaffold-ETH 2 in general, which is wrong for the Hardhat flavor that runs on hardhat-deploy v2 and rocketh; it is MIT by declaration; and it is kept current by baseline-testing models and by benchmark-driven rewrites of every skill at once.

**Decision: write rocketh's own skills, and borrow the shape.** Its format is modular (a skill is a directory loaded only when fetched), but the project is not a host for a tool's skill: adding one means editing its catalogue in five places, the contribution bar is a measured model blind spot, a rewrite in October 2026 replaced every skill at once, and the content is served unversioned while ours must match the installed rocketh. A rocketh module there could not carry the fixture test that is this spec's acceptance criterion. Borrowed where there is reason to believe it works: one topic per skill with descriptions that route to a sibling, short skills that link out for depth, the method of baseline-testing a stock agent on a realistic task and keeping only what changes its behaviour (`CONTRIBUTING.md`; the October rewrite was measured at 94% against 85% on their task suite), the one-line `AGENTS.md` pointer as the setup for agents without skills, and the wallet rule's form, "print what will happen, then stop until a human says yes". Not borrowed: a URL as the only channel (an agent in a project should find the skill in its dependencies), and the feedback endpoint that has agents POST notes to a server.

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

`needsAnswers: true`: four questions. Question 3 in particular decides whether this is worth building at all, since an unverifiable skill file is a liability rather than an asset. Update: question 3 is now settled by evidence (the migration skill's tested mechanism); questions 1, 2 and 4 each keep one judgement call, with a recommendation, so the flag stays set until the maintainer has answered them.

## Implementation Decisions

- **Decision rules, not API reference.** Anything the documentation site already says is linked, not copied.
- **Every sample compiles.** The mechanism is open question 3, but the property is not negotiable: a sample that does not compile against the current API must fail something.
- **The skill states what rocketh does not do**, explicitly. The expensive agent failures are assumed capabilities: that a deferred transaction was sent, that a record proves a call happened, that a proxy upgrade validated its own storage layout.
- **No secrets, ever, and the skill says so.** Private keys and RPC credentials come from the environment, and the skill must not model a workflow in which an agent handles either.
- **The skill is versioned with the package it describes**, so an old install carries the instructions that were true for it.
- **Format (open question 1, settled part):** `skills/<name>/SKILL.md`, `name` equal to the folder, a "Use when ... Not for" `description`, the body under 500 lines, depth in `references/*.md` (one level, loaded on demand). The migration skill is 2485 lines and stays as it is; restructuring it is not this spec.
- **How the skills are written:** by the maintainer's `writing-for-agents` skill, which lives outside this repository and whose rules that matter here are listed below (context pointers, the information hierarchy, completion criteria, leading words, pruning), taking from ethskills only what it gives evidence for. Concretely:
  - The description is the always-loaded pointer: front-loaded leading word, one trigger per branch (the branches in the table above), identity left to the body. Both skills are model-invoked, which the split rule allows because each has a distinct trigger word the user actually types (_deploy_ / _upgrade_ versus _Safe_ / _multisig_ / _unknown signer_).
  - Leading words are the repository's own, already defined in `CONTEXT.md` and the docs, so prompts, docs and skill share them: _deferred_, _unsignable_, _converge_, _rehearse_, _run-once_.
  - Rules are stated as the target behaviour. A prohibition stays only as a hard guardrail (secrets, the hash at a pause) and is paired with the positive target.
  - Steps end on a checkable completion criterion: a deployment is finished when a re-run sends nothing, not when a command exits 0.
  - Anything the environment answers (`--help`, the docs pages, the config) is linked, not cached; the body carries the judgement no page or command confesses.
  - Pruning by measurement, ethskills' method and the no-op test of `writing-for-agents` alike: before a line ships, a stock agent without the skill is given a realistic task in a rocketh project, and a line it already gets right is cut. The task prompts are kept with the fixtures so the measurement can be re-run.
  - Not taken from ethskills: a root catalogue skill (it exists because ethskills is loaded by URL; three model-invoked skills route themselves) and the feedback endpoint.
- **One source, copied into `rocketh` at build (open question 2, settled part):** the repository's `skills/` is canonical; the `rocketh` package's build copies it to `packages/rocketh/skills/` (ignored by git) and `files` gains `skills`. This is a change to a published package's contents, so it carries a changeset.
- **Documentation first, where the skill would say something the docs do not.** The documentation is the source of truth the skills must agree with. One gap was found while writing this proposal: no page says that a proxy upgrade does not check storage-layout compatibility. That sentence goes into `documentation/proxies/` before a skill states it.
- **Every code sample is a fixture (open question 3, settled):** the migration-pairs mechanism, made stricter. Each fenced TypeScript block in a user skill, in `SKILL.md` or in `references/`, is preceded by `<!-- fixture: <path> -->` and is that file verbatim. Unlike the migration skill, an unmarked TypeScript block is an error, not an allowance. The fixtures are a miniature rocketh project, as `packages/hardhat-deploy/test/migration-pairs/` is, compiled by `pnpm typecheck` and run by `pnpm test`, each asserting the outcome the skill claims (a deferred step leaves no record and no run-once entry; a re-run after the Safe acted sends nothing). They cannot live in `rocketh`'s own tests, which may not depend on `@rocketh/test-utils` or the extensions (the nx cycle `CONTEXT.md` describes under _test environment_), so they go in a private workspace package or next to the migration pairs; which one is a tasking detail.

## Testing Decisions

- The compile check for every sample, whatever mechanism open question 3 picks. This is the acceptance criterion that matters.
- A check that the skill does not name a package export that no longer exists, which is the cheapest catch for the most likely drift.
- Prior art for known-good samples: `editable-deploy-scripts-in-the-docs`, which needs the same property for the docs site and should share the mechanism rather than invent a second one.
- **Mechanism, concretely:** generalise `packages/hardhat-deploy/test/migration-pairs/skill.test.ts` from one skill to every `skills/*/` folder: marked blocks equal their files; a user skill has no unmarked TypeScript block; every fixture file is included or named by some skill, so a fixture cannot be orphaned.
- **Links resolve:** every `https://rocketh.dev/<path>/#<anchor>` in a skill maps to `<path>/index.md` in this repository, and the test fails when the page or the heading is missing. Since the skills link the documentation instead of restating it, a moved page is the most likely drift after an API change.
- **Flags exist:** every `--flag` in a skill's shell blocks is one the `rocketh` command or `hardhat deploy` defines, read from their option definitions (`packages/rocketh-node/src/cli-options.ts` and the hardhat-deploy task), so a renamed flag fails the suite.
- **The package ships them:** a check that `rocketh`'s packed file list contains `skills/<name>/SKILL.md` for every skill, so the copy step cannot silently stop.

## Out of Scope

- Any change to rocketh's runtime behaviour. This spec ships documentation shaped for a machine reader.
- A rocketh MCP server, an agent-facing API, or anything that lets an agent drive rocketh other than by writing and running deploy scripts as a human would.
- Guarantees about agent behaviour. The skill can state a rule; it cannot enforce one. Anything that must be enforced belongs in the code, which is where the deferral, the migration refusal and the guard already are.
- Instructions for developing rocketh itself, which are `AGENTS.md` and `CONTEXT.md` and stay separate.

## Further Notes

The evidence behind the reuse decision and the distribution answers is `work/notes/findings/ethskills-structure-coverage-and-reuse.md` (ethskills read at `47779e7`, 2026-10-26; Scaffold-ETH 2 at `87557d9`; the agent skills format and the skills CLI, all fetched 2026-10-28). One fact from it bears on discovery directly: the Hardhat flavor of Scaffold-ETH 2 depends on `hardhat-deploy` ^2 and `rocketh` ^0.23, so a skill shipped in `rocketh` reaches every project created from it.

The two corroborating reports came from opposite ends of the ecosystem, which is the useful signal: this is not one enthusiast's preference. It is also the cheapest item in the field study by a wide margin, and the only one whose absence is invisible to us, because an agent that guesses wrong about rocketh produces a frustrated user who blames the tool and never files anything.
