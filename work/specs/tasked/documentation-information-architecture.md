---
title: 'One documentation site a reader can follow: information architecture for rocketh and hardhat-deploy'
slug: documentation-information-architecture
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Decisions on the open questions (maintainer, 2026-10-27)

1. **Runner order:** hardhat-deploy commands first, the `rocketh` CLI form beside them as `::: code-group` tabs. On GitHub a code-group reads as two consecutive code blocks, which is acceptable.
2. **URLs:** every old URL keeps working, through a redirect table in the docs template that emits a forwarding page per old URL (added to the template if it lacks it). The links we own (READMEs, template repositories) are updated too.
3. **Package READMEs:** thin (purpose, install, wiring, one minimal example, a link to the site page) for every package except `hardhat-deploy`, whose npm README stays fuller because it is where most users land.
4. **The Safe-owned guide:** key excerpts inline, plus a link to branch `examples/safe-owned-upgrade` of template-ethereum-contracts. Commands shown as the template's pnpm scripts, each with the underlying `anvil` / `rocketh` / `hardhat` command beside it once.
5. **Reference pages:** hand-write the small ones now (the CLI options); generate the rest later on the docs template (TypeDoc JSON).
6. **Order against the site move:** rocketh.dev moves to the SvelteKit docs template FIRST (mechanical, it already renders this content), then this restructure is built directly on the new site, with `order` frontmatter, so the VitePress sidebar is never rewritten for a structure about to change.
7. **Hot Contract Replacement:** keep the claim, and document the watcher setup taken from the template, after checking it actually works.
8. **The v1 guide's troubleshooting section:** remove it, in favour of the capability map. A "common errors" page may come later, built only from messages the code prints.
9. **`documentation/testing`:** moves under "Extending rocketh".

## Problem Statement

The user-facing documentation grew one page per feature, written at different times, in two trees that were once two separate sites. A reader cannot follow it as a whole:

