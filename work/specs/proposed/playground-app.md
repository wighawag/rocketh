---
title: 'A rocketh playground: edit, compile and deploy a hardhat-deploy project in the browser'
slug: playground-app
humanOnly: true
needsAnswers: true
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

<!-- open-questions -->
<!--
  TRANSIENT BLOCK, stripped by the apply rung on full resolution.
  While the spec has unresolved questions blocking autonomous tasking:
    1. Set `needsAnswers: true` in the frontmatter above.
    2. List the questions under the `## Open questions` heading below.
    3. Clear the flag (and let apply strip this block) once they are answered.
  Delete the whole fenced block (markers and all) if the spec launches fully resolved.
-->

## Open questions

1. **Origin.** User code runs in the reader's tab. On `rocketh.dev/playground/` it shares the origin, and so the storage, of the documentation site; on its own origin (`play.rocketh.dev`, a second Pages site) it shares nothing but needs a DNS name and a second deploy. The site keeps almost nothing in storage today (the theme), so the same origin is defensible for v1 if user code never runs on the page's thread (see the security boundary below). Same origin, or a separate one from the start?
2. **Where the code lives.** Proposed: the app is built in rocketh (a new `packages/rocketh-playground-app`, or a second entry of `packages/rocketh-playground`), because, like the widget, it must run the rocketh of the same commit; rocketh-website serves its static build at `/playground/` the way it serves `skills/`, through a Vite plugin reading the rocketh checkout. The alternative is a route in rocketh-website importing the app. Which?
3. **Transpiler.** sucrase (MIT, about 1.1 MB unpacked, strips types and can rewrite `import` to a registry `require`) or esbuild-wasm (MIT, about 14.5 MB unpacked, a real compiler with real errors). Recommended: sucrase, type-stripping only, no type errors reported (the same position as `editable-deploy-scripts-in-the-docs`, question 1). Bundled size not yet measured.
4. **Which solc, and from where.** One version pinned per release of the app (proposed: the version `hardhat-deploy init`'s template compiles with, 0.8.28 today). Fetched at run time from `binaries.soliditylang.org` (served with `access-control-allow-origin: *`, about 6.7 MB brotli for 0.8.30), or copied into the site build? Fetching keeps the GPL-3.0 compiler binary off rocketh.dev and costs a dependency on that host; copying makes the app work offline and means distributing a GPL-3.0 binary (fine unmodified, with the licence and a source link). Which?
5. **Imports in Solidity.** v1 compiles the files in `contracts/` only. Is `@openzeppelin/contracts` (or the `@rocketh/proxy` Solidity sources) needed in v1? It means shipping a fixed snapshot of those sources, since solc's import callback is synchronous and every file must be in memory before the compile.
6. **New dependencies.** At least the transpiler, a zip writer for the export (fflate, MIT, about 8 KB gzip, is the usual choice), an editor (CodeMirror 6, MIT; Monaco is several MB), `comlink` (webevm's optional peer). Each needs approval.
7. **"Open in playground" on rocketh.dev.** A code sample is not a project: most samples are fragments. Proposed: only fences the author marks (for example ` ```typescript playground`) get the button, and a marked sample must be a complete deploy script that the docs build runs in the playground's headless core, so a broken one fails the build like a dead link. Agreed, or a different marking?
8. **Relation to `editable-deploy-scripts-in-the-docs`.** That spec makes the widget's last step editable. This one makes a separate app. Proposed: drop that spec in favour of this one, and keep the widget as the fixed four-step story that links to the playground at its end. Or keep both?

<!-- /open-questions -->

## Problem Statement

Someone deciding whether to use rocketh, or learning it, can read the documentation and run a fixed four-step widget on the introduction page, but cannot try their own contract or their own deploy script without installing Node, pnpm, Hardhat and a project. The questions that decide adoption ("what does an upgrade of MY contract look like", "what does a re-run do", "what is in the record") end at the edge of the widget. Remix answers that for Solidity, but its deploy flow is its own, so what a reader learns there does not carry over into a project.

## Solution

A playground app on rocketh.dev: a fixed project layout, the one `hardhat-deploy init` creates (`contracts/`, `deploy/`, `rocketh/config.ts`, `rocketh/deploy.ts`), editable in the browser. The reader edits a contract and the deploy scripts, presses Deploy, and the app compiles the Solidity in the tab, then runs the deploy scripts with the real rocketh, through `@rocketh/web`, against an EVM in the tab. They see the transcript, the deployment records as files, and can re-run to watch idempotency, reset the chain, and download the whole thing as a hardhat-deploy project that runs unchanged with `pnpm i && pnpm hardhat deploy`.

What makes it different from Remix is that the scripts ARE the project's scripts: same files, same imports, same records, so what works in the playground works after the download, and a sample on rocketh.dev can open in it.

## User Stories

1. As a reader, I want to open the playground and see a working project (a contract, a deploy script, the config), so that I start from something that runs.
2. As a reader, I want to press Deploy and see the contract compiled, deployed, and its record written, so that I see the whole loop in a few seconds.
3. As a reader, I want to edit the Solidity and deploy again, so that I see rocketh redeploy what changed and skip what did not.
4. As a reader, I want to edit a deploy script (TypeScript) and run it, so that I can try `deploy`, `deployViaProxy`, `execute`, `read`, tags and dependencies on my own code.
5. As a reader, I want a compile error shown with its file and line before anything runs, so that I can tell a typing mistake from a deployment failure.
6. As a reader, I want a runtime failure (a revert, a missing deployment, a bad argument) to appear in the transcript as rocketh prints it, so that I learn what real failures look like.
7. As a reader, I want to see `deployments/<environment>/*.json` as files I can open, so that I know what a project would commit.
8. As a reader, I want to reset the chain and the records and start again, so that an experiment that went wrong is recoverable.
9. As a reader, I want my files, chain and records to survive a reload, so that I can come back to an experiment.
10. As a reader, I want a one-press way back to the starting project, so that I never wedge myself.
11. As a reader, I want to download the project as a zip that is a hardhat-deploy project, so that I can continue locally with the same files.
12. As a reader of a rocketh.dev page, I want "Open in playground" on a complete deploy-script sample, so that I can run and change it.
13. As a reader, I want the page to stay responsive while solc compiles and the scripts run, so that the editor never freezes.
14. As a reader on a slow connection, I want to see what is loading and how big it is (the compiler is the bulk), so that the wait is explained.
15. As a reader on a phone, I want the playground readable and runnable, even if editing is cramped, so that the link works wherever it is opened.
16. As a reader, I want code shared with me by a link never to run until I press Deploy, so that opening a link cannot do anything on its own.
17. As a maintainer, I want the playground to run the rocketh of the same commit as the documentation, so that it never teaches a version that is not on main.
18. As a maintainer, I want the compile, run and export steps testable headlessly (node, no browser), so that most of it is proven without the browser suite.
19. As a maintainer, I want the downloaded project checked by a test that installs and deploys it, so that the export cannot silently rot.
20. As a maintainer, I want the playground's loading cost measured in CI, so that a dependency that doubles it is noticed.
21. As a documentation author, I want to mark a sample as runnable and have the docs build run it, so that an "Open in playground" button never opens something broken.

### Autonomy notes (the two gate axes)

- **`humanOnly: true`**: the shape decisions (origin, where the code lives, which dependencies) are the maintainer's, and the work is the size of a product, so a human drives its tasking.
- **`needsAnswers: true`**: the eight questions above change the size and the architecture; tasking before they are answered would cut the wrong slices.

## Implementation Decisions

What the research and the spike settle, pending the questions above.

- **Three threads.** The page (UI and editor) runs no user code. A **compiler worker** (classic, because soljson is an emscripten script loaded with `importScripts`) holds solc and answers standard-JSON compiles. A **chain worker** hosts webevm (`webevm/worker-entry`, driven with `createWorkerNode` from `webevm/worker-client`). A **runner worker** transpiles and runs the deploy scripts through `@rocketh/web`, with the chain as its provider over a `MessagePort` (`node.serveOn(port)` on the page side, `providerOverPort` from `@eip-1193/over-port` in the runner), so requests go worker to worker, the way etherfold hands a webevm-served port to its indexer host (`packages/browser/src/host/provider.ts` in etherfold). The spike ran the scripts on the page; moving them to a runner worker is what keeps user code off the page's thread.
- **The fixed layout is `hardhat-deploy init`'s.** `contracts/*.sol`, `deploy/*.ts`, `rocketh/config.ts`, `rocketh/deploy.ts`, seeded from `packages/hardhat-deploy/templates/basic`. `rocketh/config.ts` differs in one place: accounts are `privateKey:` test keys with the `privateKey` signer protocol (webevm signs nothing and has no `eth_accounts`), and the in-tab chain is declared. The environment is not `memory`, `hardhat` or `default`, which save nothing.
- **Module resolution in the runner.** Each `.ts` file is transpiled (types stripped, `import` rewritten to a registry `require`). The registry maps the project's relative paths to its transpiled files, `../generated/artifacts/index.js` to a module generated from the last compile (one export per contract, as hardhat-deploy's typed artifacts), and a fixed list of bare specifiers (`rocketh`, `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/read-execute`, `@rocketh/signer`, `@rocketh/web`, `viem`) to modules bundled into the runner. Anything else is an error naming the specifier and the list. Workers have no import maps, which is why it is a registry and not blob-URL modules.
- **Persistence is IndexedDB, in four stores, each already provided.** Project files: `createPersistentVFS` with `createIndexedDBPersistence` from `@rocketh/web`. Deployment records: `createIndexedDBDeploymentStore` from `@rocketh/web`. Chain state: webevm's `createIndexedDBPersistence` (state, balances and logs survive a reload). The compiler: the Cache API, keyed by version and checked against the `sha256` in `binaries.soliditylang.org`'s `list.json`.
- **Export** writes the template's files (package.json, hardhat.config.ts, tsconfig.json, pnpm-workspace.yaml, AGENTS.md, README.md), the reader's `contracts/` and `deploy/`, and a `rocketh/config.ts` with the template's accounts (index 0), not the playground's keys. The template's dependency versions are those of the release the app was built with. Deployment records are not exported (they belong to a chain that only existed in the tab).
- **Built from rocketh, served by rocketh-website** (pending question 2): a static build the site copies to `/playground/`, built in the same job of rocketh's `deploy.yml` that builds the widget (`pnpm docs:widgets`).

## The security boundary

User code (the reader's deploy scripts, or code from a shared link) runs in the reader's own tab, with the reader's privileges on that origin. The boundary v1 draws:

- **No user code on the page's thread.** Deploy scripts run in the runner worker: no DOM, no `window.ethereum` (so a script cannot ask the reader's wallet for anything), no cookies. A worker still reaches the origin's IndexedDB and can `fetch`; that is why the origin matters (question 1) and why the site keeps nothing sensitive in storage.
- **Nothing runs on load.** A link (a shared project, "Open in playground") fills the editor and waits for Deploy.
- **No wallet, no network.** The chain is webevm in the tab; the runner is given that provider only and no RPC URL. Deploying to a real network is out of scope.
- **The keys are test keys,** the well-known anvil ones, labelled as such, and never exported into the downloaded project.
- **Solidity compiles in its own worker** and is data to solc, not code to the page.
- **A runaway script** (an infinite loop) is ended by terminating the runner worker, which a Stop button does; the chain worker is unaffected.

## Testing Decisions

- **Headless first,** as for the widget: "these files, compiled with this solc, run by the runner core, give these records" is a node test (solc-js runs in node; webevm's `createNode` runs on the main thread in node). So are the failures: a compile error, a transpile error, an unknown import, a script that throws, a revert.
- **The export is tested by installing it**: write the zip to a temp folder, `pnpm i`, `pnpm hardhat compile`, `pnpm hardhat deploy` on the in-memory network, like `test:docs:hardhat-deploy-init`.
- **The browser suite** (Playwright, as `packages/rocketh-playground` and rocketh-website's e2e) covers what only it can: the three workers start, Deploy produces a transcript and records, a reload restores the project, Stop ends a runaway script, a link does not run on load.
- **Loading cost**: a test asserting the page and worker bundles stay under a stated budget (the spike: 93 KB gzip page, 145 KB gzip chain worker, excluding the compiler).
- **Runnable samples**: the docs build runs every marked sample in the headless core and fails on an error, like a dead link.

## Acceptance criteria

- [ ] From a cold cache, `/playground/` shows the starting project, and Deploy prints a transcript and writes `deployments/<environment>/<Contract>.json` and `.chain`.
- [ ] Editing the contract and deploying again redeploys it; deploying again without a change sends nothing, and the transcript says it was skipped.
- [ ] Editing a deploy script (adding a `deployViaProxy`, an `execute` with a `guard`) runs it with the extensions of `rocketh/config.ts`.
- [ ] A Solidity error and a TypeScript syntax error are shown with file and line and nothing is sent; a revert appears in the transcript as rocketh prints it.
- [ ] An import outside the supported list fails naming the specifier and the list.
- [ ] Reload restores the files, the chain and the records; Reset restores the starting project on a fresh chain.
- [ ] No user code runs on the page's thread (asserted: a script touching `window` or `document` fails with a ReferenceError in the transcript); a project opened from a link does not run until Deploy.
- [ ] Download produces a zip that installs and deploys with `pnpm i && pnpm hardhat compile && pnpm hardhat deploy` (tested in CI).
- [ ] A sample marked runnable on a rocketh.dev page has "Open in playground", and the docs build fails when a marked sample does not run.
- [ ] The page bundle and the worker bundles stay within the budget the tests state; the compiler download is shown with its size while it loads.
- [ ] The app is built from the rocketh commit the documentation is built from, in the same deploy job.

## Out of Scope

- **Deploying to a real network**, with a wallet or a key: no RPC, no faucet, no injected provider in v1.
- **Several solc versions**, a version picker, or compiler settings beyond the optimizer.
- **Remix feature parity**: no debugger, no step-through, no gas profiler, no plugin system, no file system access, no git.
- **Type checking** of deploy scripts (types are stripped, not checked).
- **Solidity imports from npm** beyond what question 5 decides; no package manager in the tab.
- **Foundry layouts or tests** (`forge test`), and running the project's `test/` folder.
- **Collaboration or accounts**: no server, nothing stored anywhere but the reader's browser (a shared link carries the files itself).

## Further Notes

- **The spike** (branch `spike/playground-workers`, `docs/spikes/playground-workers/`, not merged) did, in one page: solc 0.8.30 in a classic worker, webevm 0.9.1 in a module worker, a real `deployScript` run through `@rocketh/web` against the worker node, the saved record printed. Measured on headless Chromium: compiler fetch and start 847 ms, first compile 210 ms, chain boot 63 ms, deploy 24 ms, 1.4 s from click to record; the compiler is 9.6 MB (6.7 MB brotli), the page bundle 93 KB gzip, the chain worker 145 KB gzip. Nothing failed; what nearly did is in its README (a classic worker for soljson, the ephemeral environment names, private-key accounts, untyped runtime artifacts).
- **Licences.** The solc-js wrapper (`solc` on npm) is MIT; the compiler itself (soljson) is GPL-3.0, like the Solidity repository. webevm, sucrase, esbuild-wasm, fflate and CodeMirror are MIT.
- **Prior spec.** `work/specs/proposed/editable-deploy-scripts-in-the-docs.md` asks the same transpiler and module-resolution questions for the widget, and puts Solidity compilation out of scope; see question 8.
