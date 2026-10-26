---
title: 'How three hardhat-deploy v1 protocols deploy and govern upgrades (Metronome Synth, Vesper, Odyssey), and where rocketh stands on each pattern'
slug: v1-protocol-deploy-and-governance-patterns
source: 'Read from public source on 2026-10-26, by shallow clone: autonomoussoftware/metronome-synth-public @ 1852ce00751499beccf302d324687be3ad9bd27f (MIT; hardhat-deploy 1.0.4); vesperfi/vesper-contracts @ 5f23bd54f8408cdf5ed5251faa70b4888e03c5d3 (MIT; hardhat-deploy ^0.11.21; the maintained repository) and the archived vesperfi/vesper-pools @ a57e06c610d0328f7df43f6e9ae3cf2a8c1dcea5 (MIT; hardhat-deploy ^0.11.4); odyssey-finance/odyssey-contracts-public @ 3984123bf0972f0d04fcb93edf221f70110a3faa (no licence file; hardhat-deploy 1.0.4). hardhat-deploy v1 behaviour read from tag v1.0.4, commit 7530f4a. Owners measured on 2026-10-26 with `cast` against https://ethereum-rpc.publicnode.com (block 26277637) and https://optimism-rpc.publicnode.com (block 158714242); every command is quoted below. The rocketh column is read from this repo at 20b866d9, and the ported scripts that pin it are under packages/rocketh-unknown-signer/test/ported-protocols/.'
---

# How three hardhat-deploy v1 protocols deploy and govern upgrades

Three production protocols that deploy with hardhat-deploy, read from their public repositories, and every deployment and governance pattern they use checked against what rocketh (and so hardhat-deploy v2) supports today. Each protocol has one script ported to rocketh and run as a test, so the "supported" claims below are executed, not asserted:

| Protocol | Ported script | Test |
| --- | --- | --- |
| Metronome Synth | `deploy/scripts/mainnet/pool1/26_msusd_debt_token.ts` + `27_mseth_debt_token.ts`, through `deploy/helpers/index.ts` and `99_multisig_txs.ts` | `packages/rocketh-unknown-signer/test/ported-protocols/metronome-synth.integration.test.ts` |
| Vesper | `vesper-deployments/deploy/upgrade-pool.js` (and the proxy part of `deploy-vpool.js`) | `packages/rocketh-unknown-signer/test/ported-protocols/vesper.integration.test.ts` |
| Odyssey | `deploy/optimism/strategies/01_aave_v3_borrow_strategy.ts`, through `helpers/deploy-helpers.ts` and `99_safe-txs.ts`; plus a PIN of its proxy helper | `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts` |

Metronome and Vesper are MIT licensed, so their tests quote the v1 source verbatim with the licence notice. Odyssey's repository has no licence file and no `license` field in `package.json`, so nothing is copied from it: its port is written fresh from the structure, citing the files.

## The short version

1. **All three hand every privileged right to a Gnosis Safe**, and all three put an admin contract the Safe owns between the Safe and each proxy: Metronome's and Vesper's own "Upgrader" contracts (OpenZeppelin 4 `ProxyAdmin`s that check storage across an upgrade), and Odyssey's stock OpenZeppelin 5 per-proxy `ProxyAdmin`. Measured on chain below.
2. **Two of the three do not let hardhat-deploy drive their upgrades.** Vesper deploys its proxies with `deploy(..., {proxy})` but upgrades them through its own `safeUpgrade` call, and Odyssey deploys everything, proxies included, through its own create3 factory; both use hardhat-deploy for records, `read`/`execute` and (Odyssey) `catchUnknownSigner`. Metronome is the only one whose upgrades go through `deploy(..., {proxy})`, and it carries a workaround for a v1 bug with shared implementations.
3. **All three batch the Safe's calls and propose them once, at the end.** Metronome and Odyssey with the same code shape (`catchUnknownSigner` → `multisig.batch.tmp.json` → a `runAtTheEnd` script that proposes through `@safe-global/api-kit`); Vesper without `catchUnknownSigner`, by reading the owner on chain and building a MultiSend itself. This is the shape `documentation/script-lifecycle/index.md` ("The batch proposer") already documents for rocketh, and the ports run it.
4. **All three rehearse on a fork** (`hardhat node --fork ... --no-deploy` or anvil, then copying `deployments/<network>` into `deployments/localhost` by hand, then deploying to `localhost` with impersonation). rocketh's fork run (`--is-fork`, `documentation/fork-runs/index.md`) does the copy and the impersonation itself.
5. **What rocketh cannot express today**: Odyssey's OpenZeppelin 5 transparent proxy (its admin is created by the proxy), and deploying through a project-owned deterministic factory (Odyssey's `Deployer3`) with rocketh's `deterministic` option. The first is pinned by a test and staged; the second works in user land exactly as it did in v1 and is a question.

