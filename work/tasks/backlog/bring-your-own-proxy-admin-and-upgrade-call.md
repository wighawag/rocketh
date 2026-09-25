---
title: 'Proxies: bring your own ProxyAdmin contract and your own upgrade call'
slug: bring-your-own-proxy-admin-and-upgrade-call
blockedBy: []
covers: []
---

## What to build

Two v1 proxy options that `@rocketh/proxy` does not have, built as one slice because a proxy with a non-standard admin usually also has a non-standard upgrade entry point. The maintainer decided on 2026-09-24 to keep both.

**1. A custom admin contract.** In hardhat-deploy v1 (tag v1.0.4), `viaAdminContract` is either a name or `{name, artifact?}` (`types.ts:113-118`). v1 looks the admin deployment up by name, deploys it from the given artifact if it is absent (constructor args `[owner]`), reads its `owner()`, refuses when that owner is not the expected one, refuses when it is the zero address, and routes the upgrade through it (`src/helpers.ts:1286-1320, 1398-1435`). `@rocketh/proxy` supports only its bundled `DefaultProxyAdmin`, and only for the two `SharedAdmin*` proxy kinds, with a configurable NAME but not artifact (`packages/rocketh-proxy/src/index.ts:87-99` for the type, where the omission is a TODO at `:98`; the flow is `:328-372`).

**2. A custom upgrade call.** v1's `upgradeFunction: {methodName, upgradeArgs}` names the upgrade method and its argument template, with `{proxy}`, `{implementation}`, `{data}` placeholders (`types.ts:122-125`, used at `src/helpers.ts:1517-1546`). rocketh chooses among `upgradeTo`, `upgradeToAndCall`, `upgrade` and `upgradeAndCall` itself (`packages/rocketh-proxy/src/index.ts:549-587`). Note rocketh's `replaceTemplateArgs` already supports all four placeholders including `{proxy}` (`packages/rocketh-proxy/src/utils.ts:61-95`), so the substitution exists and only the option does not.

Constraints the design must respect:

- The upgrade transaction is sent FROM the admin contract's current owner, through `_execute`. That makes it the unknown-signer seam's most important case: an admin owned by a multisig is exactly what `catchUnknownSigner` and the `ask` policy exist for (ADR 0006). A custom admin must reach that seam the same way the bundled one does, so a deferred upgrade surfaces the right `{from, to, data}`.
- The governance-topology matrix tasks in `work/tasks/ready/` (`unknown-signer-matrix-*`) pin today's behaviour of this exact code path, including the ownership refusals. Changing refusal messages or ordering breaks their premise; if you must, say so in `## Decisions` and name the affected tasks.
- Whether a custom admin is allowed with the `ERC173Proxy`, `UUPS` and custom proxy kinds, or only with transparent-style proxies, is a real design choice (v1 allowed it anywhere and threw "Old Proxy do not support Proxy Admin contracts" in one legacy case). Decide it and record why.
- Options are an addition to `ProxyDeployOptions`; every existing script must behave identically.

## Acceptance criteria

- [ ] A proxy can be deployed and upgraded through a ProxyAdmin deployed from a caller-supplied artifact, and through an ALREADY-deployed admin found by name.
- [ ] The ownership refusals (owner mismatch, zero owner) hold for a custom admin exactly as for the bundled one.
- [ ] A caller-named upgrade method with an argument template is used for the upgrade, with or without a custom admin.
- [ ] With the admin owned by an address the run cannot sign for, `catchUnknownSigner` surfaces the upgrade as `{from: <admin owner>, to: <admin>, data: <the custom call>}`.
- [ ] Existing proxy tests pass unchanged.
- [ ] Tests use `createTestEnvironment`; `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; a minor changeset for `@rocketh/proxy`.

## Blocked by

- None. Coordinate with the `unknown-signer-matrix-*` ready tasks as described above.

## Prompt

> Add a caller-supplied ProxyAdmin (artifact, or existing deployment by name) and a caller-supplied upgrade call (method plus argument template) to `@rocketh/proxy`. The v1 behaviour and both sides' citations are in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section C; read v1's semantics from there rather than re-deriving them.
>
> Read ADR 0006 (`docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`) before designing: the upgrade call goes out from the admin's owner, and a multisig-owned admin must defer through the seam, not fail around it. Read the `unknown-signer-matrix-*` tasks in `work/tasks/ready/`, which pin this path's current behaviour.
>
> Public repository: describe the motivating shapes by PATTERN (a registry contract as the admin, an admin with a differently named upgrade entry point), never by who reported them (AGENTS.md).
>
> FIRST, check this task against current reality; if the proxy code has moved, route to needs-attention (WORK-CONTRACT.md, "Drift is a needs-attention signal").
>
> RECORD non-obvious decisions in `## Decisions` at the end of your FINAL REPORT, above all which proxy kinds accept a custom admin. Do not write the done record or the commit message yourself.
