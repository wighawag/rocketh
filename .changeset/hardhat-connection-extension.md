---
'hardhat-deploy': minor
---

New subpath `hardhat-deploy/extensions`, hardhat-deploy as a rocketh extension: spread it into `extensions` (`import * as hardhatExtension from 'hardhat-deploy/extensions'`) and deploy scripts read `env.hardhatConnection`, the Hardhat network connection of the run, typed `NetworkConnection | undefined`. It is `undefined`, never an error, in a run without one (the `rocketh` command, a test fixture that passes only a provider), so the same scripts keep running everywhere. A fixture passes the connection with `loadAndExecuteDeploymentsFromFiles({provider: connection.provider, extra: {connection}})`. `getHardhatConnection(env)` stays the throwing form for scripts that require Hardhat, and its error now says where the connection comes from and points at the extension; it was never usable as an extension.
