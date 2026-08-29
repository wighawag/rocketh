# `ExecutionParams` still carries an untyped `network` alias

2026-08-29 — spotted while removing the `options as ExecutionParams` cast from the `@rocketh/node` CLI.

`getEnvironmentName` (`packages/rocketh/src/executor/index.ts`) reads `executionParams.environment || (executionParams as any).network`, but `network` is not a field of `ExecutionParams` (`packages/rocketh-core/src/types.ts`) and nothing in the repo passes it. It is an undocumented legacy alias kept alive by a cast, which is the same class of hole the CLI's blanket cast turned out to be: a caller passing `network` gets an environment nobody's types mention, and a caller passing a wrong shape gets no complaint. Either declare it (deprecated) or drop it; not investigated here.
