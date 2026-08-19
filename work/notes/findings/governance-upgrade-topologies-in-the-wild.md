---
title: 'Governance upgrade topologies in the wild (Aave V3 and V4), and what they mean for the unknown-signer seam'
slug: governance-upgrade-topologies-in-the-wild
source: 'read directly from aave-dao/aave-v3-origin@main, aave/aave-v3-deploy@main and aave/aave-v4@main via raw.githubusercontent.com / the GitHub contents API, plus OpenZeppelin/openzeppelin-contracts@master `governance/TimelockController.sol` (header says last updated v5.6.0), 2026-08-18. Every claim below cites the file it came from.'
---

# Who actually holds the upgrade right, in real protocols

External ground truth gathered to REPLACE five open questions on `spec:unknown-signer-migration-and-patterns` that were waiting on answers from external teams. The questions asked which governance shape, which proxy type, and whether upgrades are batched. All of it is public and readable, so it was read instead of asked. This note is the evidence; the specs derived from it are `unknown-signer-v1-migration`, `governance-topology-validation` and `unsignable-routes`.

It is **load-bearing** in one specific way: it establishes that the interesting case is not "a Safe owns the proxy" (which rocketh already handles) but "the address that holds the upgrade right is a CONTRACT that must be called THROUGH, not sent FROM". Do not re-litigate the spec split without reading this.

## Aave V3: a registry contract is the proxy admin, and it is `Ownable`

`src/contracts/protocol/configuration/PoolAddressesProvider.sol` (aave-dao/aave-v3-origin) is `Ownable`, and its header says `@dev Acts as factory of proxies and admin of those, so with right to change its implementations` / `@dev Owned by the Aave Governance`.

Upgrades are `onlyOwner` methods on that registry, not on a ProxyAdmin and not on the proxy:

- `setPoolImpl(address)`, `setPoolConfiguratorImpl(address)`, `setAddressAsProxy(bytes32,address)`
- each delegates to `_updateImpl(id, newAddress)`, which calls `proxy.upgradeToAndCall(newAddress, abi.encodeWithSignature('initialize(address)', address(this)))` on an `InitializableImmutableAdminUpgradeabilityProxy`.

Three consequences that answer old questions directly:

1. **The proxy's admin is the registry itself, immutably.** There is no ProxyAdmin and no transferable proxy ownership. The old "Transparent-via-ProxyAdmin, UUPS, or EIP173?" question had no correct answer: it is none of them.
2. **Upgrade and re-initialisation are ONE call.** `_updateImpl` always bundles `initialize` into `upgradeToAndCall`. So the old "are there init/migration calls that must be in the same batch as the upgrade, with ordering constraints?" question is answered by the contract: for the pool upgrade itself there is no separate init step to order.
3. **The deferred transaction is `{from: governance, to: poolAddressesProvider, data: setPoolImpl(...)}`.** This is not a `deployViaProxy` shape at all. It is a plain `execute` against a registry, which the seam already covers.

`aave/aave-v3-deploy` is the hardhat-deploy-based repo. `deploy/02_market/00_setup_addresses_provider.ts` deploys the provider with `args: ["0", deployer]`, i.e. **deployer-owned at first**, and later steps hand it over. Its config calls are made through `hre.ethers.getSigner(deployer)` + `waitForTx(...)` rather than through hardhat-deploy's own `execute`, so they never reach the unknown-signer path. The repo's README states it "can only be used for local or testing purposes" and directs production deployers to Aave Governance. No use of `catchUnknownSigner` was observed in the scripts read.

**Caveat, stated as a caveat:** only the scripts listed above were read, not the whole repo. The claim "Aave does not use `catchUnknownSigner`" is NOT established; what is established is that their public deploy repo is self-declared non-production and that the provider's upgrade entry point is `onlyOwner` on a registry.

## Aave V4: no JavaScript deploy layer at all, and TWO governance surfaces

