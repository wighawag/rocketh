---
title: 'Deployment records carry a run result (`newlyDeployed`) and the vendored artifacts'' full `solcInput`'
type: observation
status: spotted
spotted: 2026-10-26
---

Spotted while writing ADR 0015 (`docs/adr/0015-the-deployment-record-is-a-published-format.md`), confirmed with a throwaway probe against `createNodeHeldEnvironment` (not kept).

- A fresh `diamond(env)(...)` writes `"newlyDeployed": true` into the diamond `<name>` record, because `packages/rocketh-diamond/src/index.ts:463-466` spreads the `DeployResult` of `_deploy` into `env.save`. `@rocketh/proxy` (`packages/rocketh-proxy/src/index.ts:514`) and `@rocketh/router` (`packages/rocketh-router/src/index.ts:187`) strip it first; diamond does not.
- Records built from the vendored hardhat-deploy v1 artifacts (`<name>_Proxy`, a proxy's `<name>`, the default diamond facets, `<name>_DiamondProxy`, a diamond's `<name>`) carry `solcInput` (the whole compiler input) and `solcInputHash`, by artifact pass-through. The `_`-key stripping and `evm` narrowing in `packages/rocketh/src/environment/index.ts:1482-1494` run only on the broadcast path, never at the `env.save` call sites in proxy and diamond.

Neither is part of the published format (ADR 0015 says so); both look like candidates for a small fix that strips them at write time.
