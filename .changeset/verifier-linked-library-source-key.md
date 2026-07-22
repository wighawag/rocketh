---
'@rocketh/verifier': patch
---

Fix Etherscan verification for contracts that link to libraries (issue #49). The `libraries` block of the `solidity-standard-json-input` payload is now keyed by each library's defining source file (matching the Solidity standard-json spec and `@nomicfoundation/hardhat-verify`), instead of by the consuming contract's `<file>:<name>` path. The defining source is resolved by scanning `metadata.sources` (preferring structured AST data when available, falling back to a `library <Name>` declaration in the source content). Verification fails with a clear error when a linked library cannot be resolved, rather than silently sending a malformed payload.
