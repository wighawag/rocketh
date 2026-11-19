---
title: 'Deployments in Solidity: forge tests and scripts read what rocketh deployed, by name and typed'
slug: deployments-in-solidity
needsAnswers: true
taskedAfter: [forge-artifacts]
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) and the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks or ADRs, and this spec settles to its durable framing of Problem, Solution, User Stories and Out of Scope.)

<!-- open-questions -->

## Open questions

1. **How the deployment reaches forge's EVM for `forge test`.** `forge test` runs every test contract on a fresh EVM of its own, so a deployment made by a rocketh run on another chain is not there; it has to be brought in during `setUp()`. Two ways, and the in-process chain chosen in spec `in-process-chain` decides whether the first is possible:
   - **Load the resulting state**: the rocketh run exports every touched account (code, storage, balance, nonce) and `setUp()` loads it with `vm.loadAllocs`. Nothing is re-executed, it is exact, and it is fast. Needs the chain to export its state.
   - **Replay the captured transactions** (`documentation/captured-transactions/`): works with any chain, but re-executes everything in every test contract's `setUp()`, and is subject to the four address conditions that page lists.
   Recommendation: load the state, with replay as the fallback for a chain that cannot export it (EDR). Proven feasible: a webevm 0.9.1 dump, converted to an alloc map, loaded and passed in a real `forge test` (`work/notes/findings/in-process-chain-without-hardhat.md`).
2. **How a test selects which deployment it reads.** The fixture (a fresh-genesis run made for the test) by default; a named environment's saved records when the test runs on a fork of that network (`forge test --fork-url ...`), or for a `forge script` against a real network. forge-deploy used a `DEPLOYMENT_CONTEXT` variable, defaulting to the chain id. Proposal: an environment variable naming the rocketh environment, defaulting to the fixture on chain 31337 and to the environment whose `chain` matches otherwise.
3. **Diamonds.** A diamond's ABI is the merge of its facets, with no single Solidity type. Return a generated interface that merges the facets, or only the address?

<!-- /open-questions -->

## Problem Statement

A Foundry user's deploy scripts are TypeScript run by rocketh (ADR 0018); their tests are Solidity run by `forge test`. Today the two do not meet. To test against the deployment their scripts really produce, they either point `forge test --fork-url` at a node the scripts deployed to (a node on a port for every test run), or hand-write a `setUp()` that replays the captured transactions entry by entry (`documentation/captured-transactions/`) and hard-code the addresses. And a `forge script` that operates on a deployed system on a real network has no way to find those contracts by name: the addresses are copied in by hand from `deployments/<environment>/`.

## Solution

rocketh generates Solidity, next to the project's sources and never committed, that gives forge typed access to deployments by name:

- a `Deployer` contract, placed at a fixed address on first use (the mechanism `forge-deploy` uses), that answers `has(name)`, `getAddress(name)` and `get(name)`;
- a generated library with one typed accessor per deployment, so a test writes `Counter counter = deployer.Counter();` and gets a `Counter` at the right address, a compile error if the deployment was renamed or removed, and nothing to install beyond forge-std;
- for `forge test`, a fixture: a rocketh run of the deploy scripts on an in-process chain from genesis (spec `in-process-chain`), whose result the generated `setUp()` helper brings into forge's EVM (open question 1);
- for real networks and forks, the same accessors reading the saved deployment records (`deployments/<environment>/<Name>.json`, a published format, ADR 0015).

There are no Solidity deploy functions: the Solidity side reads deployments and does not make them (ADR 0018). The `Deployer` is shaped so typed deploy calls can be added to it later.

## User Stories