## Metronome Synth

### Who holds the rights

`helpers/address.ts` sets `GOVERNOR` equal to `GNOSIS_SAFE_ADDRESS` on every chain it lists (mainnet `:60-61`, `0xd1DE3F9CD4AE2F23DA941a67cA4C739f8dD9Af33`; optimism `:127-128` and base `:145-146` and plasma `:183-184`, `0xE01Df4ac1E1e57266900E62C37F12C986495A618`; hemi `:168-169`). `deployUpgradable` makes `GOVERNOR` the proxy `owner` everywhere but the in-process `hardhat` network (`deploy/helpers/index.ts:119`); the admin of each proxy is an Upgrader contract named per contract kind (`UpgradableContracts`, `deploy/helpers/index.ts:68-93`), deployed by `00_pre_upgraders.ts` with `args: [deployer]` and then handed to the Safe with `transferOwnership(GNOSIS_SAFE_ADDRESS)` (`deploy/scripts/mainnet/00_pre_upgraders.ts`). `tasks/update-owner-and-governor.ts` hands pool governorship and Upgrader ownership to a Safe for a new chain.

On chain (mainnet, block 26277637):

```sh
cast call 0x11eaD85C679eAF528c9C1FE094bF538Db880048A "governor()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd1DE3F9CD4AE2F23DA941a67cA4C739f8dD9Af33   (PoolRegistry's governor: the Safe)
cast storage 0x11eaD85C679eAF528c9C1FE094bF538Db880048A 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 --rpc-url https://ethereum-rpc.publicnode.com
# 0x000000000000000000000000377f0a6f7c64cb5ce5004c25892bc4127ca2b2ec   (its admin: PoolRegistryUpgraderV3, per deployments/mainnet/PoolRegistryUpgraderV3.json)
cast call 0x377F0A6f7C64CB5Ce5004C25892Bc4127cA2b2EC "owner()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd1DE3F9CD4AE2F23DA941a67cA4C739f8dD9Af33   (owned by the Safe)
cast call 0x3364f53cB866762Aef66DeEF2a6b1a17C1F17f46 "governor()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd1DE3F9CD4AE2F23DA941a67cA4C739f8dD9Af33   (Pool1's governor)
cast storage 0x3364f53cB866762Aef66DeEF2a6b1a17C1F17f46 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 --rpc-url https://ethereum-rpc.publicnode.com
# 0x...b1e1e19957c19d8a6bf90799bd7cd9e3ab2611c2   (PoolUpgraderV3, per deployments/mainnet/PoolUpgraderV3.json)
cast call 0xb1e1e19957c19d8a6bf90799bd7cd9e3ab2611c2 "owner()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd1DE3F9CD4AE2F23DA941a67cA4C739f8dD9Af33
cast call 0xd1DE3F9CD4AE2F23DA941a67cA4C739f8dD9Af33 "getThreshold()(uint256)" --rpc-url https://ethereum-rpc.publicnode.com
# 3   (and VERSION() is "1.3.0": a Gnosis Safe)
```

### The documented claims, checked against the code

`docs/deployments.md` makes five claims. Each against the code:

- **"`GNOSIS_SAFE_ADDRESS` as the prox admin and governor of all contracts" (`:28`).** True in substance, not literally: the proxy admin is an Upgrader contract and the Safe OWNS it (above). Governor: true for the pools and the registry, which is where `updateParamIfNeeded` reads it (`deploy/helpers/index.ts:246-248`).
- **Forced proposals vs a temp file batched at the end (`:30-32`).** True. `deployUpgradable` and `updateParamIfNeeded` both route a caught transaction to `executeForcedTxUsingMultiSig` when `force` is set, else to `saveForMultiSigBatchExecution` (`deploy/helpers/index.ts:145-151, 259-266`). The batch file is `multisig.batch.tmp.json`, de-duplicated, and REFUSES any `from` that is not the Safe (`deploy/helpers/safe.ts:77-87, 104-132`). The forced path proposes everything stored so far and calls `exit()` (`:135-142`). Two qualifications: the docs name the parameter `forceUpgrader` but the code calls it `force` (`deploy/helpers/index.ts:65`), and no script at this commit passes it (`grep -rn force deploy/scripts` is empty). The forced shape that IS used is in `00_pre_upgraders.ts`, which proposes the batch and calls `process.exit()` when an Upgrader replacement is pending (mainnet `:79-91`).
- **"The deployment script should be re-executed after the tx confirmation" (`:34`).** True, and printed by the code (`deploy/helpers/safe.ts:68-71`). Idempotency comes from the chain: `updateParamIfNeeded` reads the current value before writing (`deploy/helpers/index.ts:226-244`) and the proxy deploy compares implementations.
- **Rehearsal on a fork (`:36-60`, `docs/deployment-e2e-tests.md`).** True. `scripts/start-forked-node.sh` runs `npx hardhat node --fork $url --fork-block-number $block --no-deploy`; `scripts/test-next-deployment-on-fork.sh` runs the `impersonate-deployer` task, `cp -r deployments/$network deployments/localhost`, `npx hardhat deploy --network localhost`, then the E2E suite. `hardhat.config.ts` gives `localhost` `autoImpersonate: true` and the forked chain's id and script folder from `FORK_CHAIN`. On `hardhat`/`localhost` the batch is EXECUTED from the impersonated Safe instead of proposed (`deploy/helpers/safe.ts:28-36`). The manual copy is needed because v1's `node --no-deploy` returns before its own copy step (hardhat-deploy v1 `src/index.ts:780-795`).
- **`--gasprice` (`:68`).** True: the documented deploy command is `npm run deploy -- --gasprice <gas price in wei> --network <network>`, and `deploy` is plain `hardhat deploy` (`package.json`), so it is hardhat-deploy v1's run-wide fee flag (v1 `src/index.ts:646-651`).

