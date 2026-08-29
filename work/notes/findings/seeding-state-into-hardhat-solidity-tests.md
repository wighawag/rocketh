---
title: 'There is no provider to hand a Solidity test run, and both routes into it wait on EDR #911'
source: 'Read from the installed hardhat 3.12.0 and @nomicfoundation/edr 0.15.0 type declarations and dist sources in this repo tree, 2026-08-29. Paths and quotes below.'
---

# Why this note exists

The question "can rocketh deploy into the EVM that `hardhat test solidity` uses, so Solidity tests see a real deployment?" has now been asked twice, and the obvious answers both look available and are not. Recording the mechanism so it is not re-derived a third time, and so the watch item is explicit.

# There is no provider in that path

`hardhat test solidity` does not run against a JSON-RPC provider. `runner.js` calls `edrContext.runSolidityTests(chainType, artifacts, testSuiteIds, testRunnerConfig, tracingConfig, callback)` on a global EDR context, and EDR executes each suite in its own executor. The signature takes CONFIG ARGS, not a provider and not a state handle, so there is nothing to capture between "initialised" and "runs the tests", and no instance can be handed in.

This is the key confusion to avoid: the `edr-simulated` hardhat NETWORK is a provider, and rocketh already deploys against it (`packages/hardhat-deploy/src/tasks/deploy.ts` treats it as `isMemoryNetwork`). That provider is a different object from the EVM the Solidity tests run in. Deploying into the first does not populate the second.

# The two routes, and what each costs

**Fork over HTTP.** `SolidityTestForkingConfig {url, blockNumber, rpcEndpoints}` reaches EDR's `ethRpcUrl` / `forkBlockNumber`. It works today, and it is the only route that needs no work from us. It costs a live node on a PORT for the duration of the test run, which is what an in-memory Solidity test run otherwise avoids.

**Seed the state directly.** `SolidityTestRunnerConfigArgs.localPredeploys: Array<AccountOverride>` is the only state-seeding field on the config. `AccountOverride` carries `address`, `balance`, `nonce`, `code`, and a `storage` field documented in EDR 0.15.0 as:

> BEWARE: This field is not supported yet. See <https://github.com/NomicFoundation/edr/issues/911>

Without storage this is useless rather than merely limited: an injected contract has no owner, no initialised state, and for a proxy no implementation slot, so it behaves as though it was never constructed.

Hardhat knows. `runner.js` carries its own `// TODO: Add support for predeploys once EDR supports them.` immediately above the `runSolidityTests` call, so predeploys is the path the hardhat team intends too.

# What this leaves

For a Solidity fixture built from rocketh deploy scripts, today: a live node on a port, or replaying captured transactions in `setUp()`. Only the second is port-free, and it also works under pure `forge` with no hardhat and no RPC. That is why `work/specs/proposed/captured-transactions.md` treats capture as the port-free route rather than as redundant.

**Watch NomicFoundation/edr#911.** If `storage` lands on `AccountOverride`, seeding the test EVM from a deploy run becomes strictly better than both routes, and the Solidity-side justification for transaction capture weakens accordingly. The Safe-batch justification is unaffected either way.

# The larger half, which none of this addresses

Getting the STATE into the test EVM is only half the problem. The Solidity tests also have to learn the deployed ADDRESSES and ideally the ABIs, which is a separate plumbing problem with its own prior art in `forge-deploy` (see `work/notes/ideas/foundry-support-via-forge-deploy.md`, where bringing that project in, converted to TypeScript and ported in steps, is recorded as maintainer-stated intent). Nothing above solves that, and it should not be designed as part of transaction capture.
