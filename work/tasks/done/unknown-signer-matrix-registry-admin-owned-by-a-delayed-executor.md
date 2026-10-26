---
title: 'Matrix entry: a registry contract as proxy admin, owned by a governance executor that acts after a delay'
slug: unknown-signer-matrix-registry-admin-owned-by-a-delayed-executor
blockedBy: []
covers: []
---

## What to build

One more entry in the unknown-signer matrix (`packages/rocketh-unknown-signer/test/scenarios.integration.test.ts`), for the governance shape a large lending protocol actually runs in production, plus the user docs that say what to do with its output.

The shape, measured on mainnet (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`, "Update 2026-10-26"): the proxies' admin is a REGISTRY contract (an `Ownable` addresses-provider that upgrades the proxies it owns, the shape the execute-guard tests already model); the registry is owned by a governance EXECUTOR contract; the executor is owned by a CONTROLLER contract that only has the executor act after a payload has waited out a delay. No Safe anywhere in the chain.

What the test must show, as documentation:

1. A deploy script upgrading through the registry, with the registry's owner being the executor, surfaces the deferred transaction as `{from: <executor>, to: <registry>, data: <the upgrade call>}`. `from` is a contract, so the transaction cannot be sent as written.
2. Its `{to, data}` is exactly the call the executor must make: decode `data` and assert the function and arguments, so a reader can see that this pair is what the governance proposal has to carry.
3. A re-run before governance acts surfaces the identical transaction; a re-run after the registry points at the new implementation surfaces nothing.
4. Nothing is persisted between the runs (mirror the existing "persists no unsigned transaction" assertions).

Then the docs: a short section in `documentation/unknown-signers/index.md` for "the owner is governance, not a multisig". It says, by pattern only: when the surfaced `from` is a contract that cannot originate a transaction (a governance executor, a timelock), the `{to, data}` is the call that contract must end up making; submit it through your governance process (for an executor, as the action of a proposal or payload). For an OpenZeppelin `TimelockController` you control, point at the existing timelock matrix entry and the demo workaround (`demoes/hardhat-deploy/governance/deploy/004_timelock_owned_admin.ts`). Say plainly that rocketh does not build governance proposals.

## Acceptance criteria

- [ ] A new `describe` block in the matrix covers points 1 to 4 above, in the integration-tests-as-documentation style of its neighbours, with a JSDoc that describes the shape by PATTERN.
- [ ] The surfaced `data` is decoded and checked, not only compared as bytes.
- [ ] `documentation/unknown-signers/index.md` gains the section described above, linked from where the page meets `catchUnknownSigner` or the `ask` flow.
- [ ] No existing test changes. No change to `src`: this pins today's behaviour and documents it.
- [ ] Tests use `createTestEnvironment`; `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; an empty changeset if the gate requires one.

## Blocked by

- None.

## Prompt

> Add the matrix entry and the docs section described above. Read the existing matrix entries in `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` first, above all the two "PIN" blocks (the handoff and the Timelock-owned admin), and reuse their setup helpers rather than inventing new ones. Read `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`, including its "Update 2026-10-26", and `CONTEXT.md` (`signer`, `signability`).
>
> The registry is NOT a `ProxyAdmin`: model it the way `packages/rocketh-read-execute/test/execute-guard-storage.integration.test.ts` models the addresses-provider shape, and route the upgrade through it the way a deploy script for that shape would (a custom admin plus `upgradeFunction`, from `@rocketh/proxy`, is the expected fit; confirm against `packages/rocketh-proxy/README.md`).
>
> This repository is PUBLIC. Describe every motivation and every test by its PATTERN ("a registry contract owned by a governance executor"), never by a protocol, team or person, and never mention funding, grants or milestones (AGENTS.md). The mainnet addresses belong in the finding, not in the test or the docs.
>
> Never run an unbounded regex over `packages/rocketh-proxy/src/hardhat-deploy-v1-artifacts/` or `packages/rocketh-diamond/src/hardhat-deploy-v1-artifacts/` (multi-megabyte single-line files); bound every command with `timeout`.
>
> FIRST, check this task against current reality; if the matrix or the proxy options have moved, route to needs-attention (WORK-CONTRACT.md, "Drift is a needs-attention signal"). RECORD non-obvious decisions in `## Decisions` at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.

## Decisions

- **The registry is a real deployment and also the proxy's admin.** I deployed it as a mock artifact with the deployer and pointed `proxyAdminName` at it, so `@rocketh/proxy` uses it as-is, and I set its `owner()` answer to the executor. A registry like this in production usually creates its proxies itself; here rocketh deploys the proxy with the registry as admin. That is enough because the upgrade path only reads the registry's `owner()` and the proxy's EIP-1967 slots. The alternative was a plain `execute` against a registry saved with `env.save`, which the finding calls the natural shape. I didn't take it because the task names custom admin plus `upgradeFunction` as the expected fit, and a plain `execute` would not show the `deployViaProxy` re-run converging on its own. This only affects the test.
- **I modelled the controller as a deployment and asserted it never appears in the output.** This documents that rocketh looks exactly one hop up the ownership chain. The alternative was to mention the controller only in the JSDoc. This only affects the test.
- **This block is not labelled a PIN.** Unlike the Timelock case, the surfaced `{to, data}` is the right content here, and only `from` needs human interpretation, so nothing in this entry is waiting for `unsignable-routes` to change it.
- **The docs link to the matrix and the demo through GitHub URLs**, the same `https://github.com/wighawag/rocketh/blob/main/...` form other pages in `documentation/` already use.
