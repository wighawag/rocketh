# Skill fixtures: the code of every user skill, compiled and run

The agent skills under `skills/` that teach rocketh users (every folder there except `hardhat-deploy-migration`, which teaches from `../migration-pairs/`) carry no code of their own: each TypeScript block in a skill's `SKILL.md` or `references/*.md` is a copy of a file in this folder, preceded by a marker naming it, and the harness fails the build when the copy and the file differ (ADR 0017).

````md
<!-- fixture: rocketh-deploy/deploy/01_token.ts -->

```ts
...the file, verbatim...
```
````

The files are **compiled** by `pnpm typecheck` (nothing here is excluded from `tsconfig.json`) and **run** by `pnpm test`, through the tests that sit next to them. When you change a fixture, copy it into the skill; when a skill looks wrong, fix the fixture first, and when the skill would say something no documentation page says, change the page first.

## Layout

- `<skill>/`: one folder per skill, named after it, laid out as a miniature rocketh project so every import is the one a user writes:
  - `rocketh/config.ts`: the accounts and the extensions.
  - `rocketh/deploy.ts`: `deployScript` and `artifacts`, as in a real project (the artifacts are the shared mocks, where a real project re-exports `generated/artifacts`).
  - `deploy/`: the deploy scripts the skill shows.
  - `*.test.ts`: the tests that run the scripts and assert what the skill claims.
  - `exports.json`: the identifiers the skill attributes to a package, `{"@rocketh/proxy": ["deployViaProxy"]}`. The harness checks each is exported by that package's root. No file is an empty table.
  - anything else the skill needs (baseline prompts in Markdown, for instance).
- `_shared/`: the helpers every skill's tests use, which no skill shows:
  - `artifacts.ts`: mock compiled contracts (real ABIs, placeholder bytecode).
  - `node.ts`: `createNode`, the test's node on `createTestEnvironment`, and the way to declare a named account of each signability (`node`, `impersonated`, `unsignable`, and `local` on its own `env`); `sent` lists what was broadcast.
  - `executor.ts`: `executeScripts`, which runs a skill's deploy scripts through rocketh's real executor over an in-memory store, so a re-run, a deferral and a run-once record can be asserted.

A skill task adds files only inside its own folder, so skill tasks can run in parallel. A helper that is missing goes in `_shared/`, in the smallest change.

## What the harness checks

`../skill-harness/harness.ts` holds the checks and `../skill-harness/skills.test.ts` runs them over every folder under `skills/`, discovered from the disk. A failure names the file and the rule:

| Rule                  | Applies to  | Asks                                                                                                                                                                                               |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixture-marker`      | user skills | every `<!-- fixture: <path> -->` is followed by a fenced block equal to `<path>` under this folder                                                                                                 |
| `unmarked-typescript` | user skills | every TypeScript block is marked                                                                                                                                                                   |
| `unused-sample`       | this folder | every sample (a TypeScript file of `<skill>/` that is not a test) is included or named by some skill                                                                                               |
| `fixture-folder`      | this folder | every folder but `_shared/` is named after a skill                                                                                                                                                 |
| `link`                | every skill | every `https://rocketh.dev/<path>/#<anchor>` resolves to `<path>/index.md` and a heading of it (`rocketh.dev/skills/` and raw GitHub links are exempt)                                             |
| `flag`                | every skill | every `--flag` in a shell block is an option of the command on its line: `rocketh`, `hardhat deploy` (plus Hardhat's globals), `rocketh-export`, `rocketh-verify`, `rocketh-doc`, `hardhat-deploy` |
| `frontmatter`         | every skill | it parses, `name` is the folder, `description` is 1 to 1024 characters; for a user skill, the body is under 500 lines and `metadata.rocketh` is a `>=` range not above `packages/rocketh`          |
| `export-name`         | user skills | every name in `<skill>/exports.json` is exported by that package's root                                                                                                                            |

The harness proves itself on a throwaway skill in `../skill-harness/example/`, which exists only for its own tests.
