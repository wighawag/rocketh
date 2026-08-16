---
'@rocketh/node': patch
---

Remove the dead environment-injection block in `readConfig`.

It built an environment entry for every canonical viem chain name and then threw the result away: the returned config only ever overrode `chains`, so the map was never read. It has been unwired since it was introduced, so removing it changes no behaviour.

It is removed rather than finished because the design it implemented was rejected on purpose: an auto-injected environment carries viem's public default rpc, those endpoints go stale, and `@rocketh/export` serializes chain info into frontend builds, so a dead public endpoint ended up shipped inside a web app. The reason now lives next to the code and in `docs/adr/0010-environments-stay-explicit.md`, so that unwired code no longer reads as an oversight waiting to be completed.
