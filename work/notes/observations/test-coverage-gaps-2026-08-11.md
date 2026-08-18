---
title: Test coverage gaps across the monorepo after the test-env migration
slug: test-coverage-gaps-2026-08-11
needsAnswers: true
source: 'measured by `pnpm test:coverage` (vitest 4.1.10, v8 provider) @ c2a75ab, 2026-08-11'
---

# Test coverage gaps across the monorepo

Baseline, measured not assumed: **37 test files, 444 tests, all green. 65.81% statements / 57% branches / 72% functions / 65.62% lines (1579/2399 stmts).**

Now that `createTestEnvironment` is a real environment against a mock EIP-1193 provider, most of the remaining gaps are reachable with the existing harness. This note enumerates what is untested, prioritized by risk of a silent wrong deployment rather than by uncovered line count. Every claim below cites `file:line` and was checked against the source.

---

## 1. Six packages have literally zero tests

They have no `vitest.config.ts`, so the root `vitest.config.ts:9` (`projects: ['packages/*/vitest.config.ts']`) does not even see them, and they do not appear in the coverage table at all.

| package          | src lines | what it does                                                     | effort |
| ---------------- | --------- | ---------------------------------------------------------------- | ------ |
| `rocketh-signer` | 14        | `privateKey` signer protocol                                     | S      |
| `rocketh-viem`   | 94        | `viem(env)` handle: wallet/public client, `getContract`          | S/M    |
| `rocketh-router` | 164       | `deployViaRouter`: N+1 deployments, ABI merge, selector `sigMap` | M/L    |
| `rocketh-web`    | 194       | browser runtime adapter                                          | M      |
| `rocketh-export` | 231       | 5 output writers (ts/js/json/tsm/jsm)                            | M      |
| `rocketh-doc`    | 398       | `generateDocumentationData` + Handlebars output                  | M      |

Split by test strategy: `router`, `viem`, `web` are pure harness tests (no filesystem). `export` and `doc` read/write real files and need a temp directory, because `loadDeploymentsFromFiles` closes over its own `createFSDeploymentStore` (`packages/rocketh-node/src/executor/index.ts:244,253-265`) and cannot be handed the harness's Map store.

`rocketh-doc` exposes two pure seams that need no filesystem at all: `generateDocumentationData` (`packages/rocketh-doc/src/index.ts:130`) and `generate({deployments, chainId}, options)` (`:48`). That is the highest logic-per-line target in the whole set.

Each package needs a `vitest.config.ts`, a `tsconfig.test.json`, a `"test": "vitest"` script and a `vitest` devDep (an _ask first_ item per `AGENTS.md`).

> Superseded (2026-08-18), TS-config half only: `tsconfig.test.json` no longer exists. The per-package configs were renamed so the BROAD checking config owns the name `tsconfig.json` (`tsserver` resolves a file only to a config literally named that, so `test/` and `scripts/` files previously belonged to no project in the editor), and the emitting src-only config became `tsconfig.build.json`. A package's `test/` is therefore type-checked by its plain `tsconfig.json`; the rest of this paragraph still stands.

---

## 2. The executor: what runs, in what order, and what happens when one fails

`packages/rocketh/src/executor/index.ts` is at **40.3% (77/191 statements)**. The covered part is `resolveExecutionParams` (prompt, impersonation, unknown-signer precedence, all well covered). The uncovered part is everything downstream of module selection, because the only two calls to `executeDeployScriptModules` pass an empty module array (`packages/rocketh/test/prompt-capability.test.ts:202-207,224-228`).

Entirely untested:

