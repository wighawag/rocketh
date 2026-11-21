# Playground examples

Each folder here is a small project that a sample on [rocketh.dev](https://rocketh.dev) stands for, and that the sample's "Open in playground" button opens in the [playground](https://play.rocketh.dev).

## What an example holds

An example holds **only the files that differ from the playground's starting project**. That starting project is the published `hardhat-deploy init` template (its source is `packages/hardhat-deploy/templates/basic/`). The playground opens an example on the starting project without its `Counter` sample (the link's bare base) and writes the example's files over that. So:

- Add what the sample needs and the starting project lacks: its contracts in `contracts/`, its deploy scripts in `deploy/`, and `rocketh/config.ts` only when the sample uses an extension the starting config does not register (it registers `@rocketh/deploy`, `@rocketh/read-execute`, `@rocketh/viem` and `@rocketh/unknown-signer`) or a named account it does not declare (it declares `deployer` and `admin`). A replaced `rocketh/config.ts` starts from the starting project's and adds the extension or the account, so it stays recognisable. An added account is one of the in-memory network's own, so rocketh can sign for it.
- **An example opens without the starting project's `Counter` sample.** Its `contracts/Counter.sol` and `deploy/01_deploy_counter.ts` are not there, so nothing is compiled or deployed but the example's own contracts and scripts. The example keeps the starting `rocketh/config.ts` and `rocketh/deploy.ts` unless it has its own, which replace them. An example that wants `Counter` carries the files itself.
- Contracts are self-contained: the playground compiles `contracts/` with no import callback, so a Solidity import of a package (OpenZeppelin, forge-std) does not resolve there. An import of another file of the project does.
- No `package.json`: an example uses the starting project's packages, and declares any other package by importing it. A package an example's files import that the starting project's `package.json` lacks (`@rocketh/diamond`, say, which `counter-diamond/rocketh/config.ts` imports) is added to it: at its latest published version by the deploy check below, at the version the tab ran by the playground's Download.

**Every example must deploy on a fresh chain with the in-memory network's accounts** (the starting config's `deployer` is account 0, `admin` account 1), with nothing deployed before it but what its own scripts deploy. A sample that needs a fork, an account rocketh cannot sign for, or artifacts from a package does not get an example.

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
- `pnpm test:docs:playground-examples` deploys every example against the PUBLISHED packages: the released `hardhat-deploy init` template in a temporary folder, a clean copy of it without the four `Counter` files (`contracts/Counter.sol`, `deploy/01_deploy_counter.ts`, `contracts/Counter.t.sol` and `test/Counter.ts`, failing and naming the file when the template lacks one of them, so a template change is noticed), the example's files over that copy, with every package the example imports that the template lacks added to its `devDependencies` at its latest published version and installed (`scripts/playground-example-packages.ts`), then `pnpm hardhat compile` and `pnpm hardhat deploy` on the in-memory network (`scripts/test-playground-examples.sh`). Name examples to run only those: `pnpm test:docs:playground-examples greetings-registry`. CI runs it on a pull request that touches `examples/playground/` or a marked page, and after every release and daily, because the playground runs released packages: a sample that uses an option not released yet fails here, before a reader opens it.
