# Migration pairs: hardhat-deploy v1 scripts, and their rocketh ports, executed

Each pair is a hardhat-deploy v1 file and its rocketh port, side by side: `deploy/01_token.v1.ts` next to `deploy/01_token.ts`. The **rocketh half is compiled** by `pnpm typecheck` and **run** by `pnpm test` (the `*.pairs.test.ts` files here), and every test checks an outcome a reader cares about: the contract that was deployed, which proxy contract landed, the upgrade call that was sent. The **v1 half is reference text**: it is written against hardhat-deploy v1.0.4, whose option types it was checked against, and it is excluded from compilation (`tsconfig.json`) because v1 is not installed here and must not be.

The migration skill, `skills/hardhat-deploy-migration/SKILL.md`, teaches from these files. Its code blocks are copies, each preceded by a `<!-- migration-pair: <file> -->` marker, and `skill.test.ts` fails when a copy and its file differ, or when a pair is neither included nor named by the skill. When you change a pair, copy the file into the skill; when the skill looks wrong, fix the pair first.

## Reading it as a project

The folder is laid out as a miniature rocketh project, so every import in a rocketh half is the one a user writes:

- `rocketh/config.ts`: the accounts (the rocketh half of the named-accounts pair) and the extensions.
- `rocketh/deploy.ts`: `deployScript` and `artifacts`, exactly as in a real project.
- `deploy/`: the deploy scripts. They are a GALLERY, not one deployment: each test runs the scripts of one pair against a fresh chain. `07b_diamond_with_new_facet.ts` is `07a_diamond.ts` after an edit, not a second script.
- `test/fixtures.ts`: a test fixture, the rocketh half of the tagged-fixture pair.

Two files are not what a user writes, and say so at the top: `mock-artifacts.ts` stands in for the compiled contracts (mock bytecode, real ABIs), and `rocketh/environment.ts` stands in for `@rocketh/node`'s file loader, handing the same scripts to rocketh's real executor over an in-memory store. `harness.ts` is the test's node: `createTestEnvironment` from `@rocketh/test-utils` plus the bit of chain state the scripts read back.

## The pairs

| Topic                                         | v1 half                                 | rocketh half                         |
| --------------------------------------------- | --------------------------------------- | ------------------------------------ |
| Plain deploy, constructor args, named account | `deploy/01_token.v1.ts`                 | `deploy/01_token.ts`                 |
| Linked libraries                              | `deploy/02_calculator.v1.ts`            | `deploy/02_calculator.ts`            |
| Deterministic (create2) deploy                | `deploy/03_registry.v1.ts`              | `deploy/03_registry.ts`              |
| The five built-in proxy kinds                 | `deploy/04{a..e}_*.v1.ts`               | `deploy/04{a..e}_*.ts`               |
| Proxy `execute: {init, onUpgrade}`            | `deploy/05_vault.v1.ts`                 | `deploy/05_vault.ts`                 |
| Proxy upgrade with `upgradeIndex`             | `deploy/06{a,b}_*.v1.ts`                | `deploy/06{a,b}_*.ts`                |
| Diamond deploy, and a cut                     | `deploy/07{a,b}_*.v1.ts`                | `deploy/07{a,b}_*.ts`                |
| `execute` and `read` by deployment name       | `deploy/08_greeter.v1.ts`               | `deploy/08_greeter.ts`               |
| Run-once (`id` + `return true`)               | `deploy/09_seed_deployer_balance.v1.ts` | `deploy/09_seed_deployer_balance.ts` |
| `skip`, replaced by an early return           | `deploy/10_faucet.v1.ts`                | `deploy/10_faucet.ts`                |
| Per-network named accounts, with `null`       | `hardhat.config.v1.ts`                  | `rocketh/config.ts`                  |
| A tagged fixture in a test                    | `test/Token.v1.ts`                      | `test/fixtures.ts`                   |

`skill.test.ts` holds the same list as data and checks it against the folder, so a v1 file without a pair fails the suite.
