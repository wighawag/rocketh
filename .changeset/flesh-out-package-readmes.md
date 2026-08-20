---
'@rocketh/core': patch
'@rocketh/deploy': patch
'@rocketh/diamond': patch
'@rocketh/doc': patch
'@rocketh/export': patch
'@rocketh/node': patch
'@rocketh/playground': patch
'@rocketh/proxy': patch
'@rocketh/read-execute': patch
'@rocketh/test-utils': patch
'@rocketh/viem': patch
---

Point the playground README at the documentation's new URL, and replace the six-line stub READMEs with real package documentation: what the package is for, how to wire it into `rocketh/config.ts`, a worked example, an option reference, and the gotchas that are easy to get wrong (proxy initializers running through `execute`, a diamond's facet set being declarative so a removed entry removes selectors on chain, `@rocketh/viem` writes bypassing the managed broadcast path, an empty export being an error rather than a no-op).
