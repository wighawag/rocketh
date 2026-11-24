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

- [x] One `deployViaProxy` call with unchanged options deploys an OpenZeppelin 5 transparent proxy on a fresh chain and, after the implementation changes, upgrades it through the proxy-created ProxyAdmin with `upgradeAndCall`, sent from that admin's owner.
- [x] The created ProxyAdmin is recorded on the first deploy, under a documented name.
- [x] A Safe-owned ProxyAdmin defers the upgrade under `catchUnknownSigner`, returning `{from: <owner>, to: <created ProxyAdmin>, value, data: upgradeAndCall(...)}`.
- [x] The same refusals as for a shared admin: an admin whose `owner()` is not `owner`, an admin owned by nobody, and a slot that no longer points at the recorded admin.
- [x] The `PIN:` tests in `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts` are updated to the new behaviour (the refusal pin flips; the workaround test may become the plain one-shape case).
- [x] `hardhat-deploy/migration/index.md` (Proxies; it was `documentation/migration/index.md` when this task was staged, before the docs restructure) and `packages/rocketh-proxy/README.md` describe the option.
- [x] Tests use `createTestEnvironment` and mock artifacts; `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass, plus a changeset for `@rocketh/proxy`.
- [x] Added at promotion: a proxy deployed BEFORE the record existed (by a hardhat-deploy v1 helper, or a plain `custom` proxy) gets the record on its next run, read from the admin slot, so a migrating project does not redeploy.
- [x] Added at promotion: `documentation/proxies/` documents it, including how to get OpenZeppelin's artifacts WITH metadata (Hardhat's `npmFilesToBuild`).

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

## Decisions

- **Spelling: a flag on `{type: 'custom'}`, `createsProxyAdmin: true`, not a new `type`.** Nothing is bundled (next decision), so the proxy is the user's artifact, which is what `custom` means; a new `type` was only natural if rocketh shipped the artifact like the other built-in kinds. The flag describes the proxy (its constructor creates its admin) rather than naming OpenZeppelin, so any proxy with that constructor shape is covered. Typed as its own member of the union (`ProxyAdminCreatedByProxyOptions`), which makes `proxyAdminArtifact` required with it. Touches: `ProxyDeployOptions['proxyContract']` only.
- **No vendored OpenZeppelin 5 artifacts (ADR 0003 untouched).** Bundling them would need a second, newer solc in the artifact pipeline (it is pinned to 0.8.10; OpenZeppelin 5.6.1 needs `^0.8.22`), a chosen EVM target, a provenance test and an ADR amendment. Users compile OpenZeppelin in their project instead (`npmFilesToBuild` in Hardhat 3, checked on template-ethereum-contracts' `examples/npmFilesToBuild`: hardhat-deploy generates `artifacts.TransparentUpgradeableProxy` and `artifacts.ProxyAdmin` with full metadata), which also keeps their compiler settings. Considered: bundling (deferred, can be added later without a breaking change); OpenZeppelin's prebuilt `build/contracts/*.json` (no `metadata`, so `rocketh-verify` skips the contract; documented as the thing to avoid).
- **`proxyAdminArtifact` is REQUIRED with `createsProxyAdmin`.** It is the ABI (and bytecode, metadata) of the record rocketh writes for the created admin; the bundled `DefaultProxyAdmin` is OpenZeppelin 4's and recording it would assert code that is not there (ADR 0012). Considered: shipping only the v5 ProxyAdmin ABI.
- **The record of the created admin** is written right after the proxy's deployment, from the address READ in the admin slot (ADR 0012: observed, not assumed). Its `argsData` is the encoded `initialOwner` this run passed, and it carries the proxy's `transaction` and `receipt` (the admin was created in that transaction). An ADOPTED admin (proxy deployed earlier) gets `argsData: '0x'` and no transaction, since its construction was not observed. Default name `<name>_ProxyAdmin`, matching what projects (Odyssey's helper) already record; `proxyAdminName` overrides.
- **New refusals, both before the admin record is written** (the implementation, the proxy and the `<name>` record are already saved by then, as for any failure after deployment): with `createsProxyAdmin`, an EMPTY admin slot after the proxy is deployed throws (`... is declared with createsProxyAdmin, but the admin slot of <name>_Proxy ... is empty`), and so does a slot holding an address with NO CODE (`... holds <address>, which has no code`): that is the owner of a proxy that takes its admin as a constructor argument, and recording the ProxyAdmin artifact there would assert a contract that does not exist (ADR 0012). Checked with one `eth_getCode`. Raised in review; the first draft left the second case to surface on the first upgrade.
- **ADR 0015 amended** for the one whole record `@rocketh/proxy` now writes: its `argsData` is the encoded `initialOwner` when this run deployed the proxy, and `0x` meaning "not known" when the record is written later for an existing proxy. Raised in review.
- **`upgradeFunction` works with `createsProxyAdmin`**: the target name of a custom upgrade call is taken from whichever admin is in use. The first draft read it from the shared-admin options only and crashed; caught in review, pinned by a test.
- **The created admin is looked up only once the proxy exists** (the `<name>` record is present). On a first deploy the constructor always receives the owner, even if a stale admin record exists under the name, and that record is then overwritten with the admin actually created.
- **Order of the owner checks** for the created admin: owned-by-no-one first, then owner mismatch, so a zero owner gets its own message (the shared-admin path checks mismatch first, which makes its no-one message unreachable unless `owner` is itself zero; left as is).

