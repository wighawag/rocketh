---
title: 'Migration docs outside the patterns section teach `env.tags.live` as a drop-in for v1 `hre.network.live`'
date: 2026-09-26
---

Seen while building the executed migration pairs (2026-09-26). `skills/hardhat-deploy-migration/SKILL.md` Step 3.2 ("Proxy Deployment", its transformation rule 5: "Replace `hre.network.live` with `env.tags.live`") and `hardhat-deploy/documentation/how-to/migration-from-v1/index.md` (the `useProxy` examples) translate `hre.network.live` to `env.tags.live` without saying that rocketh declares no `live` tag: its default tags are `testnet` for a chain flagged as a testnet and none otherwise (`packages/rocketh/src/environment/chains.ts:88-95`). A ported script therefore sees `live` as falsy on every network, mainnet included, unless the project declares the tag itself. The rewritten patterns section says so; these two places still do not. Out of scope for the pairs task, so not changed there.
