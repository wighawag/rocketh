---
'hardhat-deploy': minor
---

New subpath `hardhat-deploy/extensions`, hardhat-deploy as a rocketh extension. Spread it into `extensions` (`import * as hardhatExtension from 'hardhat-deploy/extensions'`) and deploy scripts get `env.hardhatConnection`, the Hardhat network connection of the run typed `NetworkConnection | undefined`, and `env.getHardhatConnection()`, which returns it or throws when called in a run without one. Neither breaks a run that has no connection (the `rocketh` command, a test fixture that passes only a provider): the property is `undefined`, and the method only throws in the script that calls it. A fixture passes the connection with `loadAndExecuteDeploymentsFromFiles({provider: connection.provider, extra: {connection}})`. `getHardhatConnection(env)` from the package root is unchanged, apart from an error that now says where the connection comes from; it was never usable as an extension, which is what the subpath is for.
