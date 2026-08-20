---
'@rocketh/core': patch
---

Remove the `./account` subpath export. It pointed at `./dist/account.js`, but there is no `src/account.ts` and nothing was ever emitted for it, so `import '@rocketh/core/account'` always failed to resolve. Nothing imported it. Account resolution is not a standalone helper: `resolveAccount` and `resolveAccountOrUndefined` are methods on `Environment` (`env.resolveAccount('deployer')`).