- **`setupDeployScripts` (`:74-99`)** — the public authoring API every user deploy script calls, re-exported from `packages/rocketh/src/index.ts:2` and `packages/rocketh-node/src/index.ts:10`. Zero statements covered. Includes the prototype-preserving env copy (`:79-84`) and the `tags`/`dependencies`/`id`/`runAtTheEnd` metadata assignment (`:89-92`).
- **Tag registration and filtering (`:378-415`)** — tags as a string, the `Tag cannot contains commas` throw (`:388-389`), tag bags, the tag filter itself, untagged scripts being skipped.
- **Dependency resolution (`:491-518`)** — `recurseDependencies`: dependency ordering, diamond dependencies, a dependency naming an unknown tag being silently ignored (`:498`), `runAtTheEnd` ordering. Note `scriptsRegisteredToRun[id]` is set _after_ recursion (`:517`), so a dependency **cycle recurses infinitely**; nothing tests it and no guard exists.
- **Run loop, migrations, errors (`:525-558`)** — skip-if-migration-recorded, a throwing script, `return true` recording a migration, the `return true` without an `id` throw (`:552-555`).
- **`askBeforeProceeding` (`:435-474`)** — the reset confirmation, the gas-price confirmation, both `exit()` paths. Also worth pinning: it consults the executor's own `promptExecutor` (`:444`, `:455`), not `resolvedExecutionParams.promptExecutor` — an asymmetry with `:422-424` that looks like a bug.
- **`reportGasUse` (`:563-583`)**, **`resolveConfigAndExecuteDeployScriptModules` (`:350-360`)**.
- Branch gaps in resolution: `scripts` as a string / `[]` (`:112-118`), the `overrides` merge (`:121-127`), `getChainIdForEnvironment`'s mismatch warn and both throws (`:141-157`), the legacy `network` key and the fork form of `getEnvironmentName` (`:172-182`), and the **`saveDeployments` default with a provider** (`:244-250`: `memory`/`hardhat`/`default` → `false`, anything else → `true`) — every existing test passes it explicitly, so the rule that a named environment persists by default is unpinned.

`packages/rocketh-node/src/executor/index.ts` is at **14.7% (14/95)**. `mergeChainConfig` is the only real coverage. Untested: `readConfig` config discovery incl. the `Multiple configuration files found` throw (`:113-190`), three of four `setupEnvironmentFromFiles` entry points (`:53-57,68-73,79-80`), and all of `_executeDeployScriptsFromFiles` (`:385-428`) — script discovery, the `_`-prefix exclusion, **lexicographic ordering** (the only ordering guarantee besides dependencies), the single/double `.default` unwrap, and import-failure handling.

---

## 3. Proxy and diamond: the entire upgrade path is untested

Both existing test files say so in their own headers (`packages/rocketh-proxy/test/proxy.integration.test.ts:19-24`, `packages/rocketh-diamond/test/diamond.integration.test.ts:20-24`): every test is a fresh deployment.

**Proxy (`src/index.ts` 58%, `src/utils.ts` 30%):**

- The whole UPGRADE branch `:460-572` (~110 lines): all four upgrade call shapes (`proxyAdmin.upgradeAndCall` `:536`, `proxyAdmin.upgrade` `:543`, `proxy.upgradeToAndCall` `:550`, `proxy.upgradeTo` `:557`), the implementation-unchanged no-op (`:472`), UUPS using `existingDeployment` as target (`:525`), the forced `useUpgradeToAndCall` when the ABI has no `upgradeTo` (`:527-532`), and the ownership throws (`:498-505`).
- **`checkUpgradeIndex` (`src/utils.ts:4-54`) has zero tests** and is pure — no provider needed. That is most of `utils.ts`'s 70% miss.
- `proxyDisabled` (`:190-203`), `proxyContract: {type:'custom'}` (`:224-227`), `ERC173ProxyWithReceive` (`:236-239`, 3 of 6 predefined variants are covered), the unknown-variant throw (`:269`).
- **`execute`'s `{init, onUpgrade}` split (`:381-406`) is completely untested** — only `{methodName, args}` is exercised, and only with a `toBeDefined()` assertion. The init/onUpgrade distinction is the headline feature of `execute`.
- `checkABIConflict`, `checkProxyAdmin: false`, `proxyAdminName`, reusing an existing ProxyAdmin (`:326-345` — i.e. what "SharedAdmin" actually means), `artifact` as an `ImplementationDeployer` function, `deterministicImplementation`, `alwaysOverride`/`strictBytecodeMatch`, `linkedData`/`libraries` passthrough.

