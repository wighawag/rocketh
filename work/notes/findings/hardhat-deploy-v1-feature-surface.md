---
title: 'The hardhat-deploy v1 feature surface, and where rocketh stands against each part of it'
slug: hardhat-deploy-v1-feature-surface
source: 'Read from the hardhat-deploy v1 source at tag v1.0.4, commit 7530f4a (2025-06-23), in a read-only worktree at /home/wighawag/dev/worktrees/hardhat-deploy/v1 (files opened: types.ts, src/type-extensions.ts, src/index.ts, src/helpers.ts, src/DeploymentsManager.ts, src/utils.ts, src/etherscan.ts, src/sourcify.ts), on 2026-09-24. The rocketh column is read from this repo at b1ec7468; the package-as-dependency pattern from template-ethereum-contracts branches examples/deploy-export (e309920) and examples/deploy-import (a2efddd); two account-resolution behaviours measured through createTestEnvironment on 2026-09-24.'
---

# Why this note exists

Nothing in this repo said WHICH hardhat-deploy v1 capabilities rocketh does not have. The migration documentation (`documentation/migration/index.md`, `hardhat-deploy/documentation/how-to/migration-from-v1/index.md`, `skills/hardhat-deploy-migration/SKILL.md`) teaches how to translate a script that uses the features rocketh HAS; none of the three says what a migrating team will find missing. So "close the gap on v1 features where it makes sense" could not be checked against anything, and neither could "the v1 path is stabilised".

This is the inventory. Every v1 row was established by opening the cited lines in the v1 worktree, and every rocketh row by opening the cited lines here.

## Why it is a finding and not something else

hardhat-deploy v1 is a codebase we are not and do not control, and it is the one external artifact rocketh's compatibility story is measured against: a migrating user's scripts are written against ITS API, so its behaviour is exactly the class of "external behaviour our code assumes" that `work/notes/findings/` exists for. The `source:` names the worktree, the tag and the commit, so a later reader can tell what was measured and can re-measure against a later v1.

Two things are deliberately NOT here. The rocketh column states what the code does today with citations; it does not argue for changes. And "where it makes sense" is a product decision, so the judgement column marks the rows where the answer depends on intent rather than fact, and those were put to the maintainer rather than invented here; the answers, given on 2026-09-24, are recorded in the judgement cells as DECIDED.

## How to read the tables

**Status** is about rocketh today: _present_ (the capability exists, spelling may differ), _partial_ (some of it exists, or it exists at a coarser granularity), _absent_ (nothing does this).

**Judgement** is one of four, with the reason in the cell:

- _worth closing_: a migrating script or a migrating team hits this, and nothing else answers it.
- _dropped_: a decision was taken not to have it; the cell names where that decision is recorded. Where the only record is a code comment rather than an ADR, the cell says so, because that is a weaker record than it looks.
- _superseded_: something else in rocketh answers the same need by another mechanism; the cell names it.
- _decision needed_: the fact is established, the answer depends on product intent. Every such row has since been decided; the cell says so.

---

# A. The deployments extension (the API a v1 deploy script calls)

The closed set is `DeploymentsExtension` (v1 `types.ts:210-305`), plus the HRE-level additions in `src/type-extensions.ts:113-140`. Every member is listed.

