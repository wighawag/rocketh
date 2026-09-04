# Contributing

Thanks for considering it. This repository is the home of `rocketh`, the `@rocketh/*` packages and `hardhat-deploy`, all released together so they stay tested against each other.

This project is maintained by one person. That shapes what is realistic here: you will get an honest answer rather than a fast one, and a small, well-argued change lands far more easily than a large one.

## Where things go

- **Bugs and feature requests:** [open an issue here](https://github.com/wighawag/rocketh/issues/new/choose), including for `hardhat-deploy`. The `wighawag/hardhat-deploy` repository keeps the brand and the history, but development happens here.
- **Questions and ideas:** [Discussions](https://github.com/wighawag/rocketh/discussions).
- **Security vulnerabilities:** do not open an issue. Follow [SECURITY.md](./SECURITY.md) and open a private advisory.

## Getting set up

Node 22.14.0 (pinned via Volta) and pnpm 10.28.1 (pinned via `packageManager`).

```bash
pnpm install
pnpm build
pnpm test
```

Useful during development:

```bash
pnpm test:watch        # vitest in watch mode
pnpm test:coverage     # coverage report
pnpm typecheck         # tsc --noEmit across every package
pnpm format            # prettier --write .
pnpm format:check      # what CI checks
pnpm verify:artifacts  # rebuild vendored Solidity and compare to committed artifacts
```

`pnpm reset` (`git clean -fdX` plus a reinstall) is the escape hatch when the workspace gets into a state you do not want to debug.

## Before you open a pull request

1. `pnpm test` passes.
2. `pnpm typecheck` passes.
3. `pnpm format:check` passes. Formatting is Prettier's job, not a review topic.
4. If you touched the Solidity under `packages/rocketh-diamond/` or `packages/rocketh-proxy/`, `pnpm verify:artifacts` passes. Those sources determine the addresses and the code of the default diamond and proxy contracts, so the committed artifacts must equal a rebuild.
5. You added a changeset (see below), unless the change ships nothing to users.

## Tests are the argument

A bug report with a failing test against this repository is the most persuasive thing you can send. `@rocketh/test-utils` builds a real environment against a mock provider, so most paths can be reproduced without running a node.

Two kinds of test live here, both under each package's `src`:

- `*.test.ts` for units.
- `*.integration.test.ts` for realistic usage. These double as documentation, so write them to be read. See [TESTING.md](./TESTING.md).

## Changesets

Releases are driven by [changesets](https://github.com/changesets/changesets). If your change affects a published package, run:

```bash
pnpm changeset
```

Select the affected packages, pick a bump, and write the entry for someone upgrading rather than for someone reading the diff. Commit the generated file with your change.

The project is pre-1.0 and stays there deliberately; a changeset that would graduate a package to 1.0 is rejected by `pnpm changeset:check-graduation`.

## Things worth knowing before proposing a design

`SECURITY.md` records what this project is for the purpose of a threat model, and several accepted properties with their reasoning. The short version: rocketh is deployment **orchestration**. It constructs transactions, records what it deployed, and refuses to repeat work already done. It is not the authority that **authorizes** a privileged change to a live contract, and proposals to make it one will not be accepted.

Releases are published from `.github/workflows/release.yml` through npm trusted publishing (OIDC, no long-lived token) with provenance. Changes to the release pipeline are treated as security-sensitive.

## Code of Conduct

Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Licence

Contributions are accepted under this repository's [MIT licence](./LICENSE).
