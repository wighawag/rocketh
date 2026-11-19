# Deploy scripts stay TypeScript; Solidity reads deployments and does not author them

Supporting Foundry users does not mean rocketh grows Solidity deploy scripts. Deploy scripts stay TypeScript, run by rocketh against an EIP-1193 provider, because that is what lets the same scripts run anywhere: the `rocketh` CLI, Hardhat through hardhat-deploy, a vitest suite, and a browser (ADR 0002). The Solidity side is a CONSUMER: a forge test or script reads what rocketh deployed (by name, typed, through generated Solidity), and never deploys through rocketh itself.

## Considered Options

- **Solidity deploy scripts, as `forge-deploy` has them** (typed `deploy_<Contract>(...)` functions generated per contract, run by `forge script`). Rejected for now: a deploy script written in Solidity only runs where forge runs, so it ties the project to forge unless the `rocketh` CLI can also run it, which would mean executing Solidity outside forge. It stays a possible later step, and the generated Solidity is shaped so it can grow into it (see below).
- **Run the TypeScript scripts live inside `forge test`** through `forge-exec` (ffi plus an IPC channel back into forge's EVM). Rejected for now: it needs `ffi = true` and an external binary, and its channel offers create, call and send but not an EIP-1193 provider, so rocketh's scripts cannot run on it unchanged. Kept as an idea (`work/notes/ideas/forge-exec-live-deploy-scripts.md`).
- **Point `forge test --fork-url` at a node the scripts deployed to.** It works today, but it needs a node on a port for every test run. Not the supported path.

## Consequences

- Getting a deployment into `forge test` is a HAND-OFF from a rocketh run to forge's EVM, generated before the test run (spec `deployments-in-solidity`), not an execution inside it.
- The Solidity access layer follows `forge-deploy`'s shape (a `Deployer` contract at a fixed address, typed accessors generated per deployment), so that typed Solidity deploy calls can be added to the same `Deployer` later without changing how tests read deployments.
- `forge-deploy` is expected to be deprecated in favour of rocketh once this ships, but not before.
- This leaves a known group unserved for now. `work/notes/findings/deployment-workflow-field-study.md` records a team that deploys through Solidity and rejected TypeScript deploy scripts for their own use, while endorsing a Solidity-side mechanism that writes hardhat-deploy-compatible records. That is the later step above, not a reason to move deploy scripts out of TypeScript.
