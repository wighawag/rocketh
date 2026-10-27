---
'@rocketh/deploy': patch
---

`computeDeterministicAddress` now types its arguments with `ConstructorArgs<TAbi>`, a type `@rocketh/deploy` exports, instead of viem's `ContractConstructorArgs` directly. A project with `declaration: true` that spreads `@rocketh/deploy` into its extensions without importing `viem` itself failed to type-check under pnpm with TS2883 ("The inferred type of 'extensions' cannot be named without a reference to 'ContractConstructorArgs'"). The accepted values are unchanged.
