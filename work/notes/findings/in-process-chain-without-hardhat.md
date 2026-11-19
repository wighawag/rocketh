---
title: 'An in-process chain without Hardhat: webevm fits, EDR cannot dump state, and a webevm dump loads into forge with vm.loadAllocs'
source: 'Hands-on, 2026-11-19: webevm 0.9.1 installed in a scratch folder and driven from Node (deploy a contract with storage, probe RPC methods, dumpState), its dump converted to an alloc file and loaded by vm.loadAllocs in a real `forge test` (forge 1.7.1); webevm 0.9.1 README.md and dist/node.js read in that install. Code read in this repo at d9780451: packages/rocketh/src (environment/index.ts, executor/index.ts, utils/eth.ts), packages/rocketh-deploy/src/index.ts, packages/rocketh-playground/src/core/chain.ts. @nomicfoundation/edr 0.15.0 index.d.ts read from this repo''s installed tree (the version hardhat 3.12.0 resolves here). `npm view` on 2026-11-19 for versions, licences and dates. Foundry and Hardhat docs, the tevm README and NomicFoundation/hardhat#3599 seen through search results only (not fetched in full), marked as such below.'
---

# An in-process chain without Hardhat

Two uses: (a) running and testing deploy scripts in-process (vitest, the `rocketh` CLI) with no node on a port; (b) producing a fixture for `forge test` from a run on a fresh chain, handed to forge either by replaying the captured transactions in `setUp()` (`documentation/captured-transactions/`) or by loading the resulting state with `vm.loadAllocs`.

## The decisive result: a webevm dump loads into forge

Done by hand on 2026-11-19, in a scratch folder since deleted:

1. `createNode({chainId: 31337, miningConfig: {type: 'auto'}, initialBalances})` from webevm 0.9.1, in Node.
2. A signed raw transaction (viem) deploying a contract whose constructor stores 42 in slot 0 and whose runtime returns that slot. Receipt status `0x1`, `eth_call` returns 42.
3. `node.dumpState()` returns `{version, chainId, accounts, code, storage, blocks, receipts, transactions}`, where `accounts` maps an address to the RLP of `[nonce, balance, storageRoot, codeHash]`, `code` maps an address to its runtime code, and `storage` maps an address to `{slot: value}` with 32-byte slot keys.
4. Converted to an alloc map, `{address: {nonce, balance, code, storage}}` with nonce and balance as hex strings, by decoding each account's RLP. About ten lines of JS.
5. A forge test whose `setUp()` calls `vm.loadAllocs("allocs.json")` (with `fs_permissions` read access to the file) then checks the contract's code, `vm.load(address, 0) == 42`, and a static call returning 42: `[PASS]` under forge 1.7.1.

So hex-string nonces and balances and 32-byte padded storage keys are accepted, and the state route of (b) works with webevm today, with no replay.

What a state load does not carry: logs, receipts, block number and timestamp, and rocketh's deployment records. The fixture still has to bring the deployment NAMES and addresses separately (spec `deployments-in-solidity` generates them from the run's records).

The foundry reference (seen through search results) describes `vm.loadAllocs` as taking either a bare alloc map, as `vm.dumpState` writes it, or a full genesis file whose `alloc` it extracts. Hardhat 3 documents a `loadAllocs` cheatcode for its Solidity tests too, and `documentation/captured-transactions/` records it as supported by EDR 0.15.0, so one alloc file could serve both runners (not tested under Hardhat here).

## The EIP-1193 methods rocketh calls

From `packages/rocketh/src` and `packages/rocketh-deploy/src`:

| Method | When |
| --- | --- |
| `eth_chainId` | always |
| `eth_getBlockByNumber` `['0x0', false]` | always (genesis hash), failure tolerated |
| `eth_accounts` | always, failure tolerated unless an index-declared account must resolve |
| `eth_feeHistory` | always at run start; `eth_gasPrice` as a fallback and for legacy transactions |
| `eth_getTransactionCount`, `eth_estimateGas`, `eth_sendRawTransaction` | accounts rocketh signs for (`signerOnly`), and the raw create2-factory transaction |
| `eth_sendTransaction` | `remote` (node-held or impersonated) and `wallet` accounts |
| `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_blockNumber` | every broadcast |
| `eth_getCode`, `eth_getBalance` | deterministic deployments, funding |
| `hardhat_impersonateAccount` | when `autoImpersonate` is on, errors swallowed |
| `hardhat_setBalance` | only with `fundImpersonatedAccounts` |
| `evm_mine` | only when `autoMine` is set |

Not called: `anvil_*`, `evm_snapshot` / `evm_revert`, any state dump. Extension packages (`@rocketh/read-execute`, `@rocketh/proxy`) add at least `eth_call` and, for proxies, `eth_getStorageAt`; not enumerated here.

## Candidates

### webevm 0.9.1 (rocketh's playground engine)