1. As a Foundry user, I want one command that runs my deploy scripts and generates the Solidity access layer, so that `forge test` sees my real deployment.
2. As a Foundry user, I want each deployment available as a typed accessor (`deployer.Counter()` returning `Counter`), so that I call it without casts, ABI strings or copied addresses.
3. As a Foundry user, I want a renamed or removed deployment to fail compilation of my tests, so that the breakage shows at `forge build`, not as a zero address at run time.
4. As a Foundry user, I want the deployment present in every test contract's `setUp()` without re-running my TypeScript scripts there, so that tests stay fast and need no ffi.
5. As a Foundry user, I want the generated files never committed (gitignored), and regenerated before tests, so that they cannot drift from my scripts in the repository.
6. As a Foundry user who forgot to regenerate, I want `setUp()` to fail with a message naming the command to run when my contracts changed since the fixture was made, so that a stale fixture never passes silently.
7. As a Foundry user, I want a proxy deployment's accessor typed with the implementation's ABI at the proxy's address, so that I use it as I would in TypeScript.
8. As a Foundry user running `forge test --fork-url <mainnet>`, I want the accessors to read mainnet's saved records, so that a fork test sees the real system.
9. As a Foundry user writing a `forge script` against a real network, I want the same accessors, so that the script finds deployed contracts by name.
10. As a Foundry user, I want deploy scripts that use named accounts, impersonation (a Safe-owned step) and deterministic deployment to produce the same fixture as they produce elsewhere, so that the fixture is my deployment and not an approximation.
11. As a Foundry user, I want the generated code to need only forge-std, so that there is no Solidity library to install or keep in step.
12. As a Foundry user, I want deployment names that are not valid Solidity identifiers to be mapped predictably, and a collision to be an error that names both, so that generation never silently drops one.
13. As a Hardhat user running `hardhat test solidity`, I want whatever of this works there documented, and what does not stated (EDR does not support every cheatcode forge does, see `work/notes/findings/seeding-state-into-hardhat-solidity-tests.md`).
14. As a maintainer, I want the `Deployer` and the generated library shaped like `forge-deploy`'s, so that typed Solidity deploy calls can be added later without changing how tests read deployments, and so that `forge-deploy` users have a short path over.

## Implementation Decisions

- The generation is an OUTPUT of a rocketh run, not a post-processor of the captured-transactions file: that list carries no deployment names or artifacts (CONTEXT.md, "captured transaction"), and the accessors need both. The run's deployment records are the input.
- Reuse from `forge-deploy` (`../forge-deploy/contracts/Deployer.sol`, `DeployScript.sol`, `cli/templates/DeployerFunctions.g.sol.hbs`): the fixed-address `Deployer` placed with `vm.etch` of `vm.getDeployedCode(...)`, the `has` / `getAddress` / `get` interface, reading records with `vm.readFile` and `stdJson`, and per-contract code generation from a template. Drop its deploy functions, its broadcast handling and its `contexts.json` tags. Its CLI is Rust; the generation is rewritten in TypeScript in the package spec `forge-artifacts` settles on.
- The record reader binds to the published record fields (ADR 0015): `address`, `abi`, `argsData`, `bytecode`. forge-deploy read `args_data`; rocketh's field is `argsData`.
- The accessor's Solidity type comes from the artifact's source path and contract name, which spec `forge-artifacts` keeps in each artifact.
- Staleness: the fixture records the code hash of each artifact it deployed, and the generated `setUp()` helper compares them with `vm.getCode` of the current build, reverting with the regeneration command when they differ.
- Reading files needs `fs_permissions` in `foundry.toml` for the generated folder and `deployments/`; the generator says so (and the docs show it) rather than editing the user's `foundry.toml`.

## Testing Decisions

- The generated Solidity is compiled and run by a real `forge test` in CI (Foundry is already installed there for the getting-started page), on a demo with a plain contract, a proxy and a deterministic deployment: the accessors return the expected types at the expected addresses, a stale fixture reverts with the message, a renamed deployment fails compilation.
- Unit tests of the generator on fixture records (identifier mapping, collisions, proxies), with no forge needed.

## Out of Scope

- Solidity deploy scripts and typed Solidity deploy calls (ADR 0018; later, if at all).
- Running the TypeScript scripts live inside `forge test` (`work/notes/ideas/forge-exec-live-deploy-scripts.md`).
- forge-deploy's tags and contexts.
- Deprecating `forge-deploy`: expected once this ships, decided then.

## Further Notes

Depends on spec `in-process-chain` for the fixture run without a node on a port; until it lands, the same generation works against anvil.
