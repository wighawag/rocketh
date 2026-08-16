---
'@rocketh/test-utils': patch
'@rocketh/playground': patch
'@rocketh/verifier': patch
'hardhat-deploy': patch
'@rocketh/export': patch
'@rocketh/node': patch
'@rocketh/doc': patch
'@rocketh/web': patch
---

Publish internal peer dependencies as `^` ranges instead of exact versions.

Every internal peer was declared `workspace:*`, which pnpm replaces at publish time with the exact version of the peer as it stood at that moment. `@rocketh/export@0.19.19` therefore shipped `peerDependencies: {"@rocketh/node": "0.19.18", "rocketh": "0.19.17"}`, and upgrading that one package forced a consumer to move `@rocketh/node`, `rocketh`, and then everything else pinning the same pair (`hardhat-deploy`, the proxy, router and verifier packages) in a single lockstep step. They are now `workspace:^`, which publishes as `^0.19.18` / `^0.19.17`, meaning `>=0.19.17 <0.20.0`: patch drift inside the 0.19 line is allowed, 0.20.0 is still refused.

The floor is unchanged, and that is the point. An exact pin and a caret share the same lower bound; they differ only in the ceiling, and a ceiling of "exactly the version that happened to be newest when this package was published" encodes publish timing rather than a compatibility fact. `updateInternalDependencies: "patch"` re-pins these on every release, so the pinned number moved even when the peer's API did not. The caret keeps the lower bound that actually carries meaning (a package needing a fix from its peer still refuses anything older) and drops the upper bound that never did.

Nine entries across eight packages changed: `hardhat-deploy` (`@rocketh/node`, `rocketh`), `@rocketh/doc` (`@rocketh/node`), `@rocketh/export` (`@rocketh/node`, `rocketh`), `@rocketh/node` (`rocketh`), `@rocketh/playground` (`rocketh`), `@rocketh/test-utils` (`rocketh`), `@rocketh/verifier` (`@rocketh/node`), `@rocketh/web` (`rocketh`). Each consumes named function or type exports of its peer rather than subclassing it, checking `instanceof` against it, or sharing module-level state with it, so none of them requires a single exact peer build. `@rocketh/viem`'s `viem: ^2.45.0` is external and was already a range.

**What this does NOT do.** Already-published versions keep the exact pins baked into their published `package.json`, and nothing can retroactively widen them. This only takes effect for versions published from this release onward. A project currently stuck on the cascade does not get unstuck by this change alone: it has to re-resolve onto releases that carry the new ranges, which in practice means upgrading the affected rocketh packages once more, after which single-package upgrades within the 0.19 line stop dragging the rest along.

Two related exact pins are deliberately left alone here and reported separately, because both change installation rather than only the peer constraint. `hardhat-deploy` declares `@rocketh/node` and `rocketh` as regular `dependencies` as well as peers, and a regular dependency pinned exact still forces a specific build, so widening only its peer does not by itself remove `hardhat-deploy` from the cascade. `@rocketh/core` is a regular `workspace:*` dependency of nearly every package and likewise publishes exact, so packages of different vintages can pull in several copies of it.
