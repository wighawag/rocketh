---
'@rocketh/proxy': minor
'@rocketh/core': minor
'rocketh': minor
---

A proxied deployment's `<name>` record carries `implementation` again: the address of the implementation the record describes, as established by the run that wrote it (deployed with, upgraded to, or read from the EIP-1967 slot), never a live reading of the chain. An upgrade deferred to an unsignable owner leaves it on the old implementation. A record written before this change gains the field on the next run that reaches the proxy, without moving `numDeployments`, through the new `keepNumDeployments` option of `env.save`.
