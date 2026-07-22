---
'@rocketh/verifier': patch
---

Resolve each linked library's defining source path from the compiler `linkReferences` (and `deployedLinkReferences`) that rocketh already persists on the deployment, before falling back to the `metadata.sources` heuristic. These maps are keyed by the defining source file, so the standard-json `settings.libraries` key sent to Etherscan now comes straight from the compiler rather than being reconstructed by AST-walking or regex-scanning source content. This makes verification of contracts that link to libraries more robust (no ambiguity when a `library <Name>` token also appears in a comment or an unrelated file); the previous `metadata.sources` scan remains as a fallback for older deployments that carry no usable `linkReferences`.
