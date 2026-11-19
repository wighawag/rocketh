---
'@rocketh/playground': patch
---

Depend on `webevm` `^0.9.1` instead of `^0.5.0`, so a page that also uses a current `webevm` installs one copy rather than two. `createPlaygroundChain` needed no change: the options it passes (`chainId`, `miningConfig: {type: 'auto'}`, `initialBalances`) and the `SlimNode` methods it calls (`request`, `dispose`) are unchanged in 0.9.
