# Playground examples

Each folder here is a small project that a sample on [rocketh.dev](https://rocketh.dev) stands for, and that the sample's "Open in playground" button opens in the [playground](https://play.rocketh.dev).

## What an example holds

An example holds **only the files that differ from the playground's starting project**. That starting project is the published `hardhat-deploy init` template (its source is `packages/hardhat-deploy/templates/basic/`), and the playground writes the example's files over it. So:

- Add what the sample needs and the starting project lacks: its contracts in `contracts/`, its deploy scripts in `deploy/`, and `rocketh/config.ts` only when the sample uses an extension the starting config does not register (it registers `@rocketh/deploy`, `@rocketh/read-execute`, `@rocketh/viem` and `@rocketh/unknown-signer`). A replaced `rocketh/config.ts` starts from the starting project's and adds the extension, so it stays recognisable.
- **The starting project's own files stay.** Its `contracts/Counter.sol` is still compiled and its `deploy/01_deploy_counter.ts` still runs on Deploy, unless the example has a file at the same path, which replaces it.
- Contracts are self-contained: the playground compiles `contracts/` with no import callback, so a Solidity import of a package (OpenZeppelin, forge-std) does not resolve there. An import of another file of the project does.
- No `package.json`: an example uses the starting project's packages.

**Every example must deploy on a fresh chain with the starting config's accounts** (`deployer` is account 0, `admin` account 1), with nothing deployed before it but what its own scripts and the starting project's scripts deploy. A sample that needs a fork, an account rocketh cannot sign for, or artifacts from a package does not get an example.

## Marking a sample

A sample on a page of the site (`index.md`, `documentation/`, `hardhat-deploy/`) is marked with the example file it stands for, in its fence's info string, after the language:

````markdown
```typescript playground=greetings-registry/deploy/001_deploy_greetings_registry.ts
// the content of examples/playground/greetings-registry/deploy/001_deploy_greetings_registry.ts
```
````

The value is `<example>/<path in the example>`. The fence's body must equal that file byte for byte (the file may end with the newline a fence drops), so write the sample once and copy it into the example, or the other way round.

## The checks

- `pnpm test` fails when a marked fence names a file that does not exist, or differs from it, naming the page, the line and the file (`scripts/playground-examples.ts`).
- `pnpm test:docs:playground-examples` deploys every example against the PUBLISHED packages: the released `hardhat-deploy init` template in a temporary folder, the example's files over a clean copy of it, then `pnpm hardhat compile` and `pnpm hardhat deploy` on the in-memory network (`scripts/test-playground-examples.sh`). Name examples to run only those: `pnpm test:docs:playground-examples greetings-registry`. CI runs it on a pull request that touches `examples/playground/` or a marked page, and after every release and daily, because the playground runs released packages: a sample that uses an option not released yet fails here, before a reader opens it.
