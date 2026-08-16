---
'@rocketh/playground': patch
---

First real release of the documentation playground: a `<rocketh-playground>` custom element that boots an EVM in the reader's browser and walks four real rocketh deploy scripts, deploying a contract behind a proxy, exposing the bug a constructor cannot avoid, upgrading the implementation, and showing that an upgrade replaces code rather than storage.

The `0.0.0` on the registry was published by hand to bootstrap npm Trusted Publishing, which cannot create a new package. This is the first version to carry the actual widget.