Two smaller drifts: the docs point at a "special deployment script" `./NN_upgrader.ts` that does not exist in the repository, and `docs/deployments.md:74` verifies with `npm run verify -- --network avalanche` although avalanche is not a configured network.

### Proxies and options

Every upgradeable contract goes through `deployUpgradable` (`deploy/helpers/index.ts:104-189`): `proxyContract: 'OpenZeppelinTransparentProxy'`, `viaAdminContract: <Upgrader name>` (an existing deployment), `execute: {init: {methodName: 'initialize', args}}`, and `implementationName` set to the contract name whenever the deployment alias differs (`:120, 131`), so ONE implementation record (`DebtToken`, `DepositToken`, `SyntheticToken`, `Pool`, ...) serves every proxy of that kind. Because v1 did not reliably upgrade every proxy sharing an implementation (the comment at `:155-158` cites hardhat-deploy issue 284), the helper re-checks each proxy with `getProxyImplementation` on the Upgrader and, when stale, queues `upgrade(proxy, implementation)` from the Safe itself (`:160-187`). `catchUnknownSigner` is used in both forms, a thunk around `deploy` (`:141`) and a promise around `execute` (`:177-179`). No `upgradeIndex`, no deterministic deployment, no libraries. Scripts live in per-chain folders with a `pool1/` subfolder (`deploy/scripts/<chain>/pool1/*.ts`) selected per network by the `deploy` paths in `hardhat.config.ts`. Replacing an Upgrader is its own step: deploy the new one, transfer it to the Safe, and queue `changeProxyAdmin(proxy, newAdmin)` from the Safe on the old one (`00_pre_upgraders.ts`).

### Network settings and flags