**Diamond (`src/index.ts` 70%):**

- The whole UPGRADE / `diamondCut` branch `:464-510` and everything feeding it: the loupe `facets()` read (`:83-89`), `oldSelectors` (`:221-228`), and therefore **`FacetCutAction.Replace` (`:249-256`) and `FacetCutAction.Remove` (`:268-281`) have never executed**. Only `Add` runs today. Also the `changesDetected === false` early return (`:517-536`).
- `execute: {type: 'artifact'}` (`:287-307`), `excludeSelectors` (`:158-161`), and every `diamondContractArgs` placeholder beyond the default triple: `{erc165}`, `{init}`, `{initAddress}`/`{initData}` plus their three conflict throws (`:333-335,386-390,411-413`).
- `defaultOwnershipFacet: false`, `facetsArgs`, per-facet `deterministic`, the already-deployed facet path (`:196-205`), and four naming/lookup error throws.

---

## 4. `@rocketh/deploy`: the "Library Linking" test links nothing

**Verified.** `packages/rocketh-deploy/test/deploy.integration.test.ts:296-355` is named "Library Linking" and passes `{libraries: {MathLib: ...}}`, but builds its artifact with `createMockArtifact`, whose `linkReferences` is `{}` (`packages/rocketh-test-utils/src/index.ts:235`). So `linkLibraries` (`packages/rocketh-deploy/src/index.ts:95-114`) takes the `linkReferences` branch, iterates zero times, and **substitutes no byte**. The test asserts only `toBeDefined()`. Coverage confirms `:98-109` never run.

`createMockArtifactWithLibrary` (`packages/rocketh-test-utils/src/index.ts:323-339`) does carry a real `linkReferences` map, and is **used by no test anywhere** (verified: grep finds it only in `dist/index.d.ts`). Its `bytecode` is also only 33 hex chars, shorter than the `2 + start*2 = 102` its own fixup implies, so it needs a longer placeholder bytecode before it is usable.

Also untested in `rocketh-deploy` (74.8%): raw `__$hash$__` linking and its `Can't link` throw (`:59-80`), the `requires library linking` throw (`:362-365`), both `deterministic ... not found` throws (`:144`, `:205`), the **factory-already-deployed** path (`:154`, `:214` — the default mock returns `eth_getCode: '0x'`, so every deterministic test deploys the factory first), the whole "already deterministically deployed" block (`:492-510`), the anonymous `name === ''` contract (`:337`, `:508-509`), salt normalization (`deterministic: true`, short-salt padding, `:464-471`), fee/gas hex encodings (`:441-451`), and `areLibrariesIdentical`'s negative paths (`:315-325`).

---

## 5. `@rocketh/verifier`: two of three backends have zero tests

`run()` (`packages/rocketh-verifier/src/index.ts:34-84`) dispatches over exactly three backends. Only `etherscan` is tested, at 51.6%.

- **`src/sourcify.ts` — 0%.** **`src/blockscout.ts` — 0%.** So are `src/index.ts`, `src/cli.ts`, `src/metadata.ts`.
- In `etherscan.ts`: `getLicenseType`'s whole SPDX table (`:77-121`, pure, ~40 lines), the five license-negotiation error paths (`:193-223`), the already-verified short-circuit (`:163-166`), `fixMispell` (`:324-327`), and the entire submit/poll half (`:350-436`). The poll half is blocked on a hard-coded `setTimeout(..., 10 * 1000)` at `:423` — it needs `vi.useFakeTimers()`.
- Two filesystem side effects will pollute the repo root if a test enables `logErrorOnFailure`: `etherscan_requests/` (`:39-48`) and `failing_metadata/` (`sourcify.ts:91-95`, `blockscout.ts:124-128`).

---

## 6. `rocketh/src/utils/eth.ts`: 12.5% branch coverage, no test file at all