| v1 member (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `deploy(name, options)` (`types.ts:211`, `src/helpers.ts:2482-2492`) | Deploys or reuses; dispatches to the proxy path when `options.proxy` is set | present: `deploy(env)(name, args, options)` (`packages/rocketh-deploy/src/index.ts:496`), but proxying is a SEPARATE function (`deployViaProxy`, `packages/rocketh-proxy/src/index.ts:139`) | superseded: one function per concern is ADR 0005 (fine-grained modular packages); the migration cost is one import per script |
| `diamond.deploy(name, options)` (`types.ts:213-216`, `src/helpers.ts:2494-2501`) | Deploys or cuts an EIP-2535 diamond | present: `diamond(env)(...)` (`packages/rocketh-diamond/src/index.ts:41`) | present; see §D for the option-level gaps |
| `deterministic(name, options)` (`types.ts:217-226`, `src/helpers.ts:663-818`) | Returns `{address, implementationAddress?, deploy()}` WITHOUT deploying, so a script can know a create2 address before anything is on chain and feed it to another constructor | absent: the only way to learn a deterministic address is to call `deploy` with `deterministic`, which broadcasts (`packages/rocketh-deploy/src/index.ts:634-700`); no exported address-preview helper | worth closing: the "two contracts that must know each other's address" pattern has no rocketh answer today |
| `fetchIfDifferent(name, options)` (`types.ts:227-230`, `src/helpers.ts:830-906`) | Reports whether the compiled code differs from what is deployed, without deploying | absent as a public API; the same comparison lives inside `deploy` (`packages/rocketh-deploy/src/index.ts:548-584`) | dropped, DECIDED 2026-09-24 by the maintainer |
| `readDotFile` / `saveDotFile` / `deleteDotFile` (`types.ts:232-234`, `src/DeploymentsManager.ts:677-738`) | Read and write arbitrary dot-prefixed files in the deployment folder | absent (grep for `readDotFile|saveDotFile|deleteDotFile` over `packages/*/src`: 0 matches). rocketh writes its OWN dot files (`.migrations.json`, `.pending_transactions.json`, `packages/rocketh/src/environment/index.ts:1184-1204`) but exposes no user API | dropped, DECIDED 2026-09-24 by the maintainer |
| `save(name, deployment)` (`types.ts:236`, `src/DeploymentsManager.ts:760-962`) | Low-level record write | present: `env.save` (`packages/rocketh-core/src/types.ts:919`, impl `packages/rocketh/src/environment/index.ts:1049`) | present |
| `delete(name)` (`types.ts:237`, `src/DeploymentsManager.ts:740-758`) | Deletes a record and its file | absent: `Environment` carries `save` / `get` / `getOrNull` and no delete (`packages/rocketh-core/src/types.ts:919-947`) | dropped, DECIDED 2026-09-24 by the maintainer |
| `get` / `getOrNull` (`types.ts:238-239`) | Fetch a record, throwing or null | present (`packages/rocketh-core/src/types.ts:946-947`) | present |
| `getDeploymentsFromAddress(address)` (`types.ts:240`, `src/DeploymentsManager.ts:174-179`) | Every record at an address | partial: `fromAddressToNamedABI` / `fromAddressToNamedABIOrNull` return the MERGED ABI plus the names, not the records (`packages/rocketh-core/src/types.ts:948-949`) | superseded: the reason v1 callers wanted the list (one address with several records, proxy plus implementation) is served by the merged ABI |
| `all()` (`types.ts:241`) | Every record, by name | present as the `env.deployments` object (`packages/rocketh-core/src/types.ts:833`) | present |
| `getArtifact` / `getExtendedArtifact` (`types.ts:242-243`, `src/DeploymentsManager.ts:184-246`) | Look a compiled artifact up BY NAME at runtime | absent by design: artifacts are generated TypeScript modules the script imports (`packages/hardhat-deploy/src/generate-types.ts`, wired at `packages/hardhat-deploy/src/hook-handlers/solidity.ts:13-48`) | superseded: typed imports are what give rocketh its ABI types, which a name-keyed runtime lookup cannot |
| `run(tags, options)` (`types.ts:244-254`, `src/DeploymentsManager.ts:248-278`) | Runs the scripts in memory (`resetMemory` defaults true, no file writes, no log) | present: `loadAndExecuteDeploymentsFromFiles(params)` with `saveDeployments: false` (`packages/rocketh-node/src/executor/index.ts:328`) | present |
| `fixture(tags, {fallbackToGlobal, keepExistingDeployments})` (`types.ts:255-258`, `src/DeploymentsManager.ts:279-326`) | Snapshot-backed test fixture: revert to a past `evm_snapshot` for this tag set, else run the scripts and snapshot | absent in rocketh itself: no fixture or snapshot helper in `@rocketh/test-utils` (exported surface at `packages/rocketh-test-utils/src/index.ts:370-392`) | superseded: hardhat 3's `networkHelpers.loadFixture` over a `loadAndExecuteDeploymentsFromFiles` function, documented at `hardhat-deploy/documentation/how-to/deployment-fixtures-in-tests/index.md:16-80`. The TAG-scoped form (`fixture(['Token'])`) is not shown there, though it is expressible by passing `tags` |
| `createFixture(func, id)` (`types.ts:259-262`, `src/DeploymentsManager.ts:327-345`) | Memoises any function behind a snapshot | absent | superseded by `networkHelpers.loadFixture`, same citation |
| `log(...)` (`types.ts:263`, `src/DeploymentsManager.ts:346-350`) | Prints only when logging is on (off inside fixtures) | partial: `env.showMessage` always prints (`packages/rocketh-core/src/types.ts:961`); verbosity is the run-level `--log-level` (`packages/rocketh-node/src/cli-options.ts:23`) | superseded, ADR 0009 (user-facing notices stay on console) |
| `getNetworkName()` (`types.ts:265`) | The network name, fork-aliased through `HARDHAT_DEPLOY_FORK` (`src/utils.ts:545-553`) | present as `env.name` (`packages/rocketh-core/src/types.ts:806`) plus `env.network.fork` for what a fork simulates (`packages/rocketh-core/src/types.ts:830`) | superseded, ADR 0014 |
| `getGasUsed()` (`types.ts:266`, `src/DeploymentsManager.ts:1001`) | The run's total gas, readable from a script | partial: the executor computes and prints a total when `reportGasUse` is on (`packages/rocketh/src/executor/index.ts:857-880`); nothing exposes it to a script | dropped, DECIDED 2026-09-24 by the maintainer |
| `execute(name, options, methodName, ...args)` (`types.ts:268-273`, `src/helpers.ts:2630-2748`) | Contract call by deployment name | present: `execute(env)(deployment, args)` and `executeByName(env)` (`packages/rocketh-read-execute/src/index.ts:265, 368`) | present, plus a guard v1 has no equivalent of (ADR 0013) |
| `rawTx(tx)` (`types.ts:274`, `src/helpers.ts:2503-2554`) | Sends an arbitrary transaction | present: `tx(env)` (`packages/rocketh-read-execute/src/index.ts:384`) | present |
| `catchUnknownSigner(action, {log})` (`types.ts:275-285`, `src/helpers.ts:2556-2628`) | Catches `UnknownSignerError`, prints the transaction to execute out of band, returns `{from, to, value, data}` or `null` | present: `@rocketh/unknown-signer`, documented at `documentation/unknown-signers/` | present; parity is being PINNED by `work/tasks/ready/v1-parity-tests-catch-unknown-signer.md` |
| `read(...)` (`types.ts:286-289`, `src/helpers.ts:2750-2818`) | Read-only call, by name or deployment | present: `read(env)` / `readByName(env)` (`packages/rocketh-read-execute/src/read.ts:52, 159`) | present |
| `getSigner(address)` (`types.ts:290`, `src/helpers.ts:2820-2824`) | An ethers `Signer` for an address | partial: `env.namedSigners` / `env.addressSigners` expose the EIP-1193 `Signer` union (`packages/rocketh-core/src/types.ts:860, 868`); `@rocketh/viem` supplies clients (`packages/rocketh-viem/src/index.ts:49`) | superseded: rocketh is ethers-free by construction |
| `getNamedAccounts()` / `getUnnamedAccounts()` (`src/type-extensions.ts:115-120`) | Resolved accounts | present as `env.namedAccounts` / `env.unnamedAccounts` (`packages/rocketh-core/src/types.ts:858, 861`) | present |
| `getChainId()` (`src/type-extensions.ts:121`) | Chain id as a decimal string | present as `env.network.chain.id`, a number (`packages/rocketh-core/src/types.ts:824`) | present |
| `companionNetworks` (`src/type-extensions.ts:122-131`, wired `src/index.ts:344-395`) | A second network's deployments, accounts and provider, from inside one run | absent (grep for `companion` over `packages/*/src`: 0 matches) | dropped for now and tracked: `work/notes/ideas/companion-networks-access.md` says the shape is still open |

---

# B. Deploy and transaction options

v1's option types are `CallOptions` (`types.ts:179-190`), `TxOptions` (`types.ts:192-199`), `DeployOptionsBase` (`types.ts:162-169`), `DeployOptions` (`types.ts:171-173`) and `Create2DeployOptions` (`types.ts:175-177`). Every field is listed.

| v1 option (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `from` (`types.ts:193`) | Sender, resolved through `getFrom` (`src/helpers.ts:1648-1802`) | present as `account` on the construction (`packages/rocketh-core/src/types.ts:969-972`) | present |
| `args` (`types.ts:164`) | Constructor args | present and TYPED from the artifact (`packages/rocketh-core/src/types.ts:969-972`) | present, stronger than v1 |
| `contract` (`types.ts:163`) | Artifact by NAME or an inline `ArtifactData` | present only as an explicit `artifact` object (`packages/rocketh-core/src/types.ts:972`) | superseded: see `getArtifact` in §A |
| `skipIfAlreadyDeployed` (`types.ts:165`) | Skips on NAME alone, before any bytecode comparison (`src/helpers.ts:867-869`) | present with the same short-circuit (`packages/rocketh-deploy/src/index.ts:503-509`) | present |
| `linkedData` (`types.ts:166`) | Arbitrary JSON attached to the record | present (`packages/rocketh-deploy/src/index.ts:40`) | present |
| `libraries` (`types.ts:167`) | Library addresses to link | present, and linking handles both the `linkReferences` offsets and the placeholder form exactly as v1 does (`packages/rocketh-deploy/src/index.ts:84-117` against `src/helpers.ts:149-226`) | present |
| `proxy` (`types.ts:168`) | `true`, a method-name string, or a `ProxyOptions` object | superseded by `deployViaProxy` (§C) | superseded |
| `deterministicDeployment: boolean \| string` (`types.ts:172`) | create2 through the canonical factory, salt from the string | present and WIDER: `deterministic` accepts `true`, a salt, or `{type: 'create2' \| 'create3', salt}` (`packages/rocketh-deploy/src/index.ts:40-48`) | present, stronger than v1 |
| `salt` (`Create2DeployOptions`, `types.ts:176`) | Salt for the `deterministic()` preview API | the salt is supported; the preview API is not (see §A) | see `deterministic()` in §A |
| `gasLimit` (`types.ts:181`) | Explicit gas | present as viem's `gas` (`packages/rocketh-deploy/src/index.ts:623`) | present |
| `gasPrice` (`types.ts:182`) | LEGACY (pre-1559) gas price; v1 also forces a type-1 transaction for ledger and trezor (`src/helpers.ts:585-590`) | absent: every transaction rocketh builds is `type: '0x2'` (the only literals are `packages/rocketh-deploy/src/index.ts:239, 320, 619` and `packages/rocketh-read-execute/src/index.ts:317, 390`), and the deploy path's `gasPrice` line is commented out (`packages/rocketh-deploy/src/index.ts:626`) | worth closing, DECIDED 2026-09-24 (maintainer: support them): a chain with no EIP-1559 cannot be deployed to at all today. Staged as `work/tasks/backlog/support-chains-without-eip-1559.md` |
| `maxFeePerGas` / `maxPriorityFeePerGas` (`types.ts:183-184`) | EIP-1559 fees | present (`packages/rocketh-deploy/src/index.ts:611-618`) | present |
| `value` (`types.ts:185`) | Value sent | present (`packages/rocketh-deploy/src/index.ts:627-629`) | present |
| `nonce` (`types.ts:186`) | Explicit nonce, or `'pending'` / `'latest'` resolved by `setupNonce` (`src/helpers.ts:345-363`) | ACCEPTED AND DROPPED on deploy: the field is in the construction type (viem's `DeployContractParameters`, `packages/rocketh-core/src/types.ts:969-972`) and the line that would honour it is commented out (`packages/rocketh-deploy/src/index.ts:630`); `execute` DOES honour it (`packages/rocketh-read-execute/src/index.ts:334`) | worth closing: silently ignoring an option the type accepts is worse than refusing it |
| `to` / `data` (`types.ts:187-188`) | For `rawTx` | present on `tx` (`packages/rocketh-read-execute/src/index.ts:250`) | present |
| `customData` (`types.ts:189`) | Chain-specific extras, used by the zksync path | absent | see zksync in §G |
| `log` (`types.ts:194`) | Per-call printing | superseded by the run-level `--log-level` and `env.showMessage` (ADR 0009) | superseded |
| `autoMine` (`types.ts:195`) | `evm_mine` after the send, per call (`src/helpers.ts:611-615`) | present at RUN and CHAIN level only (`packages/rocketh-core/src/types.ts:246`, used at `packages/rocketh/src/environment/index.ts:1458`) | superseded at a coarser granularity; the per-call variant of the sibling switch is tracked in `work/notes/ideas/per-call-autoimpersonate.md` |
| `estimatedGasLimit` / `estimateGasExtra` (`types.ts:196-197`) | A cap and a padding around the gas estimate (`src/helpers.ts:365-397`) | absent | dropped, DECIDED 2026-09-24 by the maintainer |
| `waitConfirmations` (`types.ts:198`) | Confirmations to wait for, per call | partial: `confirmationsRequired` per chain and per run (`packages/rocketh-core/src/types.ts:247`, used at `packages/rocketh/src/environment/index.ts:1308`) | superseded at a coarser granularity |

---

# C. Proxy options

v1's `ProxyOptions` (`types.ts:107-152`) against `@rocketh/proxy`'s `ProxyDeployOptions` (`packages/rocketh-proxy/src/index.ts:56-116`).

| v1 option (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `owner` (`types.ts:108`) | Proxy admin and owner, defaulting to `from` (`src/helpers.ts:1617-1623`) | present with the same default (`packages/rocketh-proxy/src/index.ts:319`) | present |
| `upgradeIndex` (`types.ts:109`) | Replayable upgrade steps, checked against `history` and then `numDeployments` (`src/helpers.ts:985-1036`) | present, on `numDeployments` alone (`packages/rocketh-proxy/src/utils.ts:34-59`) | dropped in part, recorded: the `history` branch was removed and WHY is written at `packages/rocketh-proxy/src/utils.ts:29-32`. Note that is a code comment, not an ADR |
| `proxyContract` by built-in NAME (`types.ts:110-111`, resolved `src/helpers.ts:1140-1176`) | Closed set, read from the branch: `EIP173ProxyWithReceive`, `EIP173Proxy`, `OpenZeppelinTransparentProxy`, `OptimizedTransparentProxy`, `UUPS`. Two of them silently set `checkABIConflict: false` and `viaAdminContract: 'DefaultProxyAdmin'`; `UUPS` also sets `checkProxyAdmin: false` and a two-argument template | present with a DIFFERENT closed set (`packages/rocketh-proxy/src/index.ts:47-53`): `ERC173Proxy`, `ERC173ProxyWithReceive`, `UUPS`, `SharedAdminOpenZeppelinTransparentProxy`, `SharedAdminOptimizedTransparentProxy`, carrying the same coupled side effects (`packages/rocketh-proxy/src/index.ts:237-276`) | present but RENAMED: three of the five names changed, so every migrating script that names a proxy must be edited. `work/tasks/ready/v1-migration-guide-accounts-and-proxy-options.md` is the task that documents this |
| `proxyContract` as a user artifact NAME (`src/helpers.ts:1142-1147`) | A string is first looked up as the user's own artifact and only then falls back to the built-in set | present only as `{type: 'custom', artifact}` (`packages/rocketh-proxy/src/index.ts:95-115`) | superseded: explicit beats name-shadowing, and v1's precedence was surprising |
| `proxyArgs` (`types.ts:112`) | Constructor template with `{implementation}` / `{admin}` / `{data}` | present for a custom proxy (`packages/rocketh-proxy/src/index.ts:97`), with the same substitution (`packages/rocketh-proxy/src/utils.ts:61-95`) | present |
| `viaAdminContract` (`types.ts:113-118`) | Any admin contract by name with an optional artifact; deploys it when absent, checks `owner()`, and refuses to change the owner (`src/helpers.ts:1398-1435`) | partial: only the bundled `DefaultProxyAdmin`, only for the two shared-admin proxies, with a configurable NAME (the omission is recorded as a TODO at `packages/rocketh-proxy/src/index.ts:98`; the flow is `packages/rocketh-proxy/src/index.ts:328-372`) | worth closing, DECIDED 2026-09-24 (maintainer: keep): a custom ProxyAdmin artifact is exactly the shape a team with a registry-style admin has. Staged with `upgradeFunction` as `work/tasks/backlog/bring-your-own-proxy-admin-and-upgrade-call.md` |
| `implementationName` (`types.ts:119`) | Name of the implementation record, default `<name>_Implementation` (`src/helpers.ts:1073, 1092-1102`) | absent: the name is fixed at `<name>_Implementation` (`packages/rocketh-proxy/src/index.ts:186`) | dropped, DECIDED 2026-09-24 by the maintainer |
| `checkABIConflict` (`types.ts:120`) | Refuses when proxy and implementation share a signature (`src/utils.ts:571-632`) | present, and the default is FINER: `['supportsInterface']` is tolerated rather than the whole check being on or off (`packages/rocketh-proxy/src/index.ts:227, 280`) | present, stronger than v1 |
| `checkProxyAdmin` (`types.ts:121`) | Refuses to upgrade an ownerless proxy | present (`packages/rocketh-proxy/src/index.ts:228, 281, 520-521`) | present |
| `upgradeFunction` (`types.ts:122-125`) | Overrides the upgrade method and its argument template (`src/helpers.ts:1183-1186, 1517-1546`) | absent: the upgrade call is chosen by rocketh from `upgradeTo` / `upgradeToAndCall` / `upgrade` / `upgradeAndCall` (`packages/rocketh-proxy/src/index.ts:549-587`) | worth closing, DECIDED 2026-09-24 (maintainer: keep): a non-standard proxy with a differently named upgrade entry point cannot be driven today. Staged with `viaAdminContract`, same task |
| `methodName` (`types.ts:129-131`) | Init method, the flat form | present as `execute: '<methodName>'` (`packages/rocketh-proxy/src/index.ts:375-379`) | present, renamed |
| `execute: {methodName, args}` (`types.ts:132-138`) | The same call on deploy and on every upgrade | present (`packages/rocketh-proxy/src/index.ts:380-385`) | present |
| `execute: {init, onUpgrade}` (`types.ts:138-148`) | A different call on the first deploy and on upgrades | present, branching on the existing record (`packages/rocketh-proxy/src/index.ts:386-409`) | present |
| legacy `changeImplementation` proxies (`src/helpers.ts:1505-1511`) | Detects a pre-EIP173 proxy ABI and upgrades through `changeImplementation` | absent | dropped, DECIDED 2026-09-24 by the maintainer |
| the proxy RECORD's `implementation` field (`src/helpers.ts:1546-1573`) | The `<name>` record carries `implementation: <address>` | absent: the saved record is the proxy plus the implementation artifact and the merged ABI, with no `implementation` field (`packages/rocketh-proxy/src/index.ts:457-462, 598-603`); the address is read from the EIP-1967 slot when needed (`packages/rocketh-proxy/src/index.ts:471-475`) | worth closing: it is OBSERVED, so ADR 0012 does not forbid it, and a frontend or script that read `deployment.implementation` in v1 has nothing to read now |

---

# D. Diamond options

v1's `DiamondOptions` (`types.ts:81-105`) against `DiamondDeployOptions` (`packages/rocketh-diamond/src/types.ts:66-105`).

| v1 option (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `facets` as `string[]` or `FacetOptions[]` (`types.ts:80, 88`) | Facet artifacts by name or by object | present, objects only, with the artifact passed in (`packages/rocketh-diamond/src/types.ts:33-41, 79`) | superseded, same reason as `contract` in §B |
| `facetsArgs` (`types.ts:104`) | Default constructor args for every facet | present (`packages/rocketh-diamond/src/types.ts:103`) | present |
| `excludeSelectors` (`types.ts:100-102`) | Drops selectors from a facet before diffing and merging | present (`packages/rocketh-diamond/src/types.ts:100-102`) | present |
| `defaultCutFacet` / `defaultOwnershipFacet` (`types.ts:86-87`) | Include or omit the bundled facets | present (`packages/rocketh-diamond/src/types.ts:97-98`, honoured at `packages/rocketh-diamond/src/index.ts:98-99`) | present |
| `owner` (`types.ts:84`) | Diamond owner, compared against the on-chain owner on upgrade (`src/helpers.ts:2404-2415`) | present (`packages/rocketh-diamond/src/types.ts:80`, honoured at `packages/rocketh-diamond/src/index.ts:76`) | present |
| `execute` (`types.ts:93-99`) | One init call, carried by the constructor on deploy and by `diamondCut` on every later cut (`src/helpers.ts:2417-2427`) | present with the same semantics (`packages/rocketh-diamond/src/types.ts:82-96`, whose doc comment states the identical "it rides a change" rule) | present. The `{init, onUpgrade}` split the proxy has is NOT available here, and that is tracked at `work/notes/ideas/diamond-execute-init-on-upgrade.md` |
| `deterministicSalt` (`types.ts:103`) | create2 for the diamond itself | present (`packages/rocketh-diamond/src/types.ts:104`, honoured at `packages/rocketh-diamond/src/index.ts:430-456`) | present |
| `diamondContract` (`types.ts:82`) | Replaces the base diamond artifact | absent, deliberately: the type no longer accepts it because the deploy path ignored it (`packages/rocketh-diamond/src/types.ts:107-120`) | dropped and tracked, `work/notes/ideas/custom-diamond-base-artifact.md` |
| `diamondContractArgs` (`types.ts:83`) | Constructor template with `{owner}` / `{facetCuts}` / `{initializations}` plus the erc165 and init placeholders | present with the same three-placeholder default and the same placeholder set (`packages/rocketh-diamond/src/index.ts:332-340`) | present |
| `libraries` / `linkedData` (`types.ts:90-91`) | Defaults for every facet, overridable per facet | present (`packages/rocketh-diamond/src/index.ts:134-136`) | present |
| `upgradeIndex` (`types.ts:92`) | The same guard as the proxy | absent: `DiamondDeployOptions` (`packages/rocketh-diamond/src/types.ts`) has no such field and `@rocketh/diamond` never calls `checkUpgradeIndex` (corrected 2026-09-26; this row first said "present through the shared helper", which was wrong) | not supported, DECIDED 2026-09-26 by the maintainer |
| the legacy diamond base (`src/helpers.ts:1828-1831, 3162-3221`) | Detects a diamond deployed by an older hardhat-deploy and cuts it through a separate code path | absent | dropped, DECIDED 2026-09-24 by the maintainer |

---

# E. Named accounts

| v1 behaviour (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| index into the node's accounts (`src/utils.ts:374-378`) | `accounts[n]`; an index out of range means the name is simply ABSENT | present, and an index out of range THROWS with an actionable message (`packages/rocketh/src/environment/index.ts:586-612`) | present, stronger than v1 |
| a bare address (`src/utils.ts:357-372`) | Checksummed, must be a valid address | present (`packages/rocketh/src/environment/index.ts:613-631`) | present |
| a reference to another name (`src/utils.ts:365-367`) | Recursive lookup, no cycle detection | present (`packages/rocketh/src/environment/index.ts:646-650`) | present |
| the per-network object (`src/utils.ts:382-395, 440-465`) | Looks up the network name, then the chain id (hex or decimal), then `default`; the network key can be overridden by `HARDHAT_DEPLOY_ACCOUNTS_NETWORK` | present for the environment name, the chain id and `default` (`packages/rocketh/src/environment/index.ts:652-666`); no environment-variable override of the key | present; the override is dropped, DECIDED 2026-09-24 by the maintainer, in the spirit of ADR 0010 (environments stay explicit) |
| `null` for a network (typed at `src/type-extensions.ts:16`, behaviour `src/utils.ts:379-395`) | The name resolves to nothing and is simply absent from `namedAccounts`, so a script must handle `undefined` | ABSENT, and worse than a refusal. Measured 2026-09-24 against the built packages at b1ec7468 through `createTestEnvironment`: `{admin: {default: 1, localhost: null}}` on `localhost` crashes with a raw `TypeError: Cannot use 'in' operator to search for 'localhost' in null`, because the `null` passes the `!== undefined` check and is then treated as a per-network map (`packages/rocketh/src/environment/index.ts:652-666`). A name with no entry and no `default` gets the readable `cannot get account for ...` (`:674-687`). The v2 translation that exists today for an ADDRESS-only optional account is `data`: a missing network there resolves to `undefined` without throwing (measured the same way; `:692-712`). There is no translation for an optional account the run must SIGN as | worth closing, DECIDED 2026-09-24 (maintainer): `null` means ABSENT, as in v1. Staged as `work/tasks/backlog/null-account-entry-crashes-with-a-type-error.md` |
| `privatekey://` (`src/utils.ts:360-364`) | Derives the address and signs locally | present as `privateKey:0x...` through `signerProtocols` (`packages/rocketh-signer/src/index.ts:4-14`), plus a bare 32-byte hex shorthand (`packages/rocketh/src/environment/index.ts:615-625`) | present, renamed (`://` becomes `:`) |
| `ledger://[path:]address` and `trezor://address` (`src/utils.ts:347-359`) | Bundled hardware-wallet signing, loading the transport lazily (`src/helpers.ts:1674-1730`) | absent: the SEAM exists (`signerProtocols`, `packages/rocketh-core/src/types.ts:363-366, 389`) and no hardware protocol is implemented in the repo | dropped, DECIDED 2026-09-24 by the maintainer; the `signerProtocols` seam remains for a user who writes their own |
| `external://address` (`src/utils.ts:337-343`, used `src/helpers.ts:1735-1760`) | Marks an address as externally signed; v1 then PROMPTS for the transaction hash | superseded by the unknown-signer seam: an unsignable `from` is resolved by the `ask` policy, which prompts for the hash and verifies inclusion (`packages/rocketh/src/environment/interactiveUnknownSigner.ts`, ADR 0006, ADR 0007) | superseded, and rocketh's version is chain-verified where v1's was not |
| automatic impersonation (`src/DeploymentsManager.ts:1486-1537`) | Impersonates unknown accounts on the `hardhat` network only, disabled by `--no-impersonation` or `HARDHAT_DEPLOY_NO_IMPERSONATION` | present as `autoImpersonate` per chain and per run (`packages/rocketh-core/src/types.ts:243`, impl `packages/rocketh/src/environment/index.ts:341-371`), with no CLI flag | present; the CLI switch is absent (the whole CLI surface is `packages/rocketh-node/src/cli-options.ts:12-60`) |
| unnamed accounts (`src/utils.ts:424-431`) | Every node account not claimed by a name | present (`packages/rocketh-core/src/types.ts:861`) | present |

---

# F. Tags, dependencies, run-once, skip

| v1 behaviour (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `tags` on a script (`types.ts:33`) | Declares what a script provides | present (`packages/rocketh-core/src/types.ts:39`, set by `setupDeployScripts` at `packages/rocketh/src/executor/index.ts:90`) | present |
| `dependencies` (`types.ts:34`) | Tags that must run first, pulled in recursively (`src/DeploymentsManager.ts:1136-1180`) | present with the same tag-keyed recursion (`packages/rocketh/src/executor/index.ts:785-813`) | present |
| `runAtTheEnd` (`types.ts:35`) | Runs after everything else | present (`packages/rocketh/src/executor/index.ts:800-815`) | present |
| `id` plus `return true` (`types.ts:36`, `src/DeploymentsManager.ts:1216-1246`) | Records the id in `.migrations.json`; a recorded id skips the whole script | present and identical (`packages/rocketh/src/executor/index.ts:819-853`, `packages/rocketh/src/environment/index.ts:1005-1018`), and the rule is pinned in `CONTEXT.md` and ADR 0012 | present |
| `skip(env)` (`types.ts:32`, `src/DeploymentsManager.ts:1183-1216`) | An async predicate that skips a script before it runs | ABSENT, and the code that would do it is commented out with a `let skip = false` left behind (`packages/rocketh/src/executor/index.ts:824-835`) | worth closing as a CLEANUP: an early `return` inside the script is the equivalent, but dead code that looks like an oversight invites someone to finish it, which is what ADR 0010 says about the `newEnvironments` block deleted for the same reason |
| tag filter semantics (`src/DeploymentsManager.ts:1068-1133`) | `--tags a,b` selects scripts carrying ANY of them, unless `--tags-require-all` demands ALL | present for ANY (`packages/rocketh/src/executor/index.ts:692-707`); no all-of form anywhere on the CLI (`packages/rocketh-node/src/cli-options.ts:12-60`) | dropped, DECIDED 2026-09-24 by the maintainer |
| error wrapping (`src/DeploymentsManager.ts:1247-1253`) | Wraps a script failure as `ERROR processing <path>` with the stack | partial: the spinner fails and the error propagates unwrapped (`packages/rocketh/src/executor/index.ts:836-845`) | superseded: the raw error with its own stack is not obviously worse |

---

# G. The CLI, the tasks and the environment variables

v1 registers seven tasks (`src/index.ts:41-46, 908`): `deploy` (with the `deploy:main` and `deploy:runDeploy` subtasks), `export`, `etherscan-verify`, `sourcify`, `export-artifacts`, and overrides of `node` and `test`. rocketh's hardhat 3 plugin registers exactly ONE task, `deploy` (`packages/hardhat-deploy/src/index.ts:16-65`), and the standalone `rocketh` CLI has twelve flags (`packages/rocketh-node/src/cli-options.ts:12-60`).

| v1 surface (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `deploy --tags` (`src/index.ts:625-635`) | Tag filter | present on both CLIs (`packages/rocketh-node/src/cli-options.ts:20`, `packages/hardhat-deploy/src/index.ts:36-40`) | present |
| `deploy --reset` (`src/index.ts:507`, behaviour `src/DeploymentsManager.ts:664-667`) | Deletes the whole network folder before running | present, with a confirmation prompt (`packages/rocketh-node/src/cli-options.ts:30`, `packages/rocketh/src/executor/index.ts:736-772`) | present, stronger than v1 |
| `deploy --write` / `--silent` / `--no-compile` / `--deploy-scripts` | Write, log and script-path control | present as `--save-deployments`, `--log-level`, `--no-compile`, `--scripts` (`packages/rocketh-node/src/cli-options.ts:19-29`) | present, renamed |
| `deploy --gasprice` / `--maxfee` / `--priorityfee` (`src/index.ts:637-651`) | Run-wide fee defaults | absent from both CLIs | dropped, DECIDED 2026-09-24 by the maintainer; per-call fee options remain |
| `deploy --export` / `--export-all` (`src/index.ts:623-624`) | Export as part of the deploy run | absent: export is a separate CLI (`packages/rocketh-export/src/cli.ts`), and the plugin leaves a `// TODO? export?: string;` at `packages/hardhat-deploy/src/tasks/deploy.ts:18` | worth closing, small: the two-step is a papercut on every CI pipeline that had one step |
| `deploy --watch` / `--watch-only` (`src/index.ts:509-510`, impl `src/index.ts:525-595`) | Redeploys on any change to sources or scripts | absent (`// TODO? watch?: boolean;`, `packages/hardhat-deploy/src/tasks/deploy.ts:19`) | dropped, DECIDED 2026-09-24 by the maintainer |
| `deploy --report-gas` (`src/index.ts:511`) | Prints the run's total gas | present and ON by default, disabled by `--skip-gas-report` (`packages/rocketh-node/src/cli-options.ts:22`) | present |
| `deploy --pendingtx` (`src/index.ts:425-430`) | Opt in to recording pending transactions for recovery | present and UNCONDITIONAL whenever deployments are saved (`packages/rocketh/src/environment/index.ts:1184-1204`, recovery at `:1102`) | superseded, stronger than v1 |
| `deploy --no-impersonation` (`src/index.ts:663`) | Turns auto-impersonation off for the run | absent from the CLI; configurable per chain and per run (`packages/rocketh-core/src/types.ts:243`) | dropped, DECIDED 2026-09-24 by the maintainer |
| `node` task override (`src/index.ts:709-820`) | Starts a node, deletes the localhost deployments, COPIES the target network's deployments into `localhost`, deploys, and optionally watches | absent | dropped, DECIDED 2026-09-24 by the maintainer |
| `test` task override (`src/index.ts:606-624`) | `--deploy-fixture` runs the global fixture before the suite | absent | superseded by `networkHelpers.loadFixture`, see §A |
| `export` task (`src/index.ts:693-706`) | Writes `Export` or `MultiExport` JSON | partial, see §I | see §I |
| `export-artifacts` task (`src/index.ts:908-1091`) | Writes extended artifacts, optionally with solcInput and optionally source-stripped, for OTHER projects to consume | absent | superseded by publishing the project as a package, see the note under this table |
| `HARDHAT_DEPLOY_LOG`, `_FIXTURE`, `_EXPORT`, `_EXPORT_ALL`, `_NO_IMPERSONATION`, `_ACCOUNTS_NETWORK`, `_FORK` (`src/index.ts:437-438`, `src/DeploymentsManager.ts:346`, `src/utils.ts:545-553`) | Environment-variable equivalents of the flags | mostly absent; `HARDHAT_FORK` survives in the hardhat helper (`packages/hardhat-deploy/src/helpers.ts:41, 267`) | superseded: the flags exist, the environment-variable aliases were not carried over |
| `external.deployments` (`src/type-extensions.ts:35-37`, used `src/DeploymentsManager.ts:640-650`) | Reads another project's deployment folders as if they were yours | absent (grep for `externalDeployments` over `packages/*/src`: 0 matches) | superseded by publishing the project as a package, see the note under this table |
| `external.contracts` (`src/type-extensions.ts:38-41`) | Extra artifact folders, plus extra deploy scripts restricted to them | absent | superseded by publishing the project as a package, see the note under this table |
| `paths.imports` (`src/type-extensions.ts:83`) | An extra artifact lookup folder | absent | superseded by typed artifact imports |
| network `live` (`src/type-extensions.ts:59`) | A boolean scripts branch on, false for `hardhat` and `localhost` | absent | superseded by `env.tags`, but NOT equivalently: rocketh's default tags are `['testnet']` when the chain info says testnet and `[]` otherwise (`packages/rocketh/src/environment/chains.ts:87-95`), so a `live` equivalent must be configured by hand as a tag |
| network `tags` (`src/type-extensions.ts:61`) | Per-network tags on `network.tags` | present as `chains[id].tags` and `env.tags` (`packages/rocketh-core/src/types.ts:238`, `:812`) | present |
| network `saveDeployments` (`src/type-extensions.ts:60`) | Per-network record writing | present at run level and fork-aware (`packages/rocketh-core/src/types.ts:417`) | present |
| network `deploy` (`src/type-extensions.ts:62`) | Per-network script folders | present as `environments[name].scripts` (`packages/rocketh-core/src/types.ts:293`) | present |
| network `zksync` (`src/type-extensions.ts:66`) plus `factoryDeps` on the record (`types.ts:398`) | zkSync deployment support | absent: `chainType: 'zksync'` exists on chain info and nothing acts on it (`packages/rocketh-core/src/types.ts:165`) | dropped for now and tracked: `work/notes/ideas/zksync-support.md` says it is blocked on hardhat 3 |
| `deterministicDeployment` config (`src/type-extensions.ts:19-24`) | Per-network factory description, or a function of the network | present per chain and wider, covering create2 and create3 (`packages/rocketh-core/src/types.ts:239`) | present, stronger than v1 |

**How rocketh replaces `external.*` and `export-artifacts`: the project IS the package.** Read from the template repository `template-ethereum-contracts`, branches `examples/deploy-export` (e309920, 2025-09-05) and `examples/deploy-import` (a2efddd, 2025-09-05). The exporting project publishes itself: its `package.json` `exports` map exposes `./artifacts` (the generated typed artifacts), `./abis/*`, `./deployments/*` (the deployment records) and `./deploy/*` (its deploy scripts, compiled to `dist/deploy` with `tsc` plus `tsc-alias`). The importing project depends on it, imports its artifacts like any module, and lists the dependency's compiled scripts in its own `scripts` config (`scripts: ['node_modules/<package>/dist/deploy', 'deploy']`), so the dependency's deploy scripts run inside the importer's run. That covers all three v1 features: `external.contracts.artifacts` and `export-artifacts` by the artifacts export, `external.contracts.deploy` by the scripts entry, and `external.deployments` by the deployments export. Current rocketh still accepts a list for `scripts` (`packages/rocketh-core/src/types.ts:386`). The branches LAG current rocketh in spelling, not in idea: they configure `networks` where rocketh now has `environments` and `chains`, and call `rocketh-export -n` where the flag is now `-e`.

---

# H. The deployment record

v1's `Deployment` (`types.ts:375-398`) against rocketh's (`packages/rocketh-core/src/types.ts:550-585`). Only the fields that differ are listed.

| v1 field (v1 file:line) | What v1 stores | rocketh today | Judgement |
| --- | --- | --- | --- |
| `args` (`types.ts:383`) | The DECODED constructor arguments | `argsData`, the encoded calldata suffix (`packages/rocketh-core/src/types.ts:557`) | superseded: the encoded form is what verification needs and cannot go stale against the ABI |
| `receipt` (`types.ts:378`) | The whole receipt, including `gasUsed` and the logs | `{blockHash, blockNumber, transactionIndex}` only (`packages/rocketh-core/src/types.ts:565-569`) | dropped, and ADR 0012 is the rule it follows (a record asserts only what rocketh observed, and nothing that invites replay) |
| `transactionHash` (`types.ts:379`) | A flat field | `transaction.hash` (`packages/rocketh-core/src/types.ts:560-564`) | present, renamed |
| `history` (`types.ts:380`) | Every previous version of the record | absent | dropped, with the reason written at `packages/rocketh-proxy/src/utils.ts:29-32`: a code comment rather than an ADR |
| `numDeployments` (`types.ts:381`) | How many times the record changed | present and load-bearing for `upgradeIndex` (`packages/rocketh-core/src/types.ts:570`) | present |
| `implementation` (`types.ts:382`) | The implementation address on a proxy record | absent | worth closing, see §C |
| `solcInputHash` (`types.ts:385`) plus the `solcInputs/` folder (`src/DeploymentsManager.ts:894-931`) | Enables the `--solc-input` verification fallback | absent (no `solcInput` anywhere outside the vendored artifacts) | superseded in the common case: rocketh forces `useLiteralContent`, so the metadata carries the sources (`packages/hardhat-deploy/src/hook-handlers/config.ts:12-51`), and that is what verification submits |
| `metadata`, `bytecode`, `deployedBytecode`, `libraries`, `linkedData`, `devdoc`, `userdoc`, `storageLayout` | Present | present (`packages/rocketh-core/src/types.ts:555-585`) | present |
| `methodIdentifiers` (`types.ts:394`) | The selector map | absent, and deliberately not requested from solc (`packages/hardhat-deploy/src/hook-handlers/config.ts:46`, commented out) | dropped, DECIDED 2026-09-24 by the maintainer |
| `gasEstimates` (`types.ts:396`) | solc gas estimates | present under `evm.gasEstimates` (`packages/rocketh-core/src/types.ts:579-581`) | present |
| `facets` (`types.ts:395`) | The diamond facet snapshot | present (`packages/rocketh-diamond/src/index.ts:469, 524, 562`) | present |
| `factoryDeps` (`types.ts:397`) | zkSync factory dependencies | absent | see zksync above |
| the `.chainId` file (`src/DeploymentsManager.ts:825-828`) | Guards against writing one network's records into another network's folder | present and STRONGER: chain id plus genesis hash (`packages/rocketh-core/src/types.ts:1009`), with an opt-out auto-delete for dev chains (`packages/rocketh-core/src/types.ts:255`) | present, stronger than v1 |

---

# I. Export and verification

| v1 capability (v1 file:line) | What v1 does | rocketh today (file:line) | Judgement |
| --- | --- | --- | --- |
| `export` (`src/DeploymentsManager.ts:1322-1352`) | `{chainId, name, contracts: {name: {address, abi, linkedData}}}`, to one or more destinations, `.ts` written as a const module and `-` to stdout | present and wider: ts, js, json and two module forms, plus optional bytecode and a `startBlock` (`packages/rocketh-export/src/index.ts:446-459, 587-600`) | present, stronger than v1 |
| `exportAll` (`src/DeploymentsManager.ts:1284-1321`) | `MultiExport`: every network keyed by chain id, in ONE file | absent: `@rocketh/export` requires a single `-e <environment>` and loads that environment only (`packages/rocketh-export/src/cli.ts:32`, `packages/rocketh-export/src/index.ts:519`) | dropped until users ask, DECIDED 2026-09-24 by the maintainer |
| `etherscan-verify` (`src/index.ts:824-882`, `src/etherscan.ts`) | Submits standard-json rebuilt from the metadata, with license handling, a solcInput fallback, library injection and constructor args | present (`packages/rocketh-verifier/src/etherscan.ts`), with `--license` and `--force-license` (`packages/rocketh-verifier/src/cli.ts:25-26`); no solcInput fallback | present, minus the fallback (see §H) |
| `sourcify` (`src/index.ts:884-907`, `src/sourcify.ts`) | Submits the metadata only | present (`packages/rocketh-verifier/src/sourcify.ts`) | present |
| blockscout | not in v1 | present (`packages/rocketh-verifier/src/blockscout.ts`) | rocketh is ahead here |
| `--write-post-data` and `failing_metadata` debugging (`src/etherscan.ts:33-56`, `src/sourcify.ts:96-108`) | Dumps the request for debugging | partial: failing metadata is written (`packages/rocketh-verifier/src/sourcify.ts:95-97`), no post-data dump | superseded |

---

# What this adds up to

The maintainer triaged the absent and partial rows on 2026-09-24. Where each landed:

**Being closed (staged in `work/tasks/backlog/`).** Chains without EIP-1559; a custom ProxyAdmin artifact together with a custom upgrade function; the address preview; the proxy record's `implementation` field; the `nonce` the deploy path accepts and drops; the dead `skip()` block; `--export` on the deploy run; the raw TypeError on a `null` account entry.

**Dropped by decision (the migration docs should say "not supported").** Gas-estimate padding; per-call `waitConfirmations` / `autoMine` / `log`; `customData`; `fetchIfDifferent`; `deployments.delete`; the dot-file API; `getGasUsed()` from a script; `implementationName`; pre-EIP-173 `changeImplementation` proxies; adopting a legacy diamond base; `HARDHAT_DEPLOY_ACCOUNTS_NETWORK`; `tagsRequireAll`; script error wrapping; run-wide fee flags; `--no-impersonation`; `network.live` (document the tag to use instead); `history`, the full receipt, decoded `args`, the solcInput fallback and `methodIdentifiers` on a record; verification post-data dumps; hardware-wallet protocols; `--watch`; the `node` dev loop; multi-environment export (until users ask).

**Superseded by another mechanism.** `external.deployments`, `external.contracts` and `export-artifacts` by publishing the project as a package (the note under §G); fixtures by hardhat 3's `loadFixture`; artifacts by name by typed imports; ethers signers by `@rocketh/viem`; `external://` accounts by the unknown-signer `ask` policy; `--pendingtx` by unconditional pending-transaction recording.

**Tracked elsewhere.** The diamond base artifact, the diamond `{init, onUpgrade}` split, zkSync, companion networks, and a mnemonic signer protocol, all in `work/notes/ideas/`.

**The record schema.** The maintainer decided on 2026-09-24 that the deployment record is a PUBLISHED format: one ADR lists its fields, what each asserts, and a promise that none is removed or renamed without a major version (`work/tasks/backlog/deployment-record-schema-adr.md`). The two tasks that add fields (`record-script-tags-and-dependencies-on-deployments`, `record-the-implementation-address-on-a-proxy-deployment`) are blocked on it.

One migration hazard is worth stating on its own, because it is not a missing feature and it fails late: **three of the five built-in proxy names changed** (`EIP173Proxy` to `ERC173Proxy`, `OpenZeppelinTransparentProxy` to `SharedAdminOpenZeppelinTransparentProxy`, `OptimizedTransparentProxy` to `SharedAdminOptimizedTransparentProxy`), rocketh's set is closed, and a name outside it throws at deploy-script RUN time (`packages/rocketh-proxy/src/index.ts:275`), not at build time.

## Update 2026-09-26

- **Diamond `upgradeIndex` was misreported.** §D said it was present through the shared helper; `@rocketh/diamond` has neither the option nor a call to `checkUpgradeIndex`. The row is corrected, and the maintainer decided it is not supported. The migration map says so.
- **Two "being closed" rows have landed.** Chains without EIP-1559 (§B `gasPrice`): `gasPrice` on `deploy` / `execute` / `tx` and a per-chain `transactionType: 'legacy'` (#155). A custom ProxyAdmin artifact with a custom upgrade function (§C): `proxyAdminArtifact` and `upgradeFunction: {methodName, args}` on `deployViaProxy` (#156). The rows above still describe the code at b1ec7468; the migration map describes the current code.
