---
'@rocketh/core': minor
'rocketh': minor
---

`env.network.fork` now says WHICH network the run simulates instead of "the environment argument was not a string". A run given `{fork: 'mainnet'}` reports `{networkName: 'mainnet'}`, with the forked network's `chainId` when it is known (supplied with the fork input, else declared as `environments['mainnet'].chain`) and absent when neither source said, rather than borrowing the connected node's id. A run with no environment, which is the in-memory default, is no longer flagged as a fork. The field stays absent (falsy) off a fork, so `if (env.network.fork)` reads exactly as before, and a fork still loads the forked network's deployment records by skipping the chain-identity check at load time.
