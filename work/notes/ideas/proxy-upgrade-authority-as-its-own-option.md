---
title: 'deployViaProxy: separate WHICH proxy from WHO holds the upgrade right, and derive the upgrade path from the chain'
type: idea
status: incubating
created: 2026-11-24
slug: proxy-upgrade-authority-as-its-own-option
---

# Idea: the upgrade authority as its own option, derived from the chain

Status: incubating. Not scheduled: the trigger to pick it up is the next proxy case that does not fit the current shape (a beacon proxy is the likely one; the proxies page says "Beacon proxies are not built in").

## The problem

`proxyContract` in `@rocketh/proxy` (`packages/rocketh-proxy/src/index.ts`, `ProxyDeployOptions`) answers two independent questions in one object:

1. **Which proxy contract is deployed:** `ERC173Proxy`, `ERC173ProxyWithReceive`, `UUPS`, the two `SharedAdmin*` transparent proxies, or `{type: 'custom', artifact, args}`.
2. **Who holds the upgrade right, and how rocketh reaches it:** the owner directly (ERC-173, UUPS), an admin contract rocketh deploys or reuses (`proxyAdminName`, `proxyAdminArtifact`), an admin contract the proxy creates (`createsProxyAdmin`, added for OpenZeppelin 5's `TransparentUpgradeableProxy` in `work/tasks/done/openzeppelin-5-transparent-proxy-kind.md`), plus a custom upgrade entry point (`upgradeFunction`).

Each new case has been added as another optional field, so a `custom` proxy can now carry `proxyAdminName`, `proxyAdminArtifact`, `createsProxyAdmin` and `upgradeFunction`, of which only some combinations make sense. The cost is already visible: the first draft of `createsProxyAdmin` crashed when combined with `upgradeFunction`, because the upgrade code assumed "there is an admin contract" implied "it came from `proxyAdminName`" (caught in review before merge).

The upgrade path also depends on RECORDS: the admin contract is found by deployment name, and `createsProxyAdmin` has to write a record for an admin rocketh never deployed, whose `argsData` is unknown when the proxy predates the record (ADR 0015 amendment of 2026-11-24).

## The proposal

**A separate option for the upgrade authority, one explicit variant per case**, next to a `proxyContract` that only picks the contract. A sketch, not a settled API:

```typescript
admin:
	| {kind: 'owner'} // ERC-173, UUPS: the owner upgrades the proxy directly
	| {kind: 'contract'; name: string; artifact?: Artifact} // rocketh deploys it (or reuses `name`), owned by `owner`
	| {kind: 'created-by-proxy'; name?: string; artifact: Artifact}; // the proxy's constructor creates it (OpenZeppelin 5)
```

Each built-in proxy kind would default `admin` to what it needs, and an impossible combination would be a type error rather than a runtime surprise.

**The upgrade derived from the chain**, in the spirit of ADR 0006 and ADR 0012 (what the chain says decides; records are a convenience): on an upgrade, read the EIP-1967 admin slot (or `owner()` for ERC-173). If it is the owner, upgrade the proxy directly; if it is a contract whose `owner()` is the owner, upgrade through it. Under that model a proxy that creates its admin needs no special upgrade handling at all: only the FIRST deploy has to know what to pass the constructor. The admin's record becomes optional, and the unknown-`argsData` problem goes away with it.

**OpenZeppelin 5's transparent proxy as a built-in, bundled kind** (and probably the default transparent kind, since it is what OpenZeppelin ships), with the two `SharedAdmin*` kinds kept for hardhat-deploy v1 continuity, which is ADR 0003's purpose. This needs the artifact pipeline (`scripts/generate-v1-artifacts.ts`, pinned to solc 0.8.10) to support a newer compiler (OpenZeppelin 5.6.1 needs `^0.8.22`), a chosen EVM target (`paris` keeps it deployable on chains without Shanghai), a provenance test and an ADR 0003 amendment. Until then, users compile OpenZeppelin in their project (`npmFilesToBuild`), as documented on the proxies page.

## Why not now

- `createsProxyAdmin` is additive and backward compatible; a redesign touches every `deployViaProxy` user while teams are being asked to migrate from v1.
- Nothing is locked in: `@rocketh/proxy`'s OPTIONS are under no stability promise (ADR 0015 freezes record fields, ADR 0016 the unknown-signer surface). `createsProxyAdmin: true` can later be accepted as a spelling of `{kind: 'created-by-proxy'}`, and `proxyAdminName` / `proxyAdminArtifact` of `{kind: 'contract'}`.

## Open questions

- Chain-derived discovery and trust: should rocketh ever upgrade through an admin contract it finds in the slot but has no record of, or only report it? (The owner check limits the risk: the contract must answer `owner()` with the expected owner.)
- Where `upgradeFunction` lives in the new shape: on the `{kind: 'contract'}` variant, or as its own option as today.
- Whether beacon proxies fit as one more `proxyContract` kind with `admin: {kind: 'contract'}` pointing at the beacon, or need their own shape (one beacon, many proxies, one upgrade).
- Migration of existing records: a chain-derived path should read records written by the current shape without rewriting them.
