---
'hardhat-deploy': patch
---

Declare `rocketh` and `@rocketh/node` as peers only, not also as dependencies.

`hardhat-deploy` listed both in `dependencies` AND `peerDependencies`. Because `workspace:*` publishes as an exact version, the dependency entries shipped as `rocketh@0.19.17` and `@rocketh/node@0.19.18`, and a regular dependency pinned exact is more binding than a peer: it forces that specific build regardless of what the project already has. Widening the peers to `^` therefore did not, on its own, take `hardhat-deploy` out of the lockstep upgrade it was contributing to.

Worse, the exact dependency actively caused duplication. The documented install and the `init` template both give the user `rocketh` and `@rocketh/node` as their own direct dependencies at `^0.19.x`, so a project that had resolved to a newer patch got a SECOND, nested copy of each pinned to the older exact version, with `hardhat-deploy`'s helpers running against different module instances than the user's own deploy scripts and config.

Peers are the correct declaration here. The user provides these: `npm install -D hardhat-deploy rocketh @rocketh/node …` is the documented install, the scaffolded template lists both, and the user's own `rocketh/config.ts`, `rocketh/deploy.ts` and `rocketh/environment.ts` import from them directly. They must resolve to one shared instance, which is exactly what a peer expresses and what a dependency does not. This also brings `hardhat-deploy` in line with the other seven packages that declare an internal peer, all of which already use devDependency plus peerDependency; `hardhat-deploy` was the only one using dependency plus peerDependency. They are now devDependencies here, so the package still builds and tests in the workspace.

The `hardhat-deploy init` CLI and the postinstall notice are unaffected: both import only Node builtins and `commander`, so `npx hardhat-deploy init` still works standalone, before any project or peer exists.

Anyone following the documented install or using the template already declares both and sees no change. A project that installed `hardhat-deploy` alone and relied on the transitive copy will have the peers auto-installed by npm 7+ and pnpm 8+, but package managers that do not auto-install peers (Yarn Berry) will now report them as missing and need them added explicitly.
