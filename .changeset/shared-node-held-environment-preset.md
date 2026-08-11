---
'@rocketh/test-utils': minor
---

Export `createNodeHeldEnvironment`, plus `STANDARD_NAMED_ACCOUNTS` and `NODE_HELD_ACCOUNTS`: the commonest test setup there is (three named accounts declared as bare addresses, all held by the node, so everything is signable). The same fixture triple was being redeclared verbatim in `@rocketh/deploy`'s, `@rocketh/proxy`'s and `@rocketh/diamond`'s suites. It is a PRESET, not a second builder: it takes no options and returns exactly what `createTestEnvironment` returns, so anything further from the default should keep calling `createTestEnvironment` directly and say so.
