---
'@rocketh/playground': patch
---

Follow the `embedded-eth-node` rename to `webevm`.

The in-browser EVM the playground runs deploy scripts against was republished under a new name: `embedded-eth-node@0.4.0` is now `webevm@0.5.0`, from `github.com/wighawag/webevm`. The dependency, the import in `core/chain.ts`, the Vite external patterns and the prose references all move across.

It is a rename and nothing more, which was checked rather than assumed: normalising the package name in the published `dist/*.js` of both versions makes them byte-identical, the export subpaths (`.`, `./revm`, `./worker-entry`, `./worker-host`, `./worker-client`) match, `createNode` and `SlimNode` are still the entry points, and the `.d.ts` differences are confined to doc comments naming the package.

The one behavioural consequence is the default IndexedDB database name, which follows the package name from `'embedded-eth-node'` to `'webevm'`. That only matters to a browser app relying on the default, and `@rocketh/web` keeps its own default of `'rocketh'`, so the two still do not collide. The comment in `@rocketh/web`'s `createIndexedDBPersistence` that cited the old default is corrected.

The version floor is unchanged in substance: `webevm@0.5.0` continues the version line, so the `>= 0.4.0` requirement (for an `eth_estimateGas` that returns a usable gas limit rather than gas consumed, which the deterministic `CREATE2` deploy depends on) is now `>= 0.5.0`.
