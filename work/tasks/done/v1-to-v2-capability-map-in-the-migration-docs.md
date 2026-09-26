---
title: 'Migration docs: a v1-to-v2 capability map, with one home and two pointers'
slug: v1-to-v2-capability-map-in-the-migration-docs
spec: unknown-signer-v1-migration
blockedBy: []
covers: [4, 5, 6]
---

## What to build

> **FORWARD-POINTER (added 2026-09-26, READ FIRST).** Several facts this task was written against have since changed; write the map against the CURRENT code, and treat every bullet below that contradicts this note as superseded.
>
> - **`null` accounts:** a per-network `null` now means the account is ABSENT on that network, exactly as in v1 (`packages/rocketh/src/environment/index.ts`, `getAccount`; typed possibly-`undefined` by `ResolvedNamedAccounts` in `@rocketh/core`). The bullet saying an account resolving to nothing "now THROWS where v1 left the name absent", and the `null` -> `data` idiom, are therefore WRONG for an explicit `null`. What still throws: a name with NO entry for the network and no `default`, and (new) a reference to a name that is not in `accounts` or a reference cycle, each with a readable message. The how-to (`hardhat-deploy/documentation/how-to/migration-from-v1/index.md`) and the skill's transformation rule already say this.
> - **`network.live`:** now documented in the skill (Step 3.2, rule 5, and the checklist) and in the how-to: rocketh has no built-in `live` tag, declare it per chain in `rocketh/config.ts`, and declaring `tags` replaces the default `testnet` tag. Point at that rather than re-deriving it.
> - **v1 `skip`:** documented in `documentation/migration/index.md` ("A v1 `skip` export is ignored"): ignored, not honoured, with the early-return and run-once replacements.
> - **The skill's patterns were rewritten** from executed v1/v2 pairs under `packages/hardhat-deploy/test/migration-pairs/` (the proxy-name translations, `proxyKind` removed, and `skill.test.ts` guarding the inlined copies). When this task edits the skill, do NOT edit an inlined pair by hand: change the pair file, and keep `skill.test.ts` green.
> - **Export during the deploy run** is not supported and is parked as an idea (`work/notes/ideas/export-after-deploy-and-a-rocketh-cli-package.md`); the map should say "not supported, run `rocketh-export` after the deploy" and link nothing else.
> - **Folded in from the cancelled `v1-migration-guide-accounts-and-proxy-options`** (which is why this task now carries `spec: unknown-signer-v1-migration`, stories 4, 5, 6). The map must ALSO state, plainly and where a migrating reader meets `catchUnknownSigner`:
>   1. the thunk divergence: `catchUnknownSigner(execute(...))` becomes `catchUnknownSigner(() => execute(...))`, why (the promise has already started, so there is no moment left to establish the policy), and that forgetting it is a LOUD error naming the fix;
>   2. "wrapping a call means accepting that the step did not happen": a later statement that depends on the wrapped step must be gated on chain state (the wrapper unwinds only the wrapped action, so `deployViaProxy`'s own post-upgrade `execute` is safe, but the author's next statement is not);
>   3. nothing is persisted: no unsigned-transactions file, no record change; idempotency comes from on-chain state alone, so re-running after the Safe executes is the flow.
>
>   Plus the named-account mapping (story 4) and the proxy-option mapping, v1 `{owner, execute: {methodName, args}, upgradeFunction, ...}` to `@rocketh/proxy`'s options (story 5), with before/after snippets that match `ProxyDeployOptions` in `packages/rocketh-proxy/src/index.ts`. `upgradeFunction` and a custom `viaAdminContract` artifact have no rocketh equivalent until `bring-your-own-proxy-admin-and-upgrade-call` lands; check whether it has before writing that line. The cancelled task named `documentation.md` as a target; that file no longer exists (the site is `documentation/`, with `documentation/unknown-signers/`), so the pointer from the unknown-signer docs goes there.

A user-facing CAPABILITY MAP for the hardhat-deploy v1 to rocketh move: for each v1 capability, what replaces it, or that nothing does and why. Today the three migration documents teach how to translate a script that uses the features rocketh HAS, and none of them says what a migrating team will find MISSING, which is the question that decides whether a team can move at all.

The ground truth to write it from already exists and must not be re-derived: `work/notes/findings/hardhat-deploy-v1-feature-surface.md` holds the inventory, measured against hardhat-deploy v1 at tag v1.0.4 (commit 7530f4a), with file:line on both sides. This task turns the parts a USER needs into prose they can follow, and deliberately leaves the engineering detail in the finding.

What the map must cover, because each of these fails silently or late for a migrating script:

