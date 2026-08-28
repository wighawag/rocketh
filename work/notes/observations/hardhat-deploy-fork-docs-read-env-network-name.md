---
title: 'The hardhat-deploy fork-testing guide reads `env.network.name`, which does not exist'
type: observation
status: spotted
spotted: 2026-08-28
---

Spotted while writing `documentation/fork-runs/`: `hardhat-deploy/documentation/how-to/use-fork-testing/index.md` destructures `const {name: networkName} = env.network;`, but `Environment['network']` (`packages/rocketh-core/src/types.ts`) carries `chain`, `provider`, `fork`, `deterministicDeployment` and a backward-compatible `tags`, and no `name`. The environment name is `env.name`, so that snippet logs `undefined`.
