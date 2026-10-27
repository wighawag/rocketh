---
'@rocketh/deploy': patch
---

Re-export viem's `ContractConstructorArgs` type, which `computeDeterministicAddress`'s signature uses. A project with `declaration: true` that spreads `@rocketh/deploy` into its extensions without importing `viem` anywhere itself failed to type-check under pnpm with TS2883 ("The inferred type of 'extensions' cannot be named without a reference to 'ContractConstructorArgs'"), because TypeScript could not find a portable way to name the type.
