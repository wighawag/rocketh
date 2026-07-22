---
title: Fix Etherscan verification for contracts using linked libraries
slug: verifier-linked-library-source-key
issue: 49
origin: issue
originTrust: untrusted
covers: []
blockedBy: []
---

## What to build

Fix the `libraries` section of the `solidity-standard-json-input` payload that `@rocketh/verifier` sends to Etherscan so that contracts (and libraries) which link to other deployed libraries verify successfully.

Today, in `packages/rocketh-verifier/src/etherscan.ts` (~L246-L254), every linked library address is nested under the *consuming* contract's source path (`contractNamePath`):

```ts
settings.libraries[contractNamePath][libraryName] = deployment.libraries[libraryName];
```

Etherscan rejects this shape. It expects the top-level key to be the source file where the library itself is **defined**, matching what `@nomicfoundation/hardhat-verify` (and the Solidity standard-json spec) emit:

```json
"libraries": {
  "contracts/Math.sol": { "Math": "0x1552..." }
}
```

Resolve each linked library name to its defining source path (available in the deployment's compilation metadata — iterate `metadata.sources` and pick the source whose content declares `library <LibraryName>`, or use any richer source-unit info already in the artifact) and key `settings.libraries` by that path instead of by `contractNamePath`.

## Acceptance criteria

- `settings.libraries` in the Etherscan payload is keyed by the source path where each library is **defined**, not by the consuming contract's path.
- Verifying a contract (or a library) that links to one or more previously-deployed libraries succeeds on Etherscan (the scenario from https://github.com/tuler/hardhat-deploy-etherscan-library: `Math -> Util -> Greeter`).
- Contracts with no linked libraries still verify unchanged.
- If a library name cannot be resolved to a source path, verification fails with a clear error rather than silently sending a malformed payload.
- Integration test in `packages/rocketh-verifier/test/` covers the linked-library payload shape (assert the emitted `solcInput.settings.libraries` shape for a deployment whose `libraries` field is populated).

## Prompt

Update `packages/rocketh-verifier/src/etherscan.ts` so the `libraries` block of the standard-json input is keyed by each library's defining source file (matching the Solidity standard-json spec and what `@nomicfoundation/hardhat-verify` sends), instead of by the consuming contract's `contractNamePath`. Resolve the defining source by scanning `metadata.sources` for a `library <name>` declaration (fall back to any structured source-unit data if available on the artifact). Add an integration test asserting the payload shape for a deployment with linked libraries. Reference: issue #49 comments #2, #7, and jdbertron's confirmed fix in #15.
