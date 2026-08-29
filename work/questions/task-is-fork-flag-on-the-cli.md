<!-- dorfl-sidecar: item=task:is-fork-flag-on-the-cli type=task slug=is-fork-flag-on-the-cli allAnswered=false -->

## Q1

**'task:is-fork-flag-on-the-cli' was bounced — how should we proceed?**

> FALSE PREMISE: acceptance criteria 4 and 5 ("with nothing configured ... works with no configuration at all", and a `whenForked: {rpcUrl}`-only entry naming a fork elsewhere) cannot be satisfied by adding `--is-fork` and mapping it onto `ForkInput`. The CLI path never has a provider, and `getChainIdForEnvironment` (`packages/rocketh/src/executor/index.ts`, ~line 133) runs BEFORE `resolveExecutionParams`; with no provider its only source is `environments[<name>].chain`, so it throws `Could not find chainId for environment named "mainnet" (no provider)` before the conventional-local-endpoint fallback in `resolveExecutionParams` is ever reached.
>
> MEASURED (real `getChainIdForEnvironment` / `resolveExecutionParams`, probe deleted): `{fork: 'mainnet'}` with an empty config throws; with `environments: {mainnet: {whenForked: {rpcUrl: 'http://127.0.0.1:8546'}}}` and no `chain` it throws the same; with `environments: {mainnet: {chain: 1}}` the whole run is correct (endpoint `http://127.0.0.1:8545`, descriptor `{networkName: 'mainnet', chainId: 1}`, `saveDeployments: false`, `autoImpersonate: true`). `fork-config-layer.test.ts`'s "no chain configuration whatsoever" case passes only because it calls `resolveExecutionParams` directly with an already-computed id, so it cannot see this step.
>
> WHY THIS IS NOT A SMALL GAP I SHOULD CLOSE MYSELF: the only honest fix is a new core rule, "a fork run with no provider learns its CONNECTED chain id by dialling the node it attaches to". It is feasible (on a fork the connection is knowable without the chain id, since the connected bucket is fixed at 31337 plus `overrides` minus `rpcUrl` plus `whenForked` plus the conventional local url) but it requires extracting that endpoint resolution out of `resolveExecutionParams` so the chain-id step can use it, it introduces a NEW user-visible failure mode when the node is not running (a connection error replacing today's message), it changes behaviour for EVERY provider-less fork caller and not just the CLI, and it adds a fourth id source to the three ADR 0014 enumerates. That is a USER-VISIBLE DEFAULT plus a new REFUSAL in core, i.e. a design decision of the same size as the other `fork-*` tasks, each of which got its own task and its own ADR refinement.
>
> SUGGESTED RE-SCOPE, either of:
> (a) Split: add a prerequisite task "a provider-less fork run learns its connected chain id from the node it attaches to" (core: extract the fork connection-endpoint resolution, dial `eth_chainId` when `fork && !provider && !environments[<name>].chain`, decide and word the node-unreachable error, record it as an ADR 0014 refinement noting that discovery is possible ONLY on a fork, because off a fork the endpoint lookup itself depends on the chain id). Then this task lands unchanged.
> (b) Keep this task as the flag only, and restate criteria 4 and 5 as "works with a single declared line, `environments: {<network>: {chain: <id>}}`", with `documentation/fork-runs/index.md` saying so for the CLI exactly as it already does for the programmatic `@rocketh/node` path. The zero-configuration claim in the task body and in the parent spec's Out of Scope note ("that is why the flag needs no argument") then needs correcting, since it is true of the ENDPOINT only.
>
> ALSO SPOTTED, independent of the choice above and already captured in `work/notes/observations/a-provider-less-fork-run-cannot-resolve-its-chain-id.md`: `documentation/fork-runs/index.md` currently tells users that an environment entry carrying nothing but `whenForked` is valid, which is true of core's layering but false on the provider-less path a `@rocketh/node` fork run actually takes.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
