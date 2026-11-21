---
'@rocketh/router': minor
---

`deployViaRouter` now deploys solidity-proxy 0.6's `Router` by default instead of `Router10X60`: up to 256 routes and as many selectors as the init code limit allows (about 1,460 from Shanghai on), its routes kept in a data contract so Etherscan, Sourcify and Blockscout all verify it, at about `Router10X60`'s gas a call. `routerContract` now also takes a name, `'Router'`, `'InlineRouter'` (the cheapest to call and deploy, verifiable by its creation code only) or `'Router10X60'`, besides `{type: 'custom', artifact}`, whose ABI may be any of the three; an unknown name fails before anything is deployed. An `extraABIs` function is no longer put in the router's selector map, which named an implementation that does not exist. The JSON artifacts under `@rocketh/router/artifacts/` are the three routers of solidity-proxy 0.6.0 (the one shipped before was 0.5.2's `Router10X60`, which misrouted selectors 48 to 59).

The router's bytecode changes whichever one you name (`Router10X60` was rebuilt by solidity-proxy 0.5.3), so the next deploy of an existing router-fronted deployment deploys a new router and, behind a proxy, upgrades the proxy to it.