- The same topic is covered in up to five places that do not agree. Setup is written three times (root `README.md`, `documentation/installation/`, `hardhat-deploy/.../how-to/setup-first-project/`, plus half of `hardhat-deploy/.../installation/`). Fork rehearsal is covered by `documentation/fork-runs/` and `hardhat-deploy/.../how-to/use-fork-testing/`, and the second omits what makes a hardhat fork rehearse correctly at all (a hardhat node reports chain 31337, so without `environments.<network>.chain` the rehearsal takes the local dev node's settings and tags). There are two v1 migration documents. Proxies, diamonds, exporting and verifying, named accounts, configuration and test fixtures are each written twice or more.
- Where most hardhat-deploy v1 users land, the hardhat-deploy tree, there is no page about Safes, multisigs or unknown signers, which is the reason a production team picks rocketh over the alternatives. The pieces exist in the rocketh tree (fork runs, unknown signers, captured transactions, the execute guard), but no page takes one project from "a Safe owns my proxy" to "the upgrade is done and a re-run sends nothing".
- Pages describe behaviour that has since changed. The audit (`docs/spikes/documentation-information-architecture/audit.md`) found and fixed about fifty statements that the code contradicted, from option shapes and package names to dead links and versions a caret range can never reach. The structure makes this recur: a change to one behaviour has to be found in every copy.
- Features with no user-facing page at all: `@rocketh/router`, running scripts in a browser with `@rocketh/web`, create3 and `computeDeterministicAddress`, most of the configuration surface, the CLI options of the `hardhat deploy` task, and the deployment record format.
- The package READMEs, which is what npm shows, duplicate site content in depth (the `guard` section of `@rocketh/read-execute`, the CLI tables of `@rocketh/node`) or are the only home of a feature (router, web, verifier). They drift independently of the site.

## Solution

One site, about rocketh, with hardhat-deploy as a large section of it rather than a site of its own. One page per topic, organised by what the reader is trying to do. Package READMEs become short entry points that link to the site, and the template-ethereum-contracts project (its `main` and its example branches) is the worked source the guides are written from.

### Decisions taken

- **One site, not two** (answered 2026-10-27). The site is the rocketh documentation; hardhat-deploy is a section inside it, not a separate tree or site. Pages that only exist because of Hardhat live in that section. Topics that apply to both runners have one shared page that shows both commands. `/hardhat-deploy/` stays as that section's entry page, because npm, the plugin README, the template and search all point there.
- **Template example branches stay branches** (answered 2026-10-27), to keep the template's `main` simple. The guides depend on them being kept current, which today they are not (see [Sources](#sources-template-ethereum-contracts)).

### Proposed information architecture

Six sections. Every topic has exactly one page; where a shared page serves both runners it shows both commands (see open question 1).

**1. Start**

- Introduction: what rocketh is, what hardhat-deploy v2 is, how they relate, which one to start with, and the playground. Merges `documentation/` (intro), `hardhat-deploy/.../introduction/`, `what-is-it-for/`, `in-a-nutshell/`. Ends with the two reading paths below.
- Get started without Hardhat: the `rocketh` CLI with any compiler that produces artifacts (from `documentation/installation/`).

**2. hardhat-deploy** (entry page at `/hardhat-deploy/`)

The section owns what only exists because of Hardhat, and gives a hardhat-deploy reader a numbered path into the shared pages.

- hardhat-deploy (section entry, at `/hardhat-deploy/`): what the plugin is, how it relates to rocketh, and the numbered path: Get started, Deploy contracts, Proxies, Test, Rehearse on a fork, A Safe-owned project, Export and verify. Replaces the second hero (`hardhat-deploy/index.md`).
- Get started with hardhat-deploy: `hardhat-deploy init`, or by hand. The single home of the Hardhat setup walkthrough (from `setup-first-project/`, `hardhat-deploy/.../installation/`, the plugin-configuration part of `documentation/hardhat-deploy/`; the root README's Getting Started stays as the tested copy, see Package READMEs).
- Coming from hardhat-deploy v1: the capability map (`documentation/migration/`) first and the step-by-step guide (`migration-from-v1/`) second, as today, but trimmed (the guide carries full v1 and v2 config dumps that the template already shows). The template's `examples/old-template-for-hardhat-deploy-v1-comparison` and `examples/old-template-migration-to-v2-by-ai` branches give it a real before and after.
- The `hardhat deploy` task: its options (today undocumented: `--polling-interval`, `--default-build-profile`, `--report-gas-used`, `--save-deployments true|false`), how it maps to the `rocketh` CLI, and what it does not have (`--write-transactions`).
- Networks and accounts from the environment: the network helpers and `HARDHAT_FORK` / `HARDHAT_FORK_NUMBER` (from `configure-network-helpers`, the network half of `use-fork-testing`).
- Typed artifacts: `generateTypedArtifacts` and the generated `artifacts` / `abis` modules.
- Tests with Hardhat fixtures: `networkHelpers.loadFixture` over `loadAndExecuteDeploymentsFromFiles`, TypeScript and Solidity tests (from `deployment-fixtures-in-tests`, the tests half of `documentation/hardhat-deploy`, and the template's "Writing tests").
- Scripts and the Hardhat connection: `loadEnvironmentFromHardhat`, `getHardhatConnection(env)` (the template's `examples/hardhat-connection-access` branch).
- Development workflow: local node, watch mode and redeploy on change (Hot Contract Replacement, open question 7), from the template's README.

**3. Concepts**

- Deploy scripts, tags and dependencies (from `core-concepts`, `use-tags-and-dependencies`, `how-to-deploy-contracts`).
- Running once, and running last (`script-lifecycle`, unchanged).
- Environments and chains, including legacy chains and run-level fees (from `core-concepts`).
- Named accounts and signers (from `core-concepts`, `configure-named-accounts`, the account-error sections of `documentation/hardhat-deploy`, and the signer protocol part of the `@rocketh/signer` README).
- Deployment records: what is saved, where, the `.chain` file, importing existing deployments, reading them from other tools (from the second half of `installation`/`setup-first-project`, the record-format table in the capability map, ADR 0015).

**4. Guides** (shared: each shows the `hardhat deploy` and the `rocketh` command)

- Deploy contracts, including libraries (`deploying`, `examples`).
- Deterministic addresses: create2, create3, `computeDeterministicAddress` (NEW, from the `@rocketh/deploy` README).
- Upgradeable contracts with proxies (`deploying#deploying-proxies`, `deploy-with-proxies`, the `@rocketh/proxy` README's behaviour sections, and the template's `examples/proxy-no-constructor-but-initializer`).
- Diamonds (`deploying#deploying-diamonds`, `deploy-diamond-contracts`).
- Routers (NEW, from the `@rocketh/router` README).
- Rehearse on a fork (`fork-runs` and the rehearsal half of `use-fork-testing` merged; both entry points, `--is-fork` and `HARDHAT_FORK`, with the hardhat chain-id condition stated where a hardhat user will see it).
- **A Safe-owned project, end to end (NEW, see below).**
- Unknown signers: pause, paste, defer (`unknown-signers`).
- Guard execute calls (`execute-guard`).
- Captured transactions (`captured-transactions`).
- Export, verify and document (`exporting-and-verifying`, `verify-contracts`, `export-deployments`, the matching half of `command-and-tasks`, and the template's "Adding a web frontend").
- Share contracts between projects: publishing a project's artifacts, deployments and deploy scripts as a package and consuming them (the capability map's "Consuming another project", the template's "Publishing & Consuming Contracts" and its `examples/deploy-export`, `examples/deploy-import`, `examples/ens-import` branches).
- Use viem (`use-viem-integration`).
- Run deploy scripts in a browser (NEW, from the `@rocketh/web` README).
- Production hardening (`production-hardening`, unchanged).

**5. Reference**

- CLI: `rocketh`, the `hardhat deploy` task (summary, linking to its section page), `rocketh-verify`, `rocketh-export`, `rocketh-doc`, `hardhat-deploy init` (NEW; today only in READMEs or nowhere).
- Configuration: every key of `rocketh/config.ts` (`UserConfig`, `ChainUserConfig`, `DeploymentEnvironmentConfig`). Absorbs `hardhat-deploy/.../configuration/`. The Hardhat-side configuration lives in the hardhat-deploy section and is linked from here.
- The environment API (`hardhat-deploy/.../environment/`, ideally generated, open question 5).
- Packages: one table, each row a one-line purpose and a link to its README and to its guide.

**6. Extending rocketh**

- Writing an extension (from the `@rocketh/core` README's "Writing an extension").
- Testing an extension (`documentation/testing`).
- Architecture (`architecture`, completed to all packages).

### The two reading paths

- **A hardhat-deploy user** lands on `/hardhat-deploy/` (npm, the plugin's README, the template and search all point there): the hardhat-deploy section's entry page, with its numbered path through its own pages and into the shared guides. A v1 user's first stop is Coming from hardhat-deploy v1, at the top of the section.
- **A rocketh user** lands on the home page or `/documentation/`, and the Introduction gives a numbered path starting from Get started without Hardhat.

Both paths read the same shared pages. A topic that differs by runner says so in one place (a command shown both ways), never as a second page.

### The Safe-owned project guide (new)

The worked example is branch `examples/safe-owned-upgrade` of github.com/wighawag/template-ethereum-contracts: README section "Rehearse a Safe-owned upgrade on a fork", `contracts/deploy/000_deploy_safe.ts`, `contracts/rocketh/safe.ts`, `contracts/rocketh/config.ts`. It was run for real on Sepolia. The guide follows it in order:

1. Name the Safe before it exists: its address follows from Safe's v1.4.1 factory, singleton, owners, threshold and salt (`predictSafeAddress`), so `rocketh/config.ts` can declare `admin: {default: 1, sepolia: SEPOLIA_SAFE}`; a deploy script creates the Safe if it has no code (`000_deploy_safe.ts`) and does nothing once it exists.
2. Deploy with the Safe as the proxy owner. The deployer pays; nothing needs the Safe yet.
3. Change the implementation, so an upgrade is due, which only the Safe can send.
4. Rehearse on a fork: `anvil --fork-url`, then the run with `--is-fork` and `--write-transactions`; impersonation is on by default for a fork, `whenForked: {fundImpersonatedAccounts: true}` pays the Safe's gas, and the `impersonated` entries of the written batch are what the Safe must execute. Note `environments.sepolia.chain` for a hardhat fork.
5. Upgrade for real: the run deploys the implementation, pauses at the upgrade and prints the Safe transaction with its one-line ABI; execute it with the Safe app's Transaction Builder, paste the hash, the run checks it (a decoded `execTransaction` of exactly the requested call is accepted) and continues.
6. Run again: nothing is sent, because `deployViaProxy` reads the implementation slot. For a privileged `execute` with no built-in check, add a `guard`.

It links out to the existing guides for depth (fork runs, unknown signers, captured transactions, execute guard) rather than repeating them, and it is linked from the hardhat-deploy landing page and from the proxies guide.

### Sources: template-ethereum-contracts

The template (github.com/wighawag/template-ethereum-contracts) is the most realistic working project there is, and the guides are written from it:

| Template material | Feeds |
| --- | --- |
| README: setup, compile, watch mode, local development, deploy, verify, scripts | Get started with hardhat-deploy; Development workflow |
| README: "Writing Tests" (TypeScript and Solidity) | Tests with Hardhat fixtures (Solidity tests are absent from the docs today) |
| README: "Publishing & Consuming Contracts" | Share contracts between projects |
| README: "Adding a Web Frontend" | Export, verify and document |
| `examples/safe-owned-upgrade` | A Safe-owned project, end to end |
| `examples/deploy-export`, `examples/deploy-import`, `examples/ens-import` | Share contracts between projects |
| `examples/hardhat-connection-access` | Scripts and the Hardhat connection (`getHardhatConnection`) |
| `examples/proxy-no-constructor-but-initializer` | Proxies, initializer section |
| `examples/old-template-for-hardhat-deploy-v1-comparison`, `examples/old-template-migration-to-v2-by-ai` | Coming from hardhat-deploy v1 (frozen snapshots, see below) |
| `examples/npmFilesToBuild` | to be decided when the branch is brought up to date |

**Linking rule.** A page carries inline the minimal snippet a reader needs, so it reads on its own, and links to the template as the full working project. For an example branch it links to the comparison with `main` (`compare/main...examples/<name>`), which shows exactly what the example adds.

**Dependency: the example branches must be kept current.** Measured 2026-10-27 with GitHub's compare API, each branch is a small change on `main` (1 to 6 commits of its own), and all but one are far behind it:

| Branch | Own commits | Behind `main` | Last commit |
| --- | --- | --- | --- |
| `examples/safe-owned-upgrade` | 5 | 0 | 2026-10-27 |
| `examples/old-template-for-hardhat-deploy-v1-comparison` | 1 | 39 | 2026-01 |
| `examples/npmFilesToBuild` | 1 | 90 | 2025-10 |
| `examples/proxy-no-constructor-but-initializer` | 2 | 90 | 2025-10 |
| `examples/deploy-export` | 6 | 109 | 2025-09 |
| `examples/deploy-import` | 3 | 109 | 2025-09 |
| `examples/hardhat-connection-access` | 1 | 120 | 2025-08 |
| `examples/ens-import` | 2 | 129 | 2025-05 |
| `examples/old-template-migration-to-v2-by-ai` | 6 | 195 | 2026-01 |

A guide may link to an example branch only if that branch is kept current against `main` and checked, by a mechanism that lives in the template repository and is tracked there (on its orphan `work` branch, since the template's `main` must not carry it). The two `old-template-*` branches are frozen on purpose (they show v1 and the migration as they were) and are exempt; the docs say so where they link to them. A branch that is neither kept current nor frozen is not linked.

### What real projects do that the docs do not say

Projects built on the templates were read (2026-10-27) to see how rocketh is used beyond the template's `main`. The public ones are jolly-roger, template-commit-reveal and stratagems (a port in progress); others exist and are private. They are research sources for the guides, not pages the docs must link to. What they rely on that no page explains:

- **Deploy script ARGUMENTS.** A script's function takes a second parameter, supplied as the second argument of `loadAndExecuteDeploymentsFromFiles(params, args)`. Tests use it to override a game's configuration per test (`stratagems`: `contracts/deploy/020_deploy_game.ts`, `contracts/test/utils/stratagems-test.ts`). Belongs in Deploy scripts and in Tests with Hardhat fixtures.
- **A proxy in front of a router.** Every game contract is `deployViaProxy` whose `artifact` is a function returning `deployViaRouter(...)` over several route contracts, which is how a contract above the size limit stays upgradeable (`stratagems` `020_deploy_game.ts`; template-commit-reveal's game). The Routers guide is built around this, not around a bare router.
- **Per-environment `data` as the deployment's configuration.** Scripts read `data.<Contract>.<field>` for durations and policies, and a browser deployment merges its own entry per key and environment (template-commit-reveal `web/src/lib/embedded/deploy.ts`, `composeWorldConfig`). Belongs in Environments and chains, with the `{[key]: {[environment]: value}}` shape spelled out.
- **Several environments on one chain**, distinguished by `overrides.tags` (`stratagems` `contracts/rocketh/config.ts`: `alpha1` and `base` both on 8453, both tagged `mainnet`), and scripts deciding from `env.name` and `env.tags` through a helper module in `deploy/.config/`.
- **What the executor skips in `deploy/`**: sub-folders are walked, names starting with `.` or `_` are ignored, so helper modules can live beside the scripts (`deploy/.config/`, `deploy/000_debug/`). Only the `_` rule is mentioned today, in passing.
- **Chain `properties` consumed by the frontend** through the export (`averageBlockTimeMs`, `finality`; jolly-roger `web/src/lib/deployments-store.ts`), and by gas pricing in a browser deployment. Belongs in Environments and chains and in Export.
- **Running the real deploy scripts in the browser, against an in-tab EVM**, instead of shipping a state dump (template-commit-reveal `web/src/lib/embedded/`). It records two lessons "documented nowhere": `autoMine` must be `false` on an execution-only node, which answers `evm_mine` with `-32601`; and named accounts cannot be indexes there (no `eth_accounts`), so they are given as `privateKey:` entries. Both belong in Run deploy scripts in a browser, which this makes a real guide rather than a README excerpt.
- **Artifacts from another package** (`solidity-kit/generated/artifacts.js` in `stratagems` `contracts/deploy/000_debug/001_deploy_time.ts`) and per-network deterministic salts. Belongs in Share contracts between projects and Deterministic addresses.

Reading them also surfaced a code bug: the export wrote viem's function-valued chain fields as residue, which one project worked around by hand. It is fixed in `@rocketh/export` 0.20.4 (#217), and that project's workaround is gone.

### Package READMEs

A README is what npm shows, and it should stop being a second copy of the site. Each package README keeps: one paragraph of purpose, installation (with peers), the extension wiring snippet where it is an extension, one minimal example, and a "Documentation" link to the site page(s) that own its behaviour. It drops: behavioural explanations the site owns (the unknown-signer flow in `@rocketh/proxy` and `@rocketh/read-execute`, the `guard` section of `@rocketh/read-execute`, the fork and fee sections of `@rocketh/node`), and option tables that move to the Reference section. Relative links (`../rocketh-node`, `../../LICENSE`), which break on npm, become absolute.

Exceptions: the root `README.md` (it is also the npm README of `rocketh`, copied in `prepublishOnly`) keeps its Getting Started, because `pnpm test:getting-started` executes it and that is the only setup walkthrough under test; the site's "Get started" page should be generated from it or link to it, not be a third copy. The `hardhat-deploy` README stays a landing page, but loses its verbatim copy of the site introduction. The `@rocketh/playground` README's maintainer notes (the release flow, how the docs site consumes the build) move to `CONTRIBUTING.md` or a `docs/` file.

### The hardhat-deploy pages that exist only because the sites were separate

| Page | Disposition |
| --- | --- |
| `hardhat-deploy/index.md` (hero) | Becomes the hardhat-deploy section's entry page at the same URL; drop the second hero layout |
| `introduction`, `what-is-it-for`, `in-a-nutshell` | Merge into the site Introduction (what rocketh and hardhat-deploy are) and the section entry page; drop the v1-era feature list |
| `installation`, `how-to/setup-first-project` | Merge into Get started with hardhat-deploy (section); the deployment-import half moves to Deployment records |
| `command-and-tasks` | Becomes The `hardhat deploy` task (section); `rocketh-verify` and `rocketh-export` move to Reference: CLI |
| `environment` | Move to Reference |
| `configuration` | Merge into Reference: configuration and the named-accounts concept page |
| `how-to-deploy-contracts` | Merge into Deploy contracts and Deploy scripts |
| `how-to/` (index) | Delete; the section's sidebar is the index |
| every other `how-to/*` | Hardhat-only ones stay in the section, the rest merge into the shared page on the same topic (table below) |

### Every page

| Page | Disposition | Reason |
| --- | --- | --- |
| `index.md` | keep | home; add the two paths |
| `README.md` | keep | npm page of `rocketh`, tested Getting Started |
| `documentation/` | merge into Introduction | |
| `documentation/installation` | merge into Get started without Hardhat | |
| `documentation/core-concepts` | split | into Deploy scripts, Environments and chains, Named accounts |
| `documentation/deploying` | split | into Deploy contracts, Proxies, Diamonds |
| `documentation/examples` | merge into Deploy contracts | it repeats `deploying` |
| `documentation/hardhat-deploy` | split | plugin config to Get started with hardhat-deploy, account errors to Named accounts, fixtures to Tests with Hardhat fixtures (all but the second in the hardhat-deploy section) |
| `documentation/testing` | move to Extending rocketh | audience is extension authors |
| `documentation/fork-runs` | keep, absorb `use-fork-testing` | |
| `documentation/captured-transactions` | keep | |
| `documentation/exporting-and-verifying` | keep, absorb `verify-contracts`, `export-deployments` | |
| `documentation/unknown-signers` | keep | |
| `documentation/execute-guard` | keep | |
| `documentation/script-lifecycle` | keep | |
| `documentation/production-hardening` | keep | |
| `documentation/architecture` | move to Extending rocketh, complete it | lists 8 of 18 packages |
| `documentation/migration` | move to the hardhat-deploy section (capability map) | its readers are hardhat-deploy v1 users |
| `hardhat-deploy/index.md` | becomes the section entry page | same URL |
| `hardhat-deploy/.../introduction` | merge into Introduction | |
| `hardhat-deploy/.../what-is-it-for` | merge into Introduction | |
| `hardhat-deploy/.../in-a-nutshell` | merge into Introduction | |
| `hardhat-deploy/.../installation` | merge into Get started with hardhat-deploy (section) and Deployment records | |
| `hardhat-deploy/.../command-and-tasks` | becomes The `hardhat deploy` task (section) | verify/export parts to Reference: CLI |
| `hardhat-deploy/.../environment` | move to Reference | |
| `hardhat-deploy/.../configuration` | merge into Reference: configuration | |
| `hardhat-deploy/.../how-to-deploy-contracts` | merge into Deploy contracts | |
| `hardhat-deploy/.../how-to/` | delete | sidebar |
| `.../how-to/setup-first-project` | merge into Get started with hardhat-deploy (section) | |
| `.../how-to/migration-from-v1` | keep in the section, trim | the step-by-step guide |
| `.../how-to/configure-named-accounts` | merge into Named accounts | |
| `.../how-to/configure-network-helpers` | becomes Networks and accounts from the environment (section) | |
| `.../how-to/use-tags-and-dependencies` | merge into Deploy scripts | |
| `.../how-to/deploy-with-proxies` | merge into Proxies | |
| `.../how-to/deploy-diamond-contracts` | merge into Diamonds | |
| `.../how-to/deployment-fixtures-in-tests` | becomes Tests with Hardhat fixtures (section) | |
| `.../how-to/use-fork-testing` | split | `HARDHAT_FORK` setup to Networks and accounts (section), rehearsal to Rehearse on a fork |
| `.../how-to/use-viem-integration` | keep as Use viem | |
| `.../how-to/verify-contracts` | merge into Export, verify and document | |
| `.../how-to/export-deployments` | merge into Export, verify and document | |
| package READMEs | keep, thin | see above |

## User Stories

1. As a hardhat-deploy v1 user arriving from npm, I want one page that tells me what changed and whether my project can move, so that I do not discover a missing feature half way through a port.
2. As a hardhat-deploy v1 user, I want the step-by-step migration and the capability map to be found together and to agree, so that I do not have to reconcile two documents.
3. As a hardhat-deploy user, I want a numbered path from setup to production on the hardhat-deploy landing page, so that I know what to read next.
4. As a team whose proxies are owned by a Safe, I want one guide that takes a project from deploy to a Safe-executed upgrade and a converging re-run, so that I can run the whole flow before trusting it with production.
5. As a team whose proxies are owned by a Safe, I want that guide reachable from the hardhat-deploy pages, so that I find it where I actually land.
6. As a hardhat-deploy user rehearsing on a hardhat fork, I want the page I read to tell me that the fork reports chain 31337 and what to declare, so that my rehearsal uses the forked network's settings and tags.
7. As a rocketh user without Hardhat, I want a getting-started page that does not assume Hardhat, so that the framework-agnostic claim is something I can act on.
8. As any reader, I want each topic on exactly one page, so that what I read is the current behaviour rather than one of several versions.
9. As any reader, I want every command shown for the runner I use, so that I never translate a `rocketh` flag into a `hardhat deploy` option by guesswork.
10. As a reader looking up an option, I want a configuration reference and a CLI reference, so that I do not search five guides for one key.
11. As a reader on npm, I want a package README that says what the package is, how to install and wire it, and where its documentation lives, so that I reach the full page in one click.
12. As a user of `@rocketh/router` or `@rocketh/web`, I want a guide on the site, so that those packages are documented where the rest is.
13. As a user who needs a contract's address before deploying it, I want the deterministic-address guide on the site, so that I find `computeDeterministicAddress` without knowing it exists.
14. As a tool author reading deployment files, I want the record format documented, so that I can rely on its fields (ADR 0015).
15. As an extension author, I want writing, testing and the architecture of extensions in one section, so that project authors and extension authors each have a path that does not interleave.
16. As a maintainer, I want behaviour documented once, so that a change to it is updated in one place and stale copies cannot survive.
17. As a maintainer, I want old URLs to keep working or to fail visibly, so that links in npm READMEs, the template and issues do not silently break.
18. As a maintainer planning the SvelteKit docs template, I want the restructured content in plain Markdown with a navigation order stated explicitly, so that the switch stays mechanical.
19. As a reader following a guide to the template, I want the example branch it links to to work with the current template and rocketh, so that I am not handed a project that no longer builds.
20. As a hardhat-deploy user, I want the pages that only concern Hardhat gathered in one section, so that I can tell what is specific to my setup from what is true of rocketh in general.

### Autonomy notes

- `humanOnly`: not set. The tasks this yields (merging pages, writing guides) are agent-buildable once the open questions are answered.
- The nine questions that decided the shape are answered above. Tasking waits for rocketh.dev to move to the docs template (answer 6).

## Implementation Decisions

- Content stays plain Markdown that reads on GitHub. Existing `:::` containers and `{#id}` anchors may stay; no new VitePress-only syntax and no Vue (both because of the planned SvelteKit template and so pages read on GitHub).
- One page per topic: a merge picks the most accurate page as the base (in practice the `documentation/` page, which is newer and was written against the code) and moves in only what the other copy has that it lacks.
- The hardhat-deploy landing at `/hardhat-deploy/` survives every option, because npm, the plugin README and search engines point there.
- The root README's Getting Started remains the single tested setup walkthrough; the site page is derived from it or links to it.
- Reference pages describe the code's own definitions (`UserConfig`, `ChainUserConfig`, `ExecutionParams`, the commander and hardhat task option lists) and say which file they mirror, so drift is checkable.
- Navigation order becomes explicit data (a nav file, or `order` frontmatter), since the SvelteKit spike found autogenerated order alphabetical.

## Testing Decisions

- `pnpm docs:build` with no dead links, as today.
- An anchor check over relative links with fragments (VitePress checks pages, not anchors). The audit used a throwaway script; a task should decide whether it becomes part of `verify`.
- `pnpm test:getting-started` keeps executing the root README.
- A merge task's acceptance includes: every statement it keeps was checked against the code it describes, and the page it replaced is gone or a stub, never a second copy.

## Out of Scope

- The move to the SvelteKit docs template itself (`work/notes/ideas/docs-site-on-a-sveltekit-docs-template.md`); this spec decides the content and its order, which that move inherits.
- Editable deploy scripts in the playground (`work/specs/proposed/editable-deploy-scripts-in-the-docs.md`).
- Generated API reference from TypeDoc, beyond the decision in open question 5.
- Documentation of hardhat-deploy v1 (it lives on its own branch).
- The mechanism that keeps the template's example branches current: it belongs to the template repository and is tracked there. This spec only depends on it.
- Any source code change. Code bugs the audit found are observations (`work/notes/observations/proxy-execute-object-form-type-requires-init.md`, `work/notes/observations/docs-site-pages-prerender-without-content.md`).
- The errors the audit could settle from the code: those were fixed in place on branch `docs/audit-and-accuracy` and are not part of this restructure.

## Further Notes

- The full per-page audit (overlaps, fixes with evidence, judgement calls, gaps) is `docs/spikes/documentation-information-architecture/audit.md`.
- The pre-rendered HTML of the live site carries no page content (observation `docs-site-pages-prerender-without-content`). Whatever ships the restructure should confirm pages render server-side, or the restructure is invisible to search.

## Built (2026-10-28)

Carried out directly, without task files, after rocketh.dev moved to the docs template (#220): the content restructure, `_redirects.yaml` and the site pin in #223, the thin package READMEs in #224, the redirects-from-content feature in template-svelte-docs#5 and rocketh-website#1, and the README links in template-ethereum-contracts#23 and #24. Every one of the 40 addresses the site served before still works (10 as pages, 30 forwarding), and rocketh-website's end-to-end suite keeps checking it.

Not done here, on purpose: generated API references (decision 5), a keep-current mechanism for the template's example branches, a "common errors" page (decision 8), and documenting tests against a hardhat fork (the recipe does not work as written). Code issues found while writing are in `work/notes/observations/`.
