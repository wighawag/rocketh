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

## The documentation site

[rocketh.dev](https://rocketh.dev) is built from this repository's Markdown: `index.md`, `documentation/` and `hardhat-deploy/`, with `public/` for the logos and social cards and a `_sidebar.yaml` per section for the sidebar order. A page is plain Markdown that reads on GitHub too. The site's code is a separate repository, [wighawag/rocketh-website](https://github.com/wighawag/rocketh-website), so a change to a page is a pull request here and a change to how the site works is one there.

To preview a change, clone the site next to this repository once, then run it from here:

```bash
git clone https://github.com/wighawag/rocketh-website ../rocketh-website

pnpm docs:dev       # dev server, with hot reload and search
pnpm docs:build     # static build in ../rocketh-website/web/build
pnpm docs:preview   # serve that build
```

Each builds the playground (`packages/rocketh-playground`) first, so the page shows the widget of this checkout, and points the site at this checkout, so a worktree previews its own content. `ROCKETH_WEBSITE_DIR` names a site checkout somewhere else. `pnpm docs:build` fails on a dead link or an `#anchor` that is not on its page; the deploy workflow runs the same build on a pull request that touches the content.

### Pages that are run as tests

The pages that build a project from scratch are executed with [ezx](https://www.npmjs.com/package/ezx), so they cannot drift from what works:

```bash
pnpm test:getting-started           # README.md, "Getting Started" (hardhat-deploy, by hand)
pnpm test:docs:without-hardhat      # documentation/getting-started/ (forge, anvil, the rocketh CLI)
pnpm test:docs:hardhat-deploy-init  # hardhat-deploy/getting-started/, "With hardhat-deploy init"
pnpm test:docs                      # all three
```

They run through `scripts/test-doc.sh`, whose header explains what it guards against: it builds the workspace first, scaffolds inside the repository so the project links to this checkout (ADR 0008) and restores `pnpm-lock.yaml`, kills everything the page started (the anvil node included), and runs `hardhat-deploy init` outside the repository because that page only uses released packages. Each needs network access, and `test:docs:without-hardhat` needs [Foundry](https://getfoundry.sh) (`forge` and `anvil`) and port 8545 free. Where forge cannot install solc itself (NixOS), point it at a solc 0.8.28 binary, for example the one Hardhat caches: `FOUNDRY_SOLC=~/.cache/hardhat-nodejs/compilers-v3/linux-amd64/solc-linux-amd64-v0.8.28+commit.7893614a pnpm test:docs:without-hardhat`.

When editing such a page, keep to ezx's conventions: a `bash` block runs, `> file: <path>` before a block writes that file, a word after the language (`bash [npm] skip`) stops a block from running, `> async:` before a block runs it in the background, `bash sleep:2` waits first, and `# set the current directory` before a `cd` makes later blocks run there. The site ignores everything after the language except a `[label]`, so these read normally on rocketh.dev and on GitHub. Two pitfalls: a code block containing a backtick or `${` breaks ezx (it wraps each block in a JavaScript template string), and a `typescript` block without `> file:` is executed as JavaScript.

**Moving or removing a page** keeps its old address working: add the old address to `_redirects.yaml`, at the root of this repository, in the same pull request, forwarded to where the content went (a key with an `#anchor` forwards one section of a split page on its own). The build fails when a target is not a page or lacks the anchor named, and rocketh-website's end-to-end suite checks every address the site has served. An address must never simply disappear: links to it live in npm READMEs, other repositories and search engines.

`.github/workflows/deploy.yml` deploys on every push to `main`, building the commit of rocketh-website it pins in `ROCKETH_WEBSITE_REF`. A change to the site goes live through a pull request here that moves that pin.

## The playground (`@rocketh/playground`)

The widget of the introduction page, built from `packages/rocketh-playground`. What follows is for working on it; its README is for using it.

### How the docs site consumes it

The site ([wighawag/rocketh-website](https://github.com/wighawag/rocketh-website)) imports the built `dist` of this package from the rocketh checkout it renders, never an npm release, so the widget on a page is always the one of the same commit. It has to be built first, which is wired into the docs scripts themselves rather than left to CI, so a fresh clone works:

```jsonc
"docs:widgets": "nx build @rocketh/playground", // builds this package and its workspace deps
"docs:dev": "pnpm docs:widgets && tsx scripts/docs-site.ts dev",
"docs:build": "pnpm docs:widgets && tsx scripts/docs-site.ts build",
```

Without it, the site's build stops with `rocketh-playground: .../dist/element/rocketh-playground.js does not exist`, rather than deploying a page whose widget never loads.

`docs:widgets` runs ONCE when the dev server starts. While iterating on the core or the components, run `pnpm --filter @rocketh/playground dev` alongside it to rebuild on change.

### Publishing

Published as `@rocketh/playground`. The docs site does not go through the registry (it consumes the build in the rocketh checkout), so a release only matters for outside consumers embedding the widget.

Two things about this repo's release flow bit us once each, and both are worth knowing before you touch versioning here:

- **npm Trusted Publishing (OIDC) cannot create a brand-new package.** npm ties a trusted publisher to an already-existing package, so the first publish of any new package in this repo has to be done by hand (`npm publish --access public`) and the trusted publisher registered on npmjs.com afterwards. Until that is done, `changeset publish` fails the entire release job with `E404 Not Found - PUT /@rocketh%2f<name>`, taking the other packages' release down with it.
- **An empty changeset sitting on `main` silently blocks publishing.** `changesets/action` takes the version/PR path whenever any changeset file exists. If every one of them is empty it logs `All changesets are empty; not creating PR` and exits WITHOUT publishing, so a package whose version is ahead of the registry stays unpublished with a green release job. The publish path only runs when there are no changeset files at all. So an empty changeset needs a real one alongside it, or it has to be consumed, before anything can ship.

### The contracts it deploys

Two implementations of the same registry, behind one proxy.

| Implementation        | Origin                                                     | Regenerate with          |
| --------------------- | ---------------------------------------------------------- | ------------------------ |
| `GreetingsRegistry`   | vendored verbatim from `template-ethereum-contracts@0.0.3` | `pnpm artifact:sync`     |
| `GreetingsRegistryV2` | ours, in `contracts/`                                      | `pnpm contracts:compile` |

The origins differ on purpose. v1 is kept exactly as published so its provenance stays "the real template contract", bug included. The template has no v2, so that one is ours, and its source lives in `contracts/` precisely so the code the tutorial **shows** is provably the code it **runs**.

`contracts:compile` shells out to `solc` and is **not** an npm dependency, the same way `artifact:sync` shells out to `npm` and `tar`. Artifacts are committed, so you only need solc to change a contract, never to use the package.

#### The bug, and why it stays

v1 passes a `"proxy:"` prefix to its **constructor**, and greetings read back without it. That is not a bug in rocketh or in the proxy, and it is deliberately not fixed: a constructor runs against the _implementation's_ storage, never the proxy's, so the proxy's own `_prefix` slot is never written. v2 fixes it by setting the prefix through a `postUpgrade` call that rocketh makes **through the proxy** during the upgrade.

v2 also only ever **appends** storage variables (`_prefixInitialized` at slot 2, leaving `_prefix` and `messages` where v1 put them). Reordering them, or inserting one above `messages`, would leave the new code reading the old slots and silently reinterpret every greeting anyone had stored.

### Testing

From `packages/rocketh-playground`:

```bash
pnpm test          # headless, node, runs in CI and in the root `pnpm test`
pnpm test:browser  # real chromium; needs `pnpm exec playwright install chromium` first
```

The browser suite is opt-in and lives in its own `vitest.browser.config.ts`, which the root runner does not collect (it globs `packages/*/vitest.config.ts` by exact name). A default test command that fails until you download a browser is one people stop running.

It earns its keep. Every bug this widget has had was found in a browser and none by the headless suite: a keyed-list crash that only appeared on the SECOND run, and a `console.error` from rocketh being painted as a failure.

One lesson is baked into the tests themselves. A widget-level "run it twice" test is nearly worthless here, because both runs print identical text: when the keyed-list bug threw, the render froze on the first run's output and the assertions happily passed against the stale DOM. The regression is therefore pinned at the `Terminal` level, where the two runs say different things and a frozen render is detectable. That test was verified to fail with the bug reintroduced.

### Requirements

`webevm` **0.5.0 or later**. This package was formerly published as `embedded-eth-node`, whose last release under the old name was 0.4.0; `webevm@0.5.0` continues that version line and is otherwise identical. Releases before that answered `eth_estimateGas` with gas _consumed_ rather than a usable limit, which silently reverted the inner `CREATE2` and so broke exactly the deterministic deployment this demonstrates.

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

## Automated and AI-assisted contributions

Use whatever tools you like. What is judged here is the behaviour and the impact of a contribution, never how much effort went into it or whether a model helped: that is GitHub's own stated moderation principle, and it is the right one for this repository too. A good patch written with an agent is a good patch, and a pointless patch written by hand is still pointless.

So the bar is the one already described above, and nothing extra: a change carrying a test that fails before it and passes after is the most persuasive thing you can send, and a bug report with a reproduction is close behind. Neither becomes more or less welcome depending on the tool that produced it.

What gets closed without discussion, on behaviour rather than on authorship:

- Changes that alter nothing a user or a test would notice: a reformat Prettier already owns, a comment typo bundled as a PR, a dependency bump with no reason given.
- Anything adding promotional links, attribution footers or backlinks to the repository, a commit message or a PR body.
- Machine-generated changes to `.github/workflows/`, to `.github/FUNDING.yml`, or to the vendored Solidity under `packages/rocketh-diamond/` and `packages/rocketh-proxy/` that the author has not read and cannot explain. All three are security-sensitive (see the release-pipeline note below, and point 4 of the checklist above), so "the tool did it" is not reviewable: a workflow is a token target, a funding file is a payment-redirection target in the same way, and the vendored Solidity decides the code every user's proxy runs.
- Bulk PRs opened across many repositories at once. Volume is the problem, measurable without guessing at intent, and it is the one thing that reliably exhausts a single maintainer.

None of this is aimed at anyone learning. If you are unsure whether something is worth opening, [ask in Discussions](https://github.com/wighawag/rocketh/discussions) first; that is free and a closed PR is not. The one thing asked of you is that you can explain your own diff, because the review conversation is with you and not with your tool.

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
