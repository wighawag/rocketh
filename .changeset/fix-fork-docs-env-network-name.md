---
---

Fix a snippet that logged `undefined`: the hardhat-deploy fork-testing guide and a JSDoc example in `setupDeployScripts` both read `env.network.name`, which does not exist. `Environment['network']` carries `chain`, `provider`, `fork` and `deterministicDeployment`; the environment name is `env.name`. The fork-testing example now also shows the distinction that matters on a fork, since the environment name IS the forked network's while the chain the node reports is what every transaction declares. Documentation and comments only; no package code and no behaviour changes.