There is no test for this module anywhere; its 61% statement coverage is incidental (the executor asks for a gas estimate before running scripts, so `prompt-capability.test.ts:58-66` mocks `eth_feeHistory`). It is a pure module — a bare `{request}` object is enough, no harness needed.

- `avg`'s reduce callback (`:5`) is **never invoked**: the only fixture has one block, so `reduce` returns the element without calling it.
- The whole `eth_feeHistory`-unsupported fallback (`:44-62`) is uncovered, including the two accepted error spellings (`:48-49`) and the rethrow of anything else (`:61-62`) — i.e. a node whose message differs slightly falls into a branch nobody has pinned.
- `formatUnits` (`:136-147`) and `formatEther` (`:165-166`) **never execute at all**.
- The 3-percentile guard (`:110-111`) never throws.

---

## 7. Smaller but load-bearing

- **`enhanceEnvIfNeeded` (`packages/rocketh-core/src/environment.ts:106-129`) is entirely uncovered.** It is what every executor entry point uses to attach extensions (`rocketh-node/src/executor/index.ts:57,73,80,88`, `rocketh-web/src/index.ts:97,104`, `hardhat-deploy/src/helpers.ts:12`). Untested: that it mutates `env` in place and returns the same reference (the property all four call sites rely on), and the **`hasOwnProperty` skip at `:120`** that stops an extension clobbering a built-in like `save` or `get`. Both sides of that branch are uncovered.
- **`@rocketh/read-execute` (87% stmt / 61% branch): `execute()` and `tx()` never return successfully.** Every `execute`/`tx` test asserts a thrown `UnknownSignerError` (`test/unknown-signer-contract.integration.test.ts:110,155,180,206,228,245,260`), so `:185` and `:398` are uncovered. All the transaction-field hex encodings (`gas`, `maxFeePerGas`, `maxPriorityFeePerGas`, `nonce`, `value`, `:155-165`) are only ever taken on the `undefined` side. Also: the test named "should not retry on other errors" (`test/read.integration.test.ts:208-232`) throws from `eth_call` itself, which never reaches the try/catch around `decodeFunctionResult` — so the rule it claims to test (`:290-293`) is unverified.
- **`@rocketh/node` FS store (20%) and `utils/fs.ts` (3.6%)** — no operation is tested. `loadDeploymentsFromStore`'s store contract is asserted only against a mock (`packages/rocketh/test/loadDeploymentsFromStore.test.ts`); nothing proves the real FS store agrees.

---

## Bugs surfaced while mapping coverage (verified, not inferred)

Each is a place where the first test would go red. They are decisions, not test cases — resolve the intent before pinning behaviour.

1. **The FS store's `listFiles` ignores its `filter` argument.** The contract is `listFiles(folder, env, filter?)` (`packages/rocketh-core/src/types.ts:827`); the implementation takes two parameters and returns `fs.readdirSync(...)` unfiltered (`packages/rocketh-node/src/environment/deployment-store.ts:52-54`). `loadDeploymentsFromStore` passes a filter that drops dotfiles and `solcInputs` (`packages/rocketh/src/environment/index.ts:167-171`), so for the FS store `.chain` counts toward the `fileNames.length > 0` gate at `:177` and for the Map store it does not.
2. **`@rocketh/doc` empties `docs/` by default.** `generateFromDeployments` does `fs.emptyDirSync(options.output || 'docs')` (`packages/rocketh-doc/src/index.ts:103,116`). A test that forgets `output` wipes the repo's top-level `docs/`. Either require an explicit output, or every test must pass a tmpdir.
3. **Blockscout's `!url` guard is dead code.** `ensureTrailingSlash(defaultEndpoints[env.chainId])` is called _before_ the `if (!url)` check (`packages/rocketh-verifier/src/blockscout.ts:62-68`), so an unknown chainId throws `TypeError: s.endsWith is not a function` instead of the intended message.
4. **Blockscout aborts the whole loop on one metadata-less deployment.** `blockscout.ts:134-137` `return`s out of the loop; etherscan (`etherscan.ts:168-171`) and sourcify (`sourcify.ts:68-71`) return from `submit()` only, i.e. they skip and continue.
5. **`diamond` mutates the caller's `options.facets` array.** `const facetsSet = options.facets` then three `facetsSet.push(...)` (`packages/rocketh-diamond/src/index.ts:92-114`). Calling `diamond` twice with the same options object accumulates duplicate default facets.
6. **The proxy's zero-owner throw is unreachable.** The owner-mismatch check fires first for `zeroAddress` (`packages/rocketh-proxy/src/index.ts:347-352`).
7. **Diamond's validated `salt` is dead after validation.** `:417-434` computes and validates a local `salt`, but the deploy at `:444` passes `options.deterministicSalt`. Equivalent today only because validation rejects everything that would differ.
8. **ERC165 asymmetry in diamond.** The interface ids are pushed only when `defaultCutFacet`/`defaultOwnershipFacet` are _truthy_ (`:340-345`), while the facets themselves are added when `undefined` too (`:93,101`). So a default diamond registers neither `0x1f931c1c` nor `0x7f5828d0` despite having both facets.

