---
title: 'One documentation site a reader can follow: information architecture for rocketh and hardhat-deploy'
slug: documentation-information-architecture
needsAnswers: true
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

<!-- open-questions -->
<!--
  TRANSIENT BLOCK: stripped by the apply rung on full resolution.
  While the spec has unresolved questions blocking autonomous tasking:
    1. Set `needsAnswers: true` in the frontmatter above.
    2. List the questions under the `## Open questions` heading below.
    3. Clear the flag (and let apply strip this block) once they are answered.
  Delete the whole fenced block (markers and all) if the spec launches fully resolved.
-->

## Open questions

Each of these decides the shape of the work and none can be settled from the code.

1. **One tree, or two trees that link to each other?** This spec proposes ONE tree (a single sidebar, one page per topic) with a hardhat-deploy reading path through it, and keeps `/hardhat-deploy/` only as a landing page. The alternative keeps `/hardhat-deploy/` as its own tree whose pages are thin and link into the shared one. One tree removes the duplication for good; two trees keep the hardhat-deploy brand visible in the sidebar. Which?
2. **Which runner leads in samples?** Most readers arrive through hardhat-deploy, but rocketh's own CLI is the framework-agnostic path. Options: hardhat-deploy commands first everywhere with the `rocketh` command beside them; each guide picks one and links the other; or every command shown in both forms. The existing `::: code-group` container renders both as tabs on VitePress and on the planned SvelteKit template, but it is not plain Markdown on GitHub. Is a code-group acceptable for this, or should both forms be two plain consecutive blocks?
3. **URLs and redirects.** Merging moves pages, and links to `rocketh.dev/hardhat-deploy/documentation/...` exist in READMEs on npm, in the template repository and in issues. VitePress on a static host has no redirects. Keep every old URL as a stub page that links on, configure redirects at the host, or accept the breakage and fix the links we own? This also interacts with the SvelteKit move (`work/notes/ideas/docs-site-on-a-sveltekit-docs-template.md`), which could own the redirect table.
4. **How thin should package READMEs get?** Proposed below: purpose, install, wiring, one minimal example, and a link to the site page, with no behavioural explanations duplicated. The cost is that npm readers must click through. Is that acceptable for the packages most often read on npm (`hardhat-deploy`, `@rocketh/proxy`, `@rocketh/deploy`), or should those keep a fuller self-contained README?
5. **The Safe-owned guide's source of truth.** The worked example lives on branch `examples/safe-owned-upgrade` of template-ethereum-contracts. Should the guide reproduce its files (`000_deploy_safe.ts`, `rocketh/safe.ts`, the config) inline so it reads on its own, or link to the branch and explain? Will that branch be merged into the template's `main`, kept as a long-lived example branch, or moved into this repository's `demoes/`? Its commands are pnpm scripts wrapping `hardhat` and `anvil` (`contracts:fork:node`, `contracts:fork:rehearse`); should the guide show those, or the underlying `anvil` + `rocketh -e sepolia --is-fork --write-transactions` / `hardhat deploy` commands?
6. **Reference pages: hand-written or generated?** The `Environment` page was several releases stale; a configuration reference and a CLI reference would go stale the same way. Generating them (TypeDoc JSON for types, commander's option list for CLIs) is natural on the SvelteKit template and awkward on VitePress. Hand-write now and generate later, or wait?
7. **Order of work against the SvelteKit move.** The idea note says the content work comes first and stays plain Markdown. Should this restructure land on VitePress (moving files, rewriting the hand-written sidebar), or should the new tree be built directly on the template so the sidebar ordering (`order` frontmatter or a nav file, still undecided there) is decided once?
8. **Hot Contract Replacement.** The hardhat-deploy introduction, `what-is-it-for` and the npm README advertise HCR, "via special proxy mechanism and file watch setup". v2 has no watch mode (`--watch` is a TODO in the task, and the migration map lists it as not supported); the template achieves it with an external watcher (`as-soon`). Keep the claim with a guide showing the external-watcher setup, or drop it?
9. **The v1 migration guide's troubleshooting section** quotes error messages nothing in the code produces ("namedAccounts is not supported", "from is not a valid parameter", "HardhatDeploy is not a constructor"). Rewrite each against what hardhat and rocketh actually print, or remove the section in favour of the capability map?
10. **Who is `documentation/testing` for?** It documents `@rocketh/test-utils`, whose own README says it is for extension authors and points project authors at `loadAndExecuteDeploymentsFromFiles`. Proposed: move it under "Extending rocketh". Agree?

<!-- /open-questions -->

## Problem Statement

The user-facing documentation grew one page per feature, written at different times, in two trees that were once two separate sites. A reader cannot follow it as a whole:

- The same topic is covered in up to five places that do not agree. Setup is written three times (root `README.md`, `documentation/installation/`, `hardhat-deploy/.../how-to/setup-first-project/`, plus half of `hardhat-deploy/.../installation/`). Fork rehearsal is covered by `documentation/fork-runs/` and `hardhat-deploy/.../how-to/use-fork-testing/`, and the second omits what makes a hardhat fork rehearse correctly at all (a hardhat node reports chain 31337, so without `environments.<network>.chain` the rehearsal takes the local dev node's settings and tags). There are two v1 migration documents. Proxies, diamonds, exporting and verifying, named accounts, configuration and test fixtures are each written twice or more.
- Where most hardhat-deploy v1 users land, the hardhat-deploy tree, there is no page about Safes, multisigs or unknown signers, which is the reason a production team picks rocketh over the alternatives. The pieces exist in the rocketh tree (fork runs, unknown signers, captured transactions, the execute guard), but no page takes one project from "a Safe owns my proxy" to "the upgrade is done and a re-run sends nothing".
- Pages describe behaviour that has since changed. The audit (`docs/spikes/documentation-information-architecture/audit.md`) found and fixed about fifty statements that the code contradicted, from option shapes and package names to dead links and versions a caret range can never reach. The structure makes this recur: a change to one behaviour has to be found in every copy.
- Features with no user-facing page at all: `@rocketh/router`, running scripts in a browser with `@rocketh/web`, create3 and `computeDeterministicAddress`, most of the configuration surface, the CLI options of the `hardhat deploy` task, and the deployment record format.
- The package READMEs, which is what npm shows, duplicate site content in depth (the `guard` section of `@rocketh/read-execute`, the CLI tables of `@rocketh/node`) or are the only home of a feature (router, web, verifier). They drift independently of the site.

## Solution

One site, one page per topic, organised by what the reader is trying to do, with two clearly marked paths through it: one for a hardhat-deploy user and one for a rocketh user without Hardhat. Package READMEs become short entry points that link to the site.

### Proposed information architecture

Five sections. Every topic has exactly one page; where a page serves both runners it shows both commands (see open question 2).

**1. Start**

- Introduction: what rocketh is, what hardhat-deploy v2 is, how they relate, which one to start with, and the playground. Merges `documentation/` (intro), `hardhat-deploy/.../introduction/`, `what-is-it-for/`, `in-a-nutshell/`.
- Get started with hardhat-deploy: `hardhat-deploy init`, or by hand. The single home of the setup walkthrough (from `setup-first-project/`, `hardhat-deploy/.../installation/`, the root README's Getting Started, which stays as the tested copy, see below).
- Get started without Hardhat: the `rocketh` CLI with any compiler that produces artifacts (from `documentation/installation/`).
- Coming from hardhat-deploy v1: two pages under one heading, the capability map (`documentation/migration/`) first and the step-by-step guide (`migration-from-v1/`) second, as today, but trimmed (the guide carries full v1 and v2 config dumps that the template already shows).

**2. Concepts**

- Deploy scripts, tags and dependencies (from `core-concepts`, `use-tags-and-dependencies`, `how-to-deploy-contracts`).
- Running once, and running last (`script-lifecycle`, unchanged).
- Environments and chains, including legacy chains and run-level fees (from `core-concepts`).
- Named accounts and signers (from `core-concepts`, `configure-named-accounts`, the account-error sections of `documentation/hardhat-deploy`, and the signer protocol part of the `@rocketh/signer` README).
- Deployment records: what is saved, where, the `.chain` file, importing existing deployments, reading them from other tools (from the second half of `installation`/`setup-first-project`, the record-format table in the capability map, ADR 0015).

**3. Guides**

- Deploy contracts, including libraries (`deploying`, `examples`).
- Deterministic addresses: create2, create3, `computeDeterministicAddress` (NEW, from the `@rocketh/deploy` README).
- Upgradeable contracts with proxies (`deploying#deploying-proxies`, `deploy-with-proxies`, the `@rocketh/proxy` README's behaviour sections).
- Diamonds (`deploying#deploying-diamonds`, `deploy-diamond-contracts`).
- Routers (NEW, from the `@rocketh/router` README).
- Test with your deploy scripts: Hardhat fixtures (`deployment-fixtures-in-tests`, the tests half of `documentation/hardhat-deploy`).
- Rehearse on a fork (`fork-runs` and `use-fork-testing` merged; both entry points, `--is-fork` and `HARDHAT_FORK`, with the hardhat chain-id condition stated where a hardhat user will see it).
- **A Safe-owned project, end to end (NEW, see below).**
- Unknown signers: pause, paste, defer (`unknown-signers`).
- Guard execute calls (`execute-guard`).
- Captured transactions (`captured-transactions`).
- Export, verify and document (`exporting-and-verifying`, `verify-contracts`, `export-deployments`, and the matching half of `command-and-tasks`).
- Use viem (`use-viem-integration`).
- Run deploy scripts in a browser (NEW, from the `@rocketh/web` README).
- Production hardening (`production-hardening`, unchanged).

**4. Reference**

- CLI: `rocketh`, the `hardhat deploy` task, `rocketh-verify`, `rocketh-export`, `rocketh-doc`, `hardhat-deploy init` (NEW; today only in READMEs or nowhere).
- Configuration: every key of `rocketh/config.ts` (`UserConfig`, `ChainUserConfig`, `DeploymentEnvironmentConfig`), and the Hardhat-side additions (`generateTypedArtifacts`, the network helpers from `configure-network-helpers`). Absorbs `hardhat-deploy/.../configuration/`.
- The environment API (`hardhat-deploy/.../environment/`, ideally generated, open question 6).
- Packages: one table, each row a one-line purpose and a link to its README and to its guide.

**5. Extending rocketh**

- Writing an extension (from the `@rocketh/core` README's "Writing an extension").
- Testing an extension (`documentation/testing`).
- Architecture (`architecture`, completed to all packages).

### The two reading paths

- **A hardhat-deploy user** lands on `/hardhat-deploy/` (npm, the plugin's README and search all point there). That page stays: a short landing that says what the plugin is and gives a numbered path through the shared tree: Get started with hardhat-deploy, Deploy contracts, Proxies, Test with your deploy scripts, Rehearse on a fork, A Safe-owned project, Export and verify. A v1 user gets a third entry at the top: Coming from hardhat-deploy v1.
- **A rocketh user** lands on the home page or `/documentation/`, and the Introduction gives the same numbered path starting from Get started without Hardhat.

Both paths read the same pages. A page that differs by runner says so in one place (a command shown both ways), never as a second page.

### The Safe-owned project guide (new)

The worked example is branch `examples/safe-owned-upgrade` of github.com/wighawag/template-ethereum-contracts: README section "Rehearse a Safe-owned upgrade on a fork", `contracts/deploy/000_deploy_safe.ts`, `contracts/rocketh/safe.ts`, `contracts/rocketh/config.ts`. It was run for real on Sepolia. The guide follows it in order:

1. Name the Safe before it exists: its address follows from Safe's v1.4.1 factory, singleton, owners, threshold and salt (`predictSafeAddress`), so `rocketh/config.ts` can declare `admin: {default: 1, sepolia: SEPOLIA_SAFE}`; a deploy script creates the Safe if it has no code (`000_deploy_safe.ts`) and does nothing once it exists.
2. Deploy with the Safe as the proxy owner. The deployer pays; nothing needs the Safe yet.
3. Change the implementation, so an upgrade is due, which only the Safe can send.
4. Rehearse on a fork: `anvil --fork-url`, then the run with `--is-fork` and `--write-transactions`; impersonation is on by default for a fork, `whenForked: {fundImpersonatedAccounts: true}` pays the Safe's gas, and the `impersonated` entries of the written batch are what the Safe must execute. Note `environments.sepolia.chain` for a hardhat fork.
5. Upgrade for real: the run deploys the implementation, pauses at the upgrade and prints the Safe transaction with its one-line ABI; execute it with the Safe app's Transaction Builder, paste the hash, the run checks it (a decoded `execTransaction` of exactly the requested call is accepted) and continues.
6. Run again: nothing is sent, because `deployViaProxy` reads the implementation slot. For a privileged `execute` with no built-in check, add a `guard`.

It links out to the existing guides for depth (fork runs, unknown signers, captured transactions, execute guard) rather than repeating them, and it is linked from the hardhat-deploy landing page and from the proxies guide.

### Package READMEs

A README is what npm shows, and it should stop being a second copy of the site. Each package README keeps: one paragraph of purpose, installation (with peers), the extension wiring snippet where it is an extension, one minimal example, and a "Documentation" link to the site page(s) that own its behaviour. It drops: behavioural explanations the site owns (the unknown-signer flow in `@rocketh/proxy` and `@rocketh/read-execute`, the `guard` section of `@rocketh/read-execute`, the fork and fee sections of `@rocketh/node`), and option tables that move to the Reference section. Relative links (`../rocketh-node`, `../../LICENSE`), which break on npm, become absolute.

Exceptions: the root `README.md` (it is also the npm README of `rocketh`, copied in `prepublishOnly`) keeps its Getting Started, because `pnpm test:getting-started` executes it and that is the only setup walkthrough under test; the site's "Get started" page should be generated from it or link to it, not be a third copy. The `hardhat-deploy` README stays a landing page, but loses its verbatim copy of the site introduction. The `@rocketh/playground` README's maintainer notes (the release flow, how the docs site consumes the build) move to `CONTRIBUTING.md` or a `docs/` file.

### The hardhat-deploy pages that exist only because the sites were separate

| Page | Disposition |
| --- | --- |
| `hardhat-deploy/index.md` (hero) | Keep as the hardhat-deploy landing, rewritten as the entry to the hardhat-deploy path; drop the second hero layout |
| `introduction`, `what-is-it-for`, `in-a-nutshell` | Merge into the Introduction; drop the v1-era feature list |
| `installation`, `how-to/setup-first-project` | Merge into Get started with hardhat-deploy; the deployment-import half moves to Deployment records |
| `command-and-tasks` | Delete; its content moves to Reference: CLI |
| `environment` | Move to Reference |
| `configuration` | Merge into Reference: configuration and the named-accounts concept page |
| `how-to-deploy-contracts` | Merge into Deploy contracts and Deploy scripts |
| `how-to/` (index) | Delete; the sidebar is the index |
| every other `how-to/*` | Merge into the shared guide on the same topic (table below) |

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
| `documentation/hardhat-deploy` | split | plugin config to Get started with hardhat-deploy, account errors to Named accounts, fixtures to Test |
| `documentation/testing` | move to Extending rocketh | audience is extension authors |
| `documentation/fork-runs` | keep, absorb `use-fork-testing` | |
| `documentation/captured-transactions` | keep | |
| `documentation/exporting-and-verifying` | keep, absorb `verify-contracts`, `export-deployments` | |
| `documentation/unknown-signers` | keep | |
| `documentation/execute-guard` | keep | |
| `documentation/script-lifecycle` | keep | |
| `documentation/production-hardening` | keep | |
| `documentation/architecture` | move to Extending rocketh, complete it | lists 8 of 18 packages |
| `documentation/migration` | keep (capability map) | |
| `hardhat-deploy/index.md` | keep as landing | see above |
| `hardhat-deploy/.../introduction` | merge into Introduction | |
| `hardhat-deploy/.../what-is-it-for` | merge into Introduction | |
| `hardhat-deploy/.../in-a-nutshell` | merge into Introduction | |
| `hardhat-deploy/.../installation` | merge into Get started with hardhat-deploy and Deployment records | |
| `hardhat-deploy/.../command-and-tasks` | delete, content to Reference: CLI | |
| `hardhat-deploy/.../environment` | move to Reference | |
| `hardhat-deploy/.../configuration` | merge into Reference: configuration | |
| `hardhat-deploy/.../how-to-deploy-contracts` | merge into Deploy contracts | |
| `hardhat-deploy/.../how-to/` | delete | sidebar |
| `.../how-to/setup-first-project` | merge into Get started with hardhat-deploy | |
| `.../how-to/migration-from-v1` | keep, trim | the step-by-step guide |
| `.../how-to/configure-named-accounts` | merge into Named accounts | |
| `.../how-to/configure-network-helpers` | move to Reference: configuration (Hardhat side) | |
| `.../how-to/use-tags-and-dependencies` | merge into Deploy scripts | |
| `.../how-to/deploy-with-proxies` | merge into Proxies | |
| `.../how-to/deploy-diamond-contracts` | merge into Diamonds | |
| `.../how-to/deployment-fixtures-in-tests` | merge into Test with your deploy scripts | |
| `.../how-to/use-fork-testing` | merge into Rehearse on a fork | |
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

### Autonomy notes

- `humanOnly`: not set. The tasks this yields (merging pages, writing guides) are agent-buildable once the open questions are answered.
- `needsAnswers: true`: the ten questions above decide the shape (one tree or two, runner order, URLs, README depth, the guide's source of truth, generated references, VitePress or the template first). Tasking before they are answered would cut the wrong pages.

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
- Generated API reference from TypeDoc, beyond the decision in open question 6.
- Documentation of hardhat-deploy v1 (it lives on its own branch).
- Any source code change. Code bugs the audit found are observations (`work/notes/observations/proxy-execute-object-form-type-requires-init.md`, `work/notes/observations/docs-site-pages-prerender-without-content.md`).
- The errors the audit could settle from the code: those were fixed in place on branch `docs/audit-and-accuracy` and are not part of this restructure.

## Further Notes

- The full per-page audit (overlaps, fixes with evidence, judgement calls, gaps) is `docs/spikes/documentation-information-architecture/audit.md`.
- The pre-rendered HTML of the live site carries no page content (observation `docs-site-pages-prerender-without-content`). Whatever ships the restructure should confirm pages render server-side, or the restructure is invisible to search.