- **Runs in Node and in a browser**, pure JS on `@ethereumjs/*` 10.x, with an optional `revm-wasm` engine (`webevm/revm`). The playground already hands it to rocketh as a provider (`packages/rocketh-playground/src/core/chain.ts`), with accounts declared as `privateKey:` because the node has no `eth_accounts`. MIT, last published 2026-10-27; same author as rocketh. Install is about 1.3 MB for webevm, 15 MB for its `@ethereumjs` dependencies and 1.5 MB for `revm-wasm` (measured in the scratch install). `@ethereumjs/vm` is MPL-2.0 (`npm view`).
- **Methods, probed on 0.9.1:** supported per its README's "RPC surface" table and confirmed by calls: the `eth_*` reads, `eth_estimateGas` (smallest working limit), `eth_feeHistory`, `eth_sendRawTransaction(Sync)`, receipts, `eth_getLogs`, `evm_setBalance` / `evm_setNonce` / `evm_setCode` / `evm_setStorageAt` / `evm_setAccount`, and `evm_sendRawTransactionAs` (execute as a given `from`, skipping ecrecover) when created with `senderMode: 'trusted'`. Refused with -32601, by design: `eth_accounts`, `eth_sendTransaction`, `eth_sign`, `eth_signTransaction`. Absent (-32601): `evm_mine` (there is `node.mine()`), `hardhat_setBalance`, `hardhat_impersonateAccount`, `evm_snapshot`.
- **Consequence for rocketh:** accounts rocketh signs for work as they are. Index-declared accounts, `remote` accounts and impersonation need a thin rocketh-side layer: answer `eth_accounts` with dev keys and sign their `eth_sendTransaction`, map `hardhat_setBalance` to `evm_setBalance`, `evm_mine` to `node.mine()`, and impersonation to `evm_sendRawTransactionAs` on a trusted-mode node.
- **Forking:** none.
- **State dump:** yes, `dumpState()` / `loadState()`, shape above; convertible to an alloc file and proven loadable by forge.
- **Hardfork: Cancun only.** `dist/node.js` creates its `Common` with `Hardfork.Cancun`, and the README says the revm engine refuses `prague` and `osaka` at construction (it cannot yet compute EIP-7623's calldata floor in its gas estimate). Mainnet is past Cancun, so contracts compiled for a later EVM target (for example Osaka's `CLZ` opcode) would fail to deploy on it. This is the main gap.
- **Correctness:** its README says the opt-in `computeStateRoot: true` mode runs vendored GeneralStateTests (5 cases) and a differential check against `@ethereumjs/vm`'s `runTx`; it does not run the full suite.

### EDR on its own (`@nomicfoundation/edr`)

- **Drivable without Hardhat, but not as EIP-1193 directly:** 0.15.0's `index.d.ts` exports `EdrContext.createProvider(...)` returning a `Provider` whose `handleRequest(json: string)` takes a JSON-RPC string, so a small wrapper makes it a provider. Nothing read documents this as a stable API for third parties: it follows Hardhat's needs.
- **Node only:** seven native optional dependencies (darwin x64/arm64, linux gnu/musl x64/arm64, win32 x64; `npm view`), no wasm. MIT, 0.25.1 published 2026-11-10.
- **Methods:** the Hardhat network surface, so every method rocketh calls, impersonation included. **Forking:** yes. **Hardforks:** Prague and Osaka constants in `index.d.ts`.
- **State dump: none.** No dump method in 0.15.0's `index.d.ts` (checked by fixed-string search), and a `hardhat_dumpState` request is an open Hardhat issue waiting on EDR (NomicFoundation/hardhat#3599, seen through search results). With EDR, the fixture can only be a replay. 0.25.1 was not checked.

### `@ethereumjs/vm` directly

An execution library, not a node: blocks, receipts, the RPC layer, fee history and gas estimation would all have to be written, which is what webevm already is. Tracks hardforks to Osaka per its npm pages (search results). MPL-2.0, 10.1.3 published 2026-08-21. Not a separate option so much as what webevm would need to upgrade to Prague.

### tevm

In-process, viem and EIP-1193, forking, anvil-style test methods and a state dump on paper. But `npm view tevm` shows the latest release as `1.0.0-next.149` (2026-07-30), and its README (seen through search results) describes a breaking migration to a native engine, so its API and browser support are moving. Not recommended now.

### anvil as a subprocess (baseline)

Every method, forking, snapshots, `--dump-state`, native speed, and the same EVM family forge runs. But it is a node on a port (spawn, teardown, a startup cost), Node-only, and a binary rocketh cannot install through npm (forge users have it anyway). Its dump format was not checked in this run.

## Summary

|  | In-process in Node | Browser | rocketh's methods | Fork | State for `vm.loadAllocs` | Hardfork |
| --- | --- | --- | --- | --- | --- | --- |
| webevm 0.9.1 | yes | yes | with a thin rocketh-side layer | no | yes, proven | Cancun |
| EDR | yes, native | no | all | yes | no (replay only) | Prague, Osaka |
| `@ethereumjs/vm` | to be built | yes | to be built | unverified | to be built | Osaka |
| tevm | yes | moving | likely all | yes | unverified | unverified |
| anvil | no, a port | no | all | yes | unverified | current |

## Recommendation

(a) In-process runs and tests of deploy scripts: **webevm**, behind a thin rocketh-side layer for accounts, `hardhat_setBalance`, `evm_mine` and impersonation. It is the only candidate that keeps the core browser-capable, rocketh already depends on it, and it proved the state hand-off. Its Cancun limit has to be lifted (in webevm, by moving to a later hardfork) before it is the default for users compiling for a current EVM target. EDR in `@rocketh/node` remains the option for in-process forking, at the cost of a native binary and an API Hardhat does not promise to keep. anvil stays the fallback that always works.

(b) The fixture for `forge test`: **load the state** (webevm dump converted to an alloc file, `vm.loadAllocs` in `setUp()`). It re-executes nothing per test contract and it is exact. Replay of the captured transactions stays the fallback for chains that cannot dump (EDR).

## Open questions for a human

1. Lift webevm to Prague/Osaka before rocketh uses it as the default in-process chain, or ship on Cancun with the limit documented?
2. Does the thin layer (dev accounts, impersonation through trusted sends) live in rocketh, or in webevm as an opt-in "dev node" mode?
3. Is in-process forking needed now (which only EDR offers), or are fork runs fine against anvil?