`aave/aave-v4` (README, `src/deployments/README.md`, `scripts/deploy/`) is Foundry-only. The deployment framework is written in **Solidity**: `src/deployments/` holds `batches/`, `procedures/`, `orchestration/`, `libraries/`, `utils/`, driven by `scripts/deploy/AaveV4DeployBatchBase.s.sol`. Addresses are CREATE2-deterministic from deployer + user salt + instance label. There is no hardhat, no hardhat-deploy, no JS deployment records.

That is worth stating plainly: **V4 is not a migration target for rocketh as things stand today.** They did not move from hardhat-deploy v1 to something else in JS; they left JS.

> **Amended 2026-08-18, the same day this was written.** "As things stand today" is doing real work in that sentence. Foundry support is intended: `forge-deploy` is to be brought into this repo, converted to TypeScript and ported in steps, the FIRST step being the ability to consume forge artifacts (`work/notes/ideas/foundry-support-via-forge-deploy.md`). Once that lands, "is this a migration target?" stops being answerable by "do they have a JS deploy layer?", and the paragraph above should be read as a statement about the current artifact story rather than about V4. Nothing else in this note changes: the governance shapes below are properties of the CONTRACTS, and hold whatever toolchain compiles them.

What is valuable regardless is the governance shape, because it is where the ecosystem is heading. V4 has **two orthogonal privileged surfaces**:

1. **Upgrades.** `src/deployments/batches/AaveV4HubInstanceBatch.sol` takes a `proxyAdminOwner_` and deploys "Hub (proxy + implementation)". Same for `AaveV4SpokeInstanceBatch` and `AaveV4TreasurySpokeBatch`. So upgrades are ProxyAdmin-shaped, `from = proxyAdminOwner`. This is the topology rocketh already handles.
2. **Configuration.** Every operational change goes through `HubConfigurator` / `SpokeConfigurator`, guarded by an OpenZeppelin `AccessManagerEnumerable` with numbered roles (Hub 100-199, HubConfigurator 200-299, Spoke 300-399, SpokeConfigurator 400-499). `src/config-engine/` is described as "Config engine for governance payload generation".

The deploy orchestration ends with a **`DEFAULT_ADMIN` transfer** from the deployer to `accessManagerAdmin` (`src/deployments/README.md`, quickstart step 3, and the role table: role 0 is "Transferred from deployer at end of deploy"). That is precisely the deployer-to-governance handoff step, confirmed as a real lifecycle stage rather than a hypothetical.

Two things NOT established, flagged so nobody repeats them as fact:

- Whether Aave enables OZ `AccessManager` **execution delays**. The mechanism exists in OZ v5 (a role can carry a delay, turning calls into `schedule` then `execute`), which is why it matters here, but the V4 configuration was not read closely enough to say whether any delay is non-zero.
- Whether `proxyAdminOwner` in production is a Safe, the governance executor, or something else. The deployment inputs default zero-address admin fields to the deployer, and production values were not read.

## The pattern the two have in common

In both protocols, and in the Timelock topology generally, the address that holds the upgrade right is **a contract**. That produces a deferred transaction of the form `{from: <a contract>, to: ..., data: ...}`, which is informative but **not executable as written**: nobody can send a transaction from a contract address. The operator's real transaction is a DIFFERENT one, addressed to that contract:

| Holder of the right             | What rocketh surfaces today                                | What the operator must actually send                                                                                                      |
| ------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Safe / multisig                 | `{from: safe, to: target, data}`                           | the same call, via the Safe. Directly usable.                                                                                             |
| OZ `TimelockController`         | `{from: timelock, to: target, data}`                       | `timelock.schedule(target, 0, data, pred, salt, delay)`, then after the delay `timelock.execute(...)`, both sent by the proposer/executor |
| OZ `AccessManager` with a delay | `{from: manager-gated caller, to: target, data}`           | `manager.schedule(target, data, when)`, then `target.<fn>(...)` or `manager.execute(target, data)`                                        |
| Aave V3 `PoolAddressesProvider` | `{from: governance, to: provider, data: setPoolImpl(...)}` | directly usable IF governance is an EOA/Safe; otherwise recurses into the rows above                                                      |