## Dead code found (delete-or-export decisions, not test targets)

- `getChainIdForExecutionParams` (`packages/rocketh/src/executor/index.ts:162-169`) — unexported, uncalled.
- `executeDeployScriptsFromFiles` (`packages/rocketh-node/src/executor/index.ts:353-373`) — uncalled; its own TODO says so.
- `lookupFile` (`packages/rocketh-node/src/utils/fs.ts:11-25`) — uncalled, not re-exported.
- `newEnvironments` (`packages/rocketh-node/src/executor/index.ts:174-184`) — computed, then not included in the returned config at `:186-188`. Bug or dead code.
- `autoMine`/`autoImpersonate` `undefined` defaults (`packages/rocketh/src/executor/index.ts:256-258,279-281`) — unreachable, because `getChainConfigFromUserConfig` always returns a boolean (`packages/rocketh/src/environment/chains.ts:109,112,124,127`). **Do not chase this coverage.**

---

## Suggested order

1. **Pure units, no harness, no filesystem** — `rocketh/src/utils/eth.ts`, `rocketh-proxy/src/utils.ts` (`checkUpgradeIndex`), `rocketh-doc`'s `generateDocumentationData`, `rocketh-verifier`'s `getLicenseType`, `rocketh-core`'s `enhanceEnvIfNeeded`, `@rocketh/signer`. Highest coverage per hour, zero new infrastructure.
2. **Executor semantics** — `setupDeployScripts` + tag selection + dependency ordering + migrations. Biggest uncovered block, needs no filesystem (modules are plain objects), and it is where a regression silently deploys the wrong thing.
3. **Proxy and diamond upgrade paths** — the working recipe already exists verbatim in `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts:87-166` (slot-backed `eth_getStorageAt`, a shared `deploymentStore` across two envs, two artifacts whose deployed bytecode differs ahead of the CBOR metadata). Diamond additionally needs a calldata-dispatching `eth_call` responder for `facets()`/`owner()`.
4. **Real library linking** in `rocketh-deploy` (and fix `createMockArtifactWithLibrary`'s too-short bytecode first).
5. **Verifier sourcify + blockscout**, which pins bugs 3 and 4 above.
6. **Zero-test packages** needing new wiring: `viem`, `router`, `export`, `doc` (FS half), `web`.

## Caveat on existing tests

Many current proxy/diamond tests assert only `toBeDefined()` (proxy tests 2, 3, 4; diamond tests 2, 3, 5, 6, 7). They execute lines, so they **inflate the coverage number without pinning behaviour**. Strengthening them (assert the encoded `{data}` constructor arg; assert the facet list after `defaultCutFacet: false`) is cheaper and higher value per line than new happy-path cases. The reported 65.81% is therefore an optimistic ceiling on real behavioural coverage.