`--gasprice` (above) and `--network`. Per-network `deploy` script folders, `gas: 6700000` / `8000000` (which does not reach hardhat-deploy's transactions: v1 fills `gasLimit` from an estimate whenever a call gives none, `src/helpers.ts:365-395`), `metadata.safeApi` for chains whose Safe service URL is not the default (via the `hardhat-network-metadata` plugin, read in `deploy/helpers/safe.ts:41`), `autoImpersonate: true` on `localhost`, the `DEPLOYER` and `DEPLOYER_PRIVATE_KEY` environment variables, `WAIT_SECONDS_BETWEEN_TXS` between transactions (`deploy/helpers/index.ts:143, 155`), and `SAFE_API_KEY` for the Safe service.

## Vesper

`vesperfi/vesper-pools` is archived (pushed 2022-06-06). The maintained repository is `vesperfi/vesper-contracts` (pushed 2025-08-13), a lerna monorepo whose `vesper-deployments/` package holds the deploy scripts. Both use hardhat-deploy 0.11.x, the pre-1.0 line with the same `deploy`/`execute`/`proxy` API, and both have the same `deploy/upgrade-pool.js` shape (a `diff` of the two differs in verification calls, a `targetChain`-keyed config path and a removed one-off V5 setup step). This note reads the maintained one.

### Who holds the rights

`vesper-commons/config/<chain>/address.js` names `MultiSig.safe` per chain (mainnet `:148`, `0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A`; optimism `:40` and base `:25`, `0x32934AD7b1121DeFC631080b58599A0eaAB89878`). The Upgraders are deployed by the deployer (`deploy/deploy-vpool.js`, `args: [Address.MultiCall]`), so the deployer owns them first; moving them to the Safe is a MANUAL step that the `verify-admin` task audits by reading each proxy's EIP-1967 admin slot and the admin's `owner()` and printing the action to take (`tasks/verify-admin.js:44-80`). The deployment folders record which owner each Upgrader belongs to (`deployments/mainnet/global/<owner address>/VPoolUpgrader.json`).

On chain (mainnet, block 26277637), the vETH pool:

```sh
cast call 0xd1C117319B3595fbc39b471AB1fd485629eb05F2 "governor()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A   (the Safe)
cast storage 0xd1C117319B3595fbc39b471AB1fd485629eb05F2 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 --rpc-url https://ethereum-rpc.publicnode.com
# 0x...e647951b8e67247643abd45b5acb80096f561624   (VPoolUpgrader, per deployments/mainnet/global/0x9520.../VPoolUpgrader.json)
cast call 0xe647951b8e67247643abd45b5acb80096f561624 "owner()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A
cast call 0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A "getThreshold()(uint256)" --rpc-url https://ethereum-rpc.publicnode.com
# 3   (VERSION() "1.3.0")
```

### Proxies, options, and the unsignable path

`deploy-vpool.js` deploys `PoolAccountant` and the pool with `proxyContract: 'OpenZeppelinTransparentProxy'` and `viaAdminContract: <Upgrader>`, the pool with `execute: {init}` and `skipIfAlreadyDeployed: true` (`:51-68`), and the rewards contract the same way. Upgrades never go through `deploy(..., {proxy})`: `upgrade-pool.js` deploys `<contract>_Implementation` as a plain contract and calls the Upgrader's own `safeUpgrade(proxy, implementation)` (`vesper-pools/contracts/upgraders/UpgraderBase.sol:17`), branching on the Upgrader's owner READ ON CHAIN (`deploy/upgrade-pool.js:68-128`): the deployer executes it; for the Safe, the call is encoded with ethers `populateTransaction` and every such call is batched into ONE MultiSend proposal posted to the Safe transaction service with a signature from the deployer's mnemonic (`deploy/gnosis-txn.js:98-132, 143-154`), at the next nonce or at `--multisig-nonce`. `deploy-strategy.js` does the same for strategy configuration (`:51-124`). `catchUnknownSigner` is never used. `deployFunction.id` is assigned INSIDE the function before `return true` (`upgrade-pool.js:150-151`, `deploy-vpool.js:102`); v1 reads `func.id` before running a script (`src/DeploymentsManager.ts:1186`), so in a fresh process that id never skips anything: it is recorded and never consulted.

### Flags, network settings, and the wrapper task

Every deployment goes through the custom task `deploy-core-contracts` (`tasks/deploy-core-contracts.js:212` onward), which takes `--pool`, `--release`, `--target-chain`, `--strategy-name`, `--multisig-nonce`, sets them on `hre`, and calls `run('deploy', deployParams)` with any hardhat-deploy flag passed as JSON (`--deploy-params '{"tags": "deploy-vPool", "gasprice": "25000000000"}'`, README). Around that call it OVERLAYS deployment folders: it copies `deployments/<network>/<pool>/`, `global/<deployer>/` and `global/` into `deployments/<network>/`, deploys, copies the results back out by file pattern, and deletes the working copy (`:145-204`), so one network folder hosts many pools. `--target-chain` picks which chain's config a `localhost` run uses. `waitConfirmations` is 0 on `localhost` and 2 elsewhere (`deploy/deploy-vpool.js:26`). `DEPLOYER` may be `ledger://<address>` (`tasks/deploy-core-contracts.js:135-136`). `npm run fork` is `hardhat node --no-deploy` over a `hardhat` network configured with `forking`; `localhost` has no `autoImpersonate`, so a Safe-owned step on a fork goes down the same propose path.

## Odyssey

A public deployment repository exists: `odyssey-finance/odyssey-contracts-public`, hardhat-deploy 1.0.4 with Foundry for tests. It has NO licence file and no `license` in `package.json`.

### Who holds the rights

`hardhat.config.ts` refuses to start without `OWNER` ("Use SAFE address or the deployer EOA for new chain") and names it `owner` next to `deployer`. `PositionRegistry` is initialised with `owner` (`deploy/optimism/00_position_registry.ts`); every proxy's OpenZeppelin 5 `ProxyAdmin` is created owned by `owner` (`helpers/deploy3.ts:69-94`, `lib/openzeppelin-contracts` 5.0.1, `TransparentUpgradeableProxy.sol:78-79`); `Deployer3`, the create3 factory, is owned by the Safe (`tasks/deployer3.ts`, `src/utils/Deployer3.sol`).

On chain:

```sh
cast call 0xeE156D8ea7b96a5524CcC3CF9283ab85E80E9534 "owner()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd44A3e93A256c445F17a12f35A0ffEf975ec6817   (PositionRegistry's owner)
cast call 0xeE156D8ea7b96a5524CcC3CF9283ab85E80E9534 "owner()(address)" --rpc-url https://optimism-rpc.publicnode.com
# 0xd44A3e93A256c445F17a12f35A0ffEf975ec6817   (same address on optimism, block 158714242)
cast storage 0xeE156D8ea7b96a5524CcC3CF9283ab85E80E9534 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 --rpc-url https://ethereum-rpc.publicnode.com
# 0x...3f6da0a118b3a0ddfdbab4690cc96b2cf73b488d   (the proxy-created ProxyAdmin, recorded as deployments/mainnet/PositionRegistry_ProxyAdmin.json)
cast call 0x3F6da0A118B3A0ddfdbaB4690cC96b2cF73B488D "owner()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd44A3e93A256c445F17a12f35A0ffEf975ec6817
cast call 0x5d016a9110767307d83C8F6ee5e068D7720d76Cf "owner()(address)" --rpc-url https://ethereum-rpc.publicnode.com
# 0xd44A3e93A256c445F17a12f35A0ffEf975ec6817   (Deployer3's owner)
cast call 0xd44A3e93A256c445F17a12f35A0ffEf975ec6817 "getThreshold()(uint256)" --rpc-url https://ethereum-rpc.publicnode.com
# 2   (VERSION() "1.4.1")
```

### Proxies, options, and the unsignable path

Odyssey uses hardhat-deploy for `deploy` of plain implementations, `read`, `execute`, `save`, `getExtendedArtifact` and `catchUnknownSigner`, and nothing else. Every contract goes through `deploy3` (`helpers/deploy3.ts`): a one-contract deploy calls `Deployer3.deploy(salt, initCode)` from the deployer with the salt `finance.odyssey.<alias>V<nonce>` from a hand-kept `Nonces` table (`helpers/deploy-config.ts:79-114`), reuses a record whose creation code is unchanged, and refuses a salt already used ("You need to Update the nonce", `helpers/deploy3.ts:151-208`). A proxied contract (`_deploy3ViaProxy`, `:40-137`) deploys its implementation with plain `deploy`, deploys an OpenZeppelin 5 `TransparentUpgradeableProxy` through `Deployer3`, saves `<alias>_Proxy`, the merged `<alias>`, and `<alias>_ProxyAdmin` READ FROM THE ADMIN SLOT; later runs compare the implementation slot and send `upgradeAndCall(proxy, implementation, '0x')` from `owner` to that ProxyAdmin, and `transferOwnership` if the admin's owner drifted. Strategies are not proxies: they are implementations a `PositionRegistry` points to, registered with `addStrategy` and moved with `updateImplementation`, both `onlyOwner` and sent from the owner READ ON CHAIN (`helpers/deploy-helpers.ts:59-119`). Every owner call goes through `executeOrStoreTxIfMultisig`: `catchUnknownSigner(thunk)` → `multisig.batch.tmp.json` (`:121-136`, `helpers/safe.ts:22-50`) → `deploy/<chain>/99_safe-txs.ts` (`runAtTheEnd`), the same propose-or-impersonate code as Metronome (`helpers/safe.ts:52-125`). On a fork with no `Deployer3`, `_getDeployer3` deploys it through CreateX from the impersonated Safe (`helpers/deploy3.ts:210-246`).

### Flags and network settings

`npx hardhat deploy --network <chain>` with no fee flag. Per-chain script folders with subfolders (`deploy/optimism/components/`, `strategies/`, `feePolicies/`, `executors/...`), selected by `getChainConfig` from the node URL. `localhost` has `autoImpersonate: true`; the rehearsal is `script/start-forked-anvil.sh` (anvil at a pinned block), then `script/test-next-deployment-on-fork.sh`: copy `deployments/<network>` to `deployments/localhost`, run the `impersonate` task (impersonates `DEPLOYER` and `OWNER` on the node and sets their balances), `hardhat deploy --network localhost`. The README's paths say `./scripts/`; the folder is `script/`. `metadata.safeApi` and `verify.etherscan.apiUrl` per network.

## Pattern by pattern, against rocketh today

Status: **supported** (same mechanism), **differently** (the need is met another way, said how), **gap**, **in progress**. "Pinned" names the test that runs it.

### Metronome Synth

| Pattern | Status | rocketh, with evidence |
| --- | --- | --- |
| Transparent proxy behind an EXISTING custom admin by name (`viaAdminContract: '<Upgrader>'`) | supported | `proxyContract: {type: 'SharedAdminOpenZeppelinTransparentProxy', proxyAdminName}` (`documentation/migration/index.md`, Proxies). Pinned: `metronome-synth.integration.test.ts`, run 1 and run 3 |
| `execute: {init}` | supported | same option. Pinned: run 1 (the proxy constructor carries `initialize`) |
| Proxy `owner` = Safe, admin owned by the Safe, upgrade deferred | supported | `catchUnknownSigner(() => deployViaProxy(...))`; matrix entry "many proxies behind one multisig-owned ProxyAdmin" (`packages/rocketh-unknown-signer/test/scenarios.integration.test.ts:759`). Pinned: run 3 |
| `implementationName` shared by many proxies | differently | no option (`documentation/migration/index.md`, "not supported"), but `deterministicImplementation: true` puts identical creation code on ONE create2 address and the second proxy records it without broadcasting (`packages/rocketh-deploy/src/index.ts:771-791`). Records are per proxy (`<name>_Implementation`). Pinned: "v1's `implementationName` sharing is kept" |
| The `usesManyProxies` re-check (v1 issue 284 workaround) | supported, not needed | rocketh decides per proxy from its EIP-1967 slot (`packages/rocketh-proxy/src/index.ts:556-563`). Pinned: run 3 surfaces one `upgrade` per proxy |
| `get(alias).implementation` after deploy | gap, tasked (not built) | `work/tasks/backlog/record-the-implementation-address-on-a-proxy-deployment.md`; its blocker `deployment-record-schema-adr` is done, and ADR 0015 already lists the field as planned |
| `catchUnknownSigner(promise)` and `catchUnknownSigner(thunk)` | differently | thunk only (`documentation/migration/index.md#catch-unknown-signer`) |
| Governor READ ON CHAIN, used as `from` | supported | `execute` takes an address; unsignable → caught. Pinned: run 1 |
| Batch file + `runAtTheEnd` proposer | differently | rocketh persists no deferral; the in-run list + `runAtTheEnd` is the documented recipe (`documentation/script-lifecycle/index.md`, "The batch proposer"). A file is still yours to write. Pinned: run 1 `proposals` |
| "Forced": propose now and `exit()` | differently | leave the call unwrapped: `onUnknownSigner` `auto` asks for the executed hash and continues the same run, or throws in CI (`documentation/unknown-signers/index.md`) |
| Re-run after the Safe executes | supported | Pinned: run 2 sends and batches nothing |
| Fork rehearsal: `node --fork --no-deploy`, copy `deployments/<net>` to `localhost`, `autoImpersonate`, Safe executed by impersonation | differently | `--is-fork` reads the simulated network's records, does not write them, impersonates NAMED accounts by default, and keeps what the Safe would send as `capturedTransactions` marked `impersonated` (`documentation/fork-runs/index.md`, `documentation/captured-transactions/index.md`). Pinned: "the fork rehearsal" (the on-chain governor is impersonated because the Safe is the named `governor`) |
| `FORK_CHAIN` to fake the chain id on `localhost` | differently | a fork run has a simulated and a connected chain (`CONTEXT.md`, fork run; ADR 0014) |
| Per-network script folders, with subfolders | supported | `environments[name].scripts`; script discovery recurses and sorts by path (`packages/rocketh-node/src/utils/fs.ts:17-47`, `packages/rocketh-node/src/executor/index.ts:436-447`) |
| Owner by network name (`network.name == 'hardhat' ? deployer : GOVERNOR`) | supported | a per-network named account (`governor: {default: 'deployer', mainnet: <Safe>}`). Pinned |
| `--gasprice` | in progress | run-wide fee flags are being implemented separately |
| `metadata.safeApi` per network | differently | per-network `data` in `rocketh/config.ts` (`ResolvedNetworkSpecificData`, `packages/rocketh-core/src/types.ts`) |
| Upgrader replacement via `changeProxyAdmin`, then a new `viaAdminContract` name | supported | a plain deferred `execute`; until it lands, `deployViaProxy` refuses to upgrade through a named admin that is not the slot's (`packages/rocketh-proxy/src/index.ts:604-611`). Pinned by the Vesper refusal test |
| `etherscan-verify`, `create-release` | differently | `rocketh-verify`; `rocketh-export` for release files (project tooling) |

### Vesper

| Pattern | Status | rocketh, with evidence |
| --- | --- | --- |
| Transparent proxy behind a named Upgrader, `execute: {init}` | supported | as above. Pinned: setup of `vesper.integration.test.ts` |
| Upgrade through the admin's own `safeUpgrade(proxy, implementation)` | supported | `upgradeFunction: {methodName: 'safeUpgrade', args: ['{proxy}', '{implementation}']}` (`documentation/migration/index.md`, Proxies; `custom-proxy-admin.integration.test.ts:117`). Pinned: all upgrade tests |
| Branch on the Upgrader owner read on chain (deployer executes, Safe gets a proposal) | differently | pass the owner read on chain as `owner` and let signability branch: broadcast when the deployer owns it, deferred when the Safe does. Pinned: "the Safe owns the Upgraders" and "the deployer still owns the Upgraders" |
| Upgrader found from the admin SLOT | differently | named, and checked against the slot. Pinned: "the Upgrader named in the script is not the proxy admin on chain: refused" |
| One MultiSend proposal for all Safe calls, at `--multisig-nonce` | differently | the deferred `{to, value, data}` list is what MultiSend encodes; proposing stays project code. Pinned: one proposal with the run's nonce |
| `skipIfAlreadyDeployed: true` on a proxy deploy | differently | does not compile on `deployViaProxy` (pinned with `@ts-expect-error`); `upgradeIndex: 0` is the same "never upgrade once deployed". Pinned |
| Custom task setting `hre.poolConfig` etc., then `run('deploy')` | differently | per-environment `data` when each pool is an environment (above); otherwise `ExecutionParams.extra` → `env.extra`, from a wrapper calling `loadAndExecuteDeploymentsFromFiles({..., extra})`; no CLI passthrough. Pinned: every Vesper test runs with `extra` |
| `--deploy-params '{"gasprice": ...}'` | in progress | run-wide fee flags |
| `--deploy-params '{"tags": ...}'` | supported | `--tags` |
| `deployFunction.id` assigned during the run | differently | an `id` is static in rocketh; v1 never consulted this one in a fresh process, so the port drops it, and must, since `return true` after a deferral would record an owed upgrade as done (`documentation/script-lifecycle/index.md`) |
| Deployment folder overlays (per pool, global, per deployer) | differently | one ENVIRONMENT per pool on the same chain: each environment name has its own deployments folder and its own `data` (resolved by environment name before chain id, `packages/rocketh/src/environment/index.ts:784-794`). What Vesper's `global/` layer shares across pools (Upgraders, reused implementations) is shared by deploying those deterministically, so each pool's environment finds the same address and records it. Not tested here (question 3) |
| `waitConfirmations` 0 on localhost, 2 elsewhere | differently | `confirmationsRequired` per chain |
| `ledger://` deployer | differently | no Ledger protocol ships, but `signerProtocols` (`packages/rocketh-core/src/types.ts:384-410`) takes one: a `ledger` protocol returning a `signerOnly` signer is written exactly like `privateKey` in `@rocketh/signer`, by the project or a package |
| Fork via `hardhat node --no-deploy` with `forking` config | differently | `--is-fork` |
| `--target-chain` on localhost | differently | `-e <network> --is-fork` selects the simulated network's config |
| `hre.run('verify')` inside scripts | differently | `rocketh-verify` after the run |

### Odyssey

| Pattern | Status | rocketh, with evidence |
| --- | --- | --- |
| Deploy through a Safe-gated create3 factory (`Deployer3` on CreateX) | differently | `deterministicDeployment` config can point rocketh at another INSTANCE of its own factory designs (address, bytecode, salt, deployment transaction: `Create2DeterministicDeploymentInfo` / `Create3DeterministicDeploymentInfo`, `packages/rocketh-core/src/types.ts:215-227`), but the calldata and the address formula are code (`salt ++ creationCode` for create2; `deployDeterministic(bytes,bytes32)` with a deployer-namespaced salt, and a factory that must itself sit at its create2 address, for create3: `packages/rocketh-deploy/src/index.ts:205-217, 305-369`). `Deployer3` has a different ABI (`deploy(string,bytes)`), CreateX's guarded-salt formula, and no create2 origin, so config cannot describe it; the v1 helper ports as-is with `read` + `execute` + `save`. Pinned: run 1 broadcasts `Deployer3.deploy(salt, initCode)` and records the address. API question below |
| Salt nonce table and "salt already used" refusal | supported (project code) | Pinned: "WITHOUT the nonce bump: refused" |
| Registry-held implementation (`addStrategy` / `updateImplementation`, `onlyOwner`), owner read on chain | supported | a plain deferred `execute`; matrix entry "a registry contract as proxy admin" (`scenarios.integration.test.ts:1777`). Pinned: run 1 and "a new strategy version" |
| `catchUnknownSigner(thunk)` → batch file → `runAtTheEnd` proposer | differently | as Metronome. Pinned |
| OpenZeppelin 5 `TransparentUpgradeableProxy` (the proxy creates its ProxyAdmin) | gap | `deployViaProxy` compares the admin slot with the owner and refuses. PIN: "deploys, but REFUSES the upgrade". A two-shape workaround works (record the created admin from the slot, then name it), pinned. Staged: `work/tasks/backlog/openzeppelin-5-transparent-proxy-kind.md` |
| Deploying the PROXY itself through `Deployer3` | gap (question below) | `deployViaProxy`'s `deterministic` reaches only rocketh's factories |
| `transferOwnership` of a drifted ProxyAdmin | supported | a deferred `execute`; `deployViaProxy` itself refuses to change an admin's owner (`packages/rocketh-proxy/src/index.ts:438-440`) |
| `owner` from `OWNER` env, required at config load | supported | a named account from `process.env` in `rocketh/config.ts` |
| Fork: anvil, copy records, `impersonate` task, `localhost.autoImpersonate` | differently | `--is-fork`; impersonation is rocketh's own and covers NAMED accounts (`documentation/fork-runs/index.md`, "Impersonation is on by default") |
| Bootstrapping `Deployer3` on a fork from the impersonated Safe | supported | a named Safe is impersonated on a fork, so the same `execute` works |
| Script subfolders | supported | as Metronome |
| `metadata.safeApi`, `verify.etherscan.apiUrl` | differently | per-network `data`; `rocketh-verify` options |

## What this contradicts or refines elsewhere (not edited here)

- **Run-wide fee flags.** `work/notes/findings/hardhat-deploy-v1-feature-surface.md` (row for `deploy --gasprice` / `--maxfee` / `--priorityfee`) records them as "dropped, DECIDED 2026-09-24", and the capability map (`documentation/migration/index.md`, Networks, the CLI) says "not supported". Both are now stale: the flags are being implemented. Metronome documents `--gasprice` on every deployment and Vesper passes `gasprice` through `--deploy-params`.
- **`autoImpersonate` in v1.** The feature-surface finding says v1 "Impersonates unknown accounts on the `hardhat` network only". The default is on for `hardhat` only, but `autoImpersonate: true` in ANY network's config turns it on, and there v1 does not call the RPC: it marks the accounts available and relies on the node already impersonating them (v1 `src/index.ts:259-269`, `src/DeploymentsManager.ts:1486-1505`). Metronome and Odyssey both use exactly that on `localhost`, impersonating through a separate task.
- **`implementationName`.** The capability map marks it "not supported" with no alternative. For its main use, one implementation behind many proxies, `deterministicImplementation: true` works when the creation code is identical (pinned above). The map should say so.
- **`skipIfAlreadyDeployed`.** The capability map (Deploy and transaction options) says "same", but `deployViaProxy` does not accept it (`packages/rocketh-proxy/src/index.ts:116-119`), so a v1 PROXY deploy carrying it fails to compile. `upgradeIndex: 0` is the equivalent.
- The `implementationName`, `skipIfAlreadyDeployed`, `extra` and in-function `id` corrections to the capability map are staged as `work/tasks/backlog/capability-map-additions-from-the-v1-protocol-study.md`.
- **The "two production teams" in `documentation/script-lifecycle/index.md` and the dropped `deferred-transaction-collector` spec.** Their file-batch shape is exactly what Metronome and Odyssey ship (identical `saveForMultiSigBatchExecution` / `saveForSafeBatchExecution` code). Nothing to correct; it is now also evidenced from public source.

## Open questions this raises (for a human)

1. **OpenZeppelin 5's transparent proxy as a BUILT-IN kind**, or only through `{type: 'custom'}` with the user's artifact? Suggested default: custom first, which is what the staged task builds. Going native afterwards is mostly packaging, because the logic is the same: add the OpenZeppelin 5 sources and a compilation unit to `packages/rocketh-proxy/scripts/generate-artifacts.ts` (today it only compiles the hardhat-deploy v1 sources), add a built-in name, and amend ADR 0003, whose premise (bytecode continuity with v1) does not cover a proxy v1 never shipped. The one real choice is which 5.x to pin and with which compiler settings.
2. **A project-owned deterministic factory behind `deterministic`.** Config already swaps the factory INSTANCE but not its DESIGN (see the Odyssey table), so a factory with another ABI or address formula (CreateX, `Deployer3`) needs code. Suggested default: no new API; document the `read` + `execute` + `save` recipe the Odyssey port runs. A pluggable "factory adapter" (address formula + calldata encoder) is the alternative if a second project asks.
3. **Many instances of one script on one network** (Vesper's per-pool folders). The issue is the RECORDS, not the scripts: every pool writes a `PoolAccountant` and a pool record under the same names, which is why Vesper shuffles folders. One rocketh environment per pool on the same chain gives each pool its own folder and its own `data`, and deterministic deploys make shared contracts resolve to one address from every environment. Suggested default: document that, and verify it with a test, before considering any overlay feature.
4. **Impersonating addresses that are not named** (a governor a script reads on chain)? Suggested default: no, keep it to named accounts as documented; naming the Safe is one line and is what makes the fork rehearsal reproducible.
5. **A CLI passthrough for `extra`.** Suggested default: no, held weakly. For: a re-run after the Safe acts must repeat the SAME parameters, and parameters in committed config (per-environment `data`) cannot drift between runs while flags typed by hand can; `extra` is also where the hardhat plugin passes its connection, so a passthrough needs a namespace. Against: environment variables are just as invocation-dependent and untyped, and a `--param key=value` flag is cheap. If teams still need ad-hoc parameters once per-environment `data` is documented, add the flag.