- The built-in proxy names that CHANGED (`EIP173Proxy` to `ERC173Proxy`, `OpenZeppelinTransparentProxy` to `SharedAdminOpenZeppelinTransparentProxy`, `OptimizedTransparentProxy` to `SharedAdminOptimizedTransparentProxy`), and that the set is closed, so an unknown name throws at run time rather than at build time.
- The v1 members with no rocketh equivalent at all, each with the replacement idiom where one exists: `fixture` / `createFixture` (hardhat 3's `networkHelpers.loadFixture`), `getArtifact` (generated typed artifacts), `getSigner` (`@rocketh/viem`), `deterministic()`, `fetchIfDifferent`, the dot-file API, `companionNetworks`, `external.deployments`.
- The per-call options that became run-level or chain-level: `log`, `autoMine`, `waitConfirmations`.
- The named-account translations: `privatekey://` to `privateKey:`, the per-network map, and the fact that an account resolving to nothing now THROWS where v1 left the name absent.
- The deployment record fields a consumer may have been reading: `args`, `receipt`, `history`, `implementation`, `solcInputHash`.
- A "not supported" list, stated plainly rather than omitted: the maintainer's DROPPED list is the "Dropped by decision" paragraph at the end of the finding, and the things tracked for later are in `work/notes/ideas/`. For the replacement idioms that exist (`network.live` becomes a chain tag, `null` accounts become `data` for an address-only value), give them.
- How a project consumes another project's contracts, deployments and deploy scripts: v1's `external.*` config and `export-artifacts` are replaced by publishing the project as a package and listing its compiled scripts in `scripts`. The note under section G of the finding describes it, read from the `template-ethereum-contracts` branches `examples/deploy-export` and `examples/deploy-import`; those branches lag current rocketh in spelling (`networks` instead of `environments`/`chains`, `rocketh-export -n` instead of `-e`), so write the pattern against CURRENT rocketh, not by copying them.

ONE HOME, two pointers. The map lives in exactly one file; the other two migration documents link to it rather than paraphrasing it, because three copies that disagree is the state this task exists to end. Decide which of `documentation/migration/index.md`, `hardhat-deploy/documentation/how-to/migration-from-v1/index.md` and `skills/hardhat-deploy-migration/SKILL.md` is the home, and say why in the final report.

While in these files, fix the known link defect: the skill and the how-to link demo projects in the UPSTREAM repository rather than the copies in `demoes/` (see `work/notes/observations/migrated-demoes-are-unreferenced-and-uncovered.md`, item 1, which records the maintainer's answer that the in-repo demoes are the real ones).

## Acceptance criteria

- [ ] A capability map exists in one file, covering every bullet above, with no claim that is not traceable to the finding or to code you opened.
- [ ] The other two migration documents point at it and no longer restate it.
- [ ] The proxy-name change is stated where a reader meets proxies, not only in a table at the end.
- [ ] The demo links in the skill and the how-to point at `demoes/` in this repo.
- [ ] Every code sample in what you touch compiles against the current API (check the option names against `packages/rocketh-proxy/src/index.ts` and `packages/rocketh-deploy/src/index.ts` rather than trusting the existing prose).
- [ ] `pnpm format:check` passes.

## Blocked by

- None. It documents what is true today; it does not wait on any gap being closed.

## Prompt

> Write the user-facing v1-to-v2 capability map described above. Your source of truth is `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, which was measured against hardhat-deploy v1 at tag v1.0.4 (commit 7530f4a); it carries file:line for every claim on both sides. Read `CONTEXT.md` for the vocabulary (deployment, deploy script, named account, extension, run-once script) and use it.
>
> Verify before you copy: the finding is a snapshot, so spot-check the claims you lean on hardest (above all the closed set of proxy names in `packages/rocketh-proxy/src/index.ts`) against the code as it is now. If the code and the finding disagree, the code wins and you say so in your report.
>
> Every row in the finding carries the maintainer's decision (marked DECIDED 2026-09-24). Document what the decision says: a DROPPED row is "not supported", a row being closed by a staged task is "not supported yet" until that task lands, and never promise a date.
>
> Public repository: describe a motivation by its PATTERN, never by the team, person or organisation that reported it, and keep funding, budget and delivery framing out of every file and every commit message (AGENTS.md).
>
> FIRST, check this task against current reality: it is a launch snapshot and may have drifted. If a dependency landed differently than assumed, route it to needs-attention rather than building on the stale premise (WORK-CONTRACT.md, "Drift is a needs-attention signal").
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (above all: which file you chose as the home, and why). Do not write the done record, the commit message or the task body yourself.

## Decisions

- **Home is `documentation/migration/index.md`.**
  - Why: it's the rocketh site's "Migrating from v1" page. It sits next to `documentation/unknown-signers/`, which had to point at it, and it was short enough to host the map without burying it.
  - Why not the how-to: it's a 1,400-line step-by-step translation guide.
  - Why not the skill: it's excluded from the site and is an AI procedure. Its code blocks are locked to the migration-pair files by `skill.test.ts`.
  - Touches: every inbound link now targets `/documentation/migration/#…`.
- **The skill points at the map instead of carrying it.** The skill is fetched as a single file, so it "links" by telling the AI to fetch the map (site URL plus GitHub source) and to report unsupported features to the user. Its existing per-pattern rules stay, because they are translation steps, not the map. Alternative: inline a copy, which is the three-copies problem this task exists to end.
- **Unsupported rows are not linked to `work/` notes.** `work/**` is excluded from the site build, so those links would be dead. The map just says "not supported" / "not supported yet" with no dates. A closing section says to open an issue on the rocketh repo.
- **Two extra link fixes beyond the demo links:** the how-to's link to the skill pointed at the upstream hardhat-deploy repo and now points at this repo. The skill's "Migration from v1 Guide" URL ended in `.md`, which doesn't match how the site emits pages, and is now `/migration-from-v1/`. Same kind of defect as the demo links; small and easy to reverse.
- **Diamond `upgradeIndex` has no decided label.** No maintainer decision covers it, so the map states the fact ("not accepted by `diamond` today") instead of marking it "not supported", and the observation note asks the open question.
- **The `HARDHAT_DEPLOY_*` environment variables are marked "not supported".** The finding calls them superseded by flags, but `_ACCOUNTS_NETWORK` has no flag, and none of the variables does anything in v2.