The Safe row is the only one where surfaced equals executable, and it is the only row rocketh currently serves well. Everything else needs a **call-through translation**, which is a rocketh design question and not a question for any team.

## OpenZeppelin `TimelockController`, as it actually behaves

Read from `contracts/governance/TimelockController.sol` because the whole call-through design turns on it. Load-bearing, and two of these corrected a wrong assumption made in the same session.

**Four states, in the contract.** `getOperationState(id)` returns `enum OperationState {Unset, Waiting, Ready, Done}`, derived from a single `_timestamps[id]`: `0` is Unset, `DONE_TIMESTAMP` (`1`) is Done, `> block.timestamp` is Waiting, otherwise Ready. The `isOperation` / `isOperationPending` / `isOperationReady` / `isOperationDone` helpers are all thin wrappers over it. So the state machine a router has to model is not invented, it is the contract's own.

**An identical operation can never be scheduled twice, ever.** `_schedule` reverts `TimelockUnexpectedOperationState` when `isOperation(id)`, and a Done operation keeps `_timestamps[id] == 1`, so it remains an operation forever. Since `hashOperation` is `keccak256(abi.encode(target, value, data, predecessor, salt))`, scheduling the byte-identical call a second time reverts. A constant salt is therefore not viable for anything that could recur.

**Roles cannot be enumerated.** `TimelockController is AccessControl`, not `AccessControlEnumerable`. There is no way to ask the contract who its proposers are. A candidate can only be VERIFIED, with `hasRole(PROPOSER_ROLE, candidate)`. This is why "which account do I hold that can drive this timelock" is the one fact a route cannot discover, and why it has to come from the user's named accounts.

**But operations ARE discoverable, from logs.** This corrects an assumption made earlier in the same session, that a pending operation could only be found by re-deriving its id. `schedule` emits `CallScheduled(id, index, target, value, data, predecessor, delay)`, which carries the whole payload, and additionally `CallSalt(id, salt)` whenever the salt is non-zero (when it is zero, the salt is known by definition). So a route can find its own pending operation by scanning for a `CallScheduled` whose `(target, value, data)` match the call it wants, and recover both `id` and `salt` from the logs. `execute` takes the tuple rather than the id, so the salt genuinely is needed, and genuinely is recoverable.

That removes the need for a deterministic salt-derivation rule and, with it, the strongest argument for persisting anything. It costs an `eth_getLogs`, which is a capability assumption a timelock module takes on, not one core acquires.

**Execution may be open to anyone.** `execute` is guarded by `onlyRoleOrOpenRole(EXECUTOR_ROLE)`, which treats a role granted to `address(0)` as granted to everyone. So a route must not assume the executor and the proposer are the same account, nor that an executor role is held at all.

## What this kills

The five open questions on the original spec, in order:

1. Governance shape: answered as a topology space (above), which is what the tests actually need. Per-team specifics turn out not to change the mechanism.
2. Proxy type: established as NOT determining anything, since every proxy flavour funnels through the same `_execute(..., {account})` choke point in `packages/rocketh-proxy/src/index.ts` (`:550` and `:557` for the ProxyAdmin path, `:565` and `:572` for the proxy-direct path), and the seam fires on the signability of `from`, never on which method was called. Aave V3 additionally shows a shape that is none of the offered options.
3. Batching: out of scope in the spec that asked it, so the answer could not have changed anything there.
4. Init/migration ordering: answered by `_updateImpl` for Aave V3 (bundled into `upgradeToAndCall`). Generally, when a follow-up call has the same unsignable `from`, it defers too, so the operator receives an ORDERED list. That is a property of the design, derivable without asking.
5. Reference scripts: obtained, read, and cited above.
