---
title: 'deployViaProxy: deploy and upgrade an OpenZeppelin 5 transparent proxy, whose ProxyAdmin the proxy creates'
slug: openzeppelin-5-transparent-proxy-kind
blockedBy: []
covers: []
---

## What to build

OpenZeppelin 5's `TransparentUpgradeableProxy(logic, initialOwner, data)` does not take an admin: its constructor CREATES a `ProxyAdmin` owned by `initialOwner` and stores that new contract's address in the EIP-1967 admin slot (`TransparentUpgradeableProxy.sol:78-79` in OpenZeppelin 5.0.1). Upgrades then go through that ProxyAdmin's `upgradeAndCall(proxy, implementation, data)`, sent by its owner; the v5 ProxyAdmin has no `upgrade`. It is the transparent proxy a project gets from OpenZeppelin today, and one of the three protocols in `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` (Odyssey) runs every upgradeable contract on it, with a Safe as `initialOwner`.

`deployViaProxy` can DEPLOY it today through `{type: 'custom', artifact}` (the `{admin}` placeholder receives the owner, which is what the v5 constructor wants), but cannot UPGRADE it: on the upgrade branch it reads the admin slot, finds the proxy-created ProxyAdmin, compares it with the owner and throws `To change owner/admin, you need to call the proxy directly` (`packages/rocketh-proxy/src/index.ts`, the `currentOwner` checks of the upgrade branch). The only path that works is a two-shape script: deploy without an admin contract, save the created ProxyAdmin from the slot as a record, and on later runs name that record as `proxyAdminName`. Both behaviours are pinned in `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts` (the `PIN:` describe block).

Make ONE `deployViaProxy` call, with the same options on every run, deploy such a proxy and upgrade it:

- On the first deploy, pass the owner to the constructor (as today), then read the admin slot and record the created ProxyAdmin as a deployment (the natural name is `<name>_ProxyAdmin`, matching what projects already record by hand), so later runs and other tools can address it.
- On an upgrade, treat that recorded ProxyAdmin as the admin contract: check its `owner()` against `owner` exactly as for a shared admin (same refusals), check the slot still points at it, and send `upgradeAndCall(proxy, implementation, data)` from its owner (`data` is the `execute` / `onUpgrade` calldata or `0x`). An unsignable owner must reach the unknown-signer seam like every other upgrade, so `catchUnknownSigner` defers it.
- The user supplies the proxy artifact (no vendoring, see Out of scope). How the option is spelled (a flag on `{type: 'custom'}`, or a new `type`) is the builder's call; record it in `## Decisions`.

Out of scope: making OpenZeppelin 5's proxy a BUILT-IN kind with a vendored artifact. That is the finding's open question 1, whose suggested default is to build this custom-artifact support first; native support (new sources in `packages/rocketh-proxy/scripts/generate-artifacts.ts`, a built-in name, an ADR 0003 amendment) is a later step.

## Acceptance criteria

- [ ] One `deployViaProxy` call with unchanged options deploys an OpenZeppelin 5 transparent proxy on a fresh chain and, after the implementation changes, upgrades it through the proxy-created ProxyAdmin with `upgradeAndCall`, sent from that admin's owner.
- [ ] The created ProxyAdmin is recorded on the first deploy, under a documented name.
- [ ] A Safe-owned ProxyAdmin defers the upgrade under `catchUnknownSigner`, returning `{from: <owner>, to: <created ProxyAdmin>, value, data: upgradeAndCall(...)}`.
- [ ] The same refusals as for a shared admin: an admin whose `owner()` is not `owner`, an admin owned by nobody, and a slot that no longer points at the recorded admin.
- [ ] The `PIN:` tests in `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts` are updated to the new behaviour (the refusal pin flips; the workaround test may become the plain one-shape case).
- [ ] `documentation/migration/index.md` (Proxies) and `packages/rocketh-proxy/README.md` describe the option.
- [ ] Tests use `createTestEnvironment` and mock artifacts; `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass, plus a changeset for `@rocketh/proxy`.

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: make `@rocketh/proxy`'s `deployViaProxy` able to deploy AND upgrade an OpenZeppelin 5 `TransparentUpgradeableProxy`, whose constructor creates its own `ProxyAdmin` (owned by `initialOwner`) and writes that ProxyAdmin into the EIP-1967 admin slot, with the same options on every run.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Re-run `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts`: its `PIN:` block shows today's behaviour (deploy works; upgrade throws on the admin-slot check; a two-shape workaround with a hand-saved `<name>_ProxyAdmin` record works). If the refusal no longer happens, the premise is gone: route to needs-attention. Read `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` (Odyssey section) for the real-world shape, and Odyssey's own helper it cites (`helpers/deploy3.ts`), which does exactly this by hand under hardhat-deploy v1.
>
> Where to look: `packages/rocketh-proxy/src/index.ts`, the `viaAdminContract` resolution (`resolveAdminContract`, the `proxyAdminContract` block that reads `owner()`), the fresh-deploy branch (constructor args from `proxyArgsTemplate`) and the upgrade branch (admin-slot read, `currentOwner` checks, `upgradeAndCall` vs `upgrade`). The existing shared-admin path is the model: what changes is WHEN the admin exists (after the proxy, not before) and WHO deploys it (the proxy, not rocketh). Mock artifacts with the v5 ABIs (no public functions on the proxy; `owner()` and `upgradeAndCall` on the ProxyAdmin) are in the Odyssey test.
>
> Do not vendor OpenZeppelin 5 artifacts (that touches the vendored-artifacts decision in `docs/adr/`); the user supplies the proxy artifact, as `{type: 'custom'}` does now. The ProxyAdmin's ABI only needs `owner()` and `upgradeAndCall`.
>
> Seams to test at: the record set after the first deploy; the upgrade transaction (target, sender, calldata); the deferral under `catchUnknownSigner` for a Safe owner; each refusal. Use `createTestEnvironment` from `@rocketh/test-utils` and keep chain state across runs the way the ported-protocols harness does.
>
> Done means: the acceptance criteria above, with the option documented where proxy options are documented.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report (the option's spelling, the recorded admin's name, what happens to a project that already saved that record by hand).
