---
title: 'rocketh playground: a site where deploy scripts are edited, compiled and run in the browser'
slug: rocketh-playground
humanOnly: true
needsAnswers: true
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

Supersedes `work/specs/dropped/editable-deploy-scripts-in-the-docs.md` (dropped in the same change) and an earlier draft of this spec, `playground-app`, that never reached `main`. Sources are cited as repository, path and line, read at rocketh `3f51e9d6`, webevm `7765d7e`, etherfold `a4c312fd`, template-svelte `78d901c`, template-svelte-shadcn `1b91814`. The spikes cited are on rocketh branch `spike/playground-workers` at `9925d284`.

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

1. **Creating the repository and the domain.** The site is its own repository (decided) published on GitHub Pages at play.rocketh.dev. Creating `wighawag/rocketh-playground` (or another name), the `CNAME` record for `play.rocketh.dev`, and the Pages setting are the maintainer's to do; tasking waits for them.
2. **The size cap of a shared link.** A project travels in the URL fragment, compressed. Chromium accepts URLs up to 2 MB, but chat apps and issue trackers cut far shorter links. Proposed cap: 32 KB of compressed fragment, beyond which "Share" offers the zip instead. Which number?
3. **How the playground follows rocketh releases.** Proposed: a scheduled workflow in the playground repository that bumps its rocketh dependencies when a new version is on npm, runs the playground's own tests and the export test, and opens a pull request (the same reaction to releases rocketh's "Docs against the release" workflow has, `.github/workflows/docs-release-smoke.yml`). Auto-merge when green, or always a human merge?

<!-- /open-questions -->

## Problem Statement

Someone deciding whether to use rocketh, a hardhat-deploy v1 user wondering what v2 changes for their scripts, and a reader of rocketh.dev following a sample all have the same gap: to try a deploy script on their own contract they must install Node, pnpm, Hardhat and a project first. The one interactive thing today, the `<rocketh-playground>` widget on rocketh.dev, runs four fixed scripts against precompiled artifacts: a step is `modules: ModuleObject[]`, already-imported JavaScript (rocketh `packages/rocketh-playground/src/core/playground.ts:33`), so nothing the reader types can run. Remix lets a reader try Solidity without installing anything, but its deploy flow is its own, so nothing learned there carries into a rocketh project.

## Solution

A site of its own, **rocketh playground** at play.rocketh.dev, where the project `hardhat-deploy init` creates is open in the browser: `contracts/`, `deploy/`, `rocketh/config.ts`, `rocketh/deploy.ts`. The reader edits a contract and the deploy scripts, presses Deploy, and the site compiles the Solidity in the tab, runs the deploy scripts with the published rocketh through `@rocketh/web`, against an EVM in the tab, and shows the transcript and the deployment records as files. They re-run to watch rocketh skip what did not change, reset to start again, come back after a reload to find everything where they left it, share the project as a link, and download it as a hardhat-deploy project that runs unchanged with `pnpm i && pnpm hardhat deploy`.

What sets it apart from Remix is that the scripts are a real project's scripts, run by the real rocketh: what works in the playground works after the download. Nothing touches a network.

## User Stories

1. As someone evaluating rocketh, I want to open the playground and see a working project (a contract, a deploy script, the config), so that I start from something that runs.
2. As someone evaluating rocketh, I want to press Deploy and see the contract compiled, deployed and its record written within seconds, so that I see the whole loop before deciding to install anything.
3. As a reader, I want to edit the Solidity and deploy again, so that I see rocketh redeploy what changed and skip what did not.
4. As a reader, I want to edit a deploy script and run it, so that I can try `deploy`, `deployViaProxy`, `execute`, `read`, tags and dependencies on my own code.
5. As a hardhat-deploy v1 user, I want to paste a v1-style script, see where it fails, and fix it with the migration page beside me, so that I know what moving to v2 costs.
6. As a reader, I want the editor to flag a wrong constructor argument or a misspelled option as I type, so that rocketh's typed API is visible before anything runs.
7. As a reader, I want a Solidity compile error shown with its file and line, and nothing sent, so that I can tell a typing mistake from a deployment failure.
8. As a reader, I want a revert, a missing deployment or a bad argument shown in the transcript as rocketh prints it, so that I learn what real failures look like.
9. As a reader, I want to see `deployments/<environment>/*.json` and `.chain` as files I can open, so that I know what a project would commit.
10. As a reader, I want Reset to give me the starting project on a fresh chain, so that an experiment that went wrong is recoverable.
11. As a reader, I want my files, chain and records to survive a reload, so that I can come back to an experiment.
12. As a reader, I want to share my project as a link, and a link I open never to run until I press Deploy, so that sharing is easy and opening a link is safe.
13. As a reader, I want to download the project as a zip that is a hardhat-deploy project, so that I continue locally with the same files.
14. As a reader, I want the page to stay responsive while the compiler loads and the scripts run, and a Stop button for a script that never ends, so that the editor never freezes.
15. As a reader on a slow connection, I want to see what is loading and how big it is, so that the wait for the compiler is explained.
16. As a reader on a phone, I want the playground to load, run and show results, even if editing is cramped, so that a shared link works where it is opened.
17. As a maintainer, I want the playground to run the rocketh versions published on npm, the same ones the exported project pins, so that what it teaches is what a user can install.
18. As a maintainer, I want the compile, run and export paths testable headlessly in node, so that most of the playground is proven without a browser.
19. As a maintainer, I want the exported project installed and deployed by a test, so that the export cannot silently rot.
20. As a maintainer, I want the bundle sizes checked against a budget, so that a dependency that doubles the first load is noticed.

### Autonomy notes (the two gate axes)

- **`humanOnly: true`**: the repository, the domain and the publishing are the maintainer's to create, and the work is product-sized, so a human drives its tasking.
- **`needsAnswers: true`**: the three questions above (the repository and domain to exist, the share cap, the release-following policy) must be settled before tasks are cut.

## Decisions (maintainer, 2026-11-18)

- **Name and address:** rocketh playground, at play.rocketh.dev.
- **Its own repository, published on GitHub Pages.** A custom subdomain is a `CNAME` record per repository (GitHub docs, "About custom domains and GitHub Pages", "Custom subdomains"), so the playground's repository serves play.rocketh.dev while rocketh's keeps rocketh.dev. GitHub Pages sets no custom headers, and none are needed: webevm uses no `SharedArrayBuffer` (no match in webevm `packages/webevm/src/`), solc runs single-threaded, so COOP/COEP isolation is not required. A Content-Security-Policy, where wanted, is a `<meta>` tag.
- **It derives from template-svelte-shadcn** through a `stem` remote (offshoot-fanout), for its UI kit (panes, tabs, dialogs; template-svelte-shadcn `README.md`, "What this tier adds"), and inherits the tree's static build (`@sveltejs/adapter-static` with a `404.html` fallback, template-svelte `web/svelte.config.js:37-40`). template-svelte-docs is not used: its Markdown engine has nothing to render here. jolly-roger, which adds the onchain/web3 layer on top of shadcn (the tree in template-svelte-shadcn `README.md`, "Where this sits"), is where to look if a wallet ever enters scope.
- **Licence:** AGPL-3.0 for the playground's own code. The solc it ships is a separate, unmodified file with its GPL-3.0 licence and a link to its source (GPL-3.0 and AGPL-3.0 are compatible). A project the reader exports is generated from the `hardhat-deploy init` template, which is MIT (rocketh `packages/hardhat-deploy/package.json:14`), and states MIT, so no exported project inherits the AGPL.
- **It runs published rocketh**, pinned in its `package.json`, never a rocketh checkout: the exported project pins published versions, so the playground must run those same ones. How it follows releases is open question 3.
- **The v1 line:** a fixed project layout, run and re-run, logs and records visible, reset, persistence across reloads, zip export, and sharing as a compressed URL fragment with no server. Importing a gist or a repository comes later.
- **"Open in playground" on rocketh.dev comes right after v1.** rocketh.dev documents `main` (it is built from a rocketh checkout, rocketh `.github/workflows/deploy.yml`) while the playground runs releases, so a sample may use an option the playground's version lacks. The marker is decided: a fence such as ` ```typescript playground=deploy/02_deploy_greeter.ts ` names the file it stands for, only complete files are marked, and the docs build runs each marked sample against the released version and fails on an error, like a dead link.
- **A real network through an injected wallet** is out of v1 and not out for good. The separate origin is what keeps that door open without exposing rocketh.dev.
- **The EVM engine:** webevm's default (ethereumjs). revm (the `webevm/revm` subpath, measured 2.7x faster on Chromium for a 100-read frame, adding 413 KB gzipped, webevm `README.md:29` and `:640-643`) only if measurement shows a need.
- **Editor:** CodeMirror 6 with the TypeScript language service in a worker (`@valtown/codemirror-ts`, `@typescript/vfs`, TypeScript 6). **Dependencies approved:** `codemirror`, `@codemirror/lang-javascript`, `@valtown/codemirror-ts`, `@typescript/vfs`, `typescript` 6, `@replit/codemirror-lang-solidity`, `comlink`, `fflate`.
- **solc is copied into the build**, one pinned version: the one `hardhat-deploy init`'s template compiles with, 0.8.28 today (rocketh `packages/hardhat-deploy/templates/basic/hardhat.config.ts:21`). The build fetches it once from binaries.soliditylang.org and checks it against the `sha256` in that host's `list.json`.
- **No Solidity imports in v1.** solc's import callback is not wired; the demo compiles from `contracts/` alone.

## Research (cited)

### What exists, and what of it is reused

- The `<rocketh-playground>` widget runs webevm on the page's thread: `createPlaygroundChain` calls `createNode` (rocketh `packages/rocketh-playground/src/core/chain.ts:32-33`), and a step's scripts are already-imported modules (`playground.ts:33`).
- Reused, from the published `@rocketh/playground` (0.1.7 on npm, re-exported by `packages/rocketh-playground/src/index.ts:9-15`): `createLogStream` (`core/log-stream.ts:65`), `captureConsole` (`core/console-capture.ts:43`, run inside the runner worker, whose `console` is its own), and the rule in `buildUserConfig` (`core/playground.ts:142`): accounts as `privateKey:` keys and the in-tab chain declared.
- Not reused: the step model, the fixtures, the Svelte widget, and the main-thread chain.
- Pitfall carried over: `memory`, `hardhat` and `default` are environments that save nothing (`core/playground.ts:140`), so the playground's environment has another name.

### webevm in a worker, as etherfold hosts it

- `webevm/worker-entry` exposes a node at import (webevm `packages/webevm/src/worker-entry.ts:29`); `createWorkerNode` drives it from another thread (`worker-client.ts:44`) and refuses an `engine` option, which cannot be cloned (`worker-client.ts:74`); `exposeNode` lets a worker build its engine first, and `serveOn` hands a `MessagePort` to another context (`worker-host.ts:123`).
- The node runs one request at a time across its whole surface (webevm `docs/adr/0012-one-request-at-a-time-the-node-serialises-its-whole-public-surface.md`), so the runner and any UI reads share one queue safely.
- Chain state survives a reload through `createIndexedDBPersistence` (`packages/webevm/src/persistence.ts:21`).
- etherfold passes a provider into a worker as a port: a port "whose other end is already served elsewhere, typically by a worker running a node (`webevm`): requests then go worker to worker and this tab relays nothing" (etherfold `packages/browser/src/host/provider.ts:5-21`), built in task `work/tasks/done/a-worker-host-takes-its-provider-and-settings-from-the-tab.md` with `@eip-1193/over-port`.

### rocketh in the browser

- `@rocketh/web`'s `setupEnvironment(config, extensions, {deploymentStore})` (rocketh `packages/rocketh-web/src/index.ts:138`) takes the provider per run; stores are `createVFSDeploymentStore` (`vfs-deployment-store.ts:31`) and `createIndexedDBDeploymentStore` (`:126`); project files can live in `createPersistentVFS` with `createIndexedDBPersistence` (`persistence.ts:151`, `:39`).
- Against an EVM in the tab, accounts must be private keys and `autoMine` off (rocketh `documentation/browser/index.md:63-90`); a browser run has no prompt, so an unsignable `from` takes the `throw` path (`:108`).
- No `src/` of `rocketh`, `@rocketh/core`, `web`, `deploy`, `proxy`, `diamond`, `read-execute`, `viem`, `unknown-signer` or `signer` imports `node:*`, `fs`, `path`, `os` or `child_process` (`git grep` over each `packages/<name>/src` at `3f51e9d6`), so all are expected to run in a worker unchanged; the spike ran `rocketh`, `@rocketh/web`, `@rocketh/deploy` and `@rocketh/signer` there.

### Solidity in the browser

- soljson 0.8.30 is 9.6 MB, 6.7 MB brotli over the wire, served with `access-control-allow-origin: *` (spike `docs/spikes/playground-workers/README.md`). It is an emscripten script loaded with `importScripts`, so it needs a classic worker; `Module.cwrap('solidity_compile', ...)` compiles standard JSON with no wrapper library.
- The compiler is GPL-3.0 (ethereum/solidity `LICENSE.txt`); the `solc` npm wrapper is MIT (`npm view solc license`).
- Imports, for later: `@rocketh/proxy` exports its Solidity as `./solc_0_8/*` (rocketh `packages/rocketh-proxy/package.json:58`), and solc's import callback is synchronous, so every imported file must be in memory before the compile.
- Output to artifacts: the template's `rocketh/deploy.ts` imports `../generated/artifacts/index.js` (rocketh `packages/hardhat-deploy/templates/basic/rocketh/deploy.ts:5`), so the playground generates that module from each compile.

### User TypeScript in the tab

- The TypeScript 6 worker the editor needs also transpiles (`ts.transpileModule`, emitting CommonJS), so no second transpiler ships. TypeScript 7 is the native compiler; its `wasip1/wasm` build is experimental (microsoft/TypeScript#64174, merged 2026-10-29) and its `tsc.wasm` is 53 MB, about 13 MB gzipped (`@typescript/typescript-wasip1-wasm@7.1.0-dev.20261118.1`), so v1 stays on TypeScript 6.
- Workers have no import maps, so modules resolve through a registry (below).
- A worker has no DOM and no `window.ethereum`. A sandboxed iframe without `allow-same-origin` would add an opaque origin but also lose IndexedDB, which persistence needs; v1 uses workers on an origin of its own.
- Each extension entry is called with the environment when every script starts (rocketh `packages/rocketh/src/executor/index.ts:81`), so an extension that throws there fails every script; the runner reports it as rocketh does.

### Editor (measured)

`docs/spikes/playground-editors/README.md`: one deploy script with a wrong constructor argument, cold, headless Chromium. CodeMirror 6 syntax only: 166 KB gzip, no type errors. CodeMirror with the TypeScript 6 service in a worker: 1.2 MB gzip, the error shown at 516 ms. Monaco with only TypeScript and Solidity: 2.6 MB gzip, the error shown at 805 ms, and its README answers "Is the editor supported in mobile browsers?" with "No."

### Project model and export

- The layout is `hardhat-deploy init`'s, copied from `packages/hardhat-deploy/templates/basic` (`packages/hardhat-deploy/src/cli.ts:124`), with `workspace:*` replaced by the published version (`cli.ts:144`).
- That template has no `deploy` script (its `package.json:30` has `test` only): the command is `pnpm hardhat deploy`. Never tell a reader `pnpm deploy`, which is pnpm's own command. template-ethereum-contracts uses `pnpm contracts:deploy`.
- Importing later: `codeload.github.com` archives allow only `render.githubusercontent.com` as an origin, while `api.github.com` and `raw.githubusercontent.com` allow any (response headers checked 2026-11-18); unauthenticated, the API allows 60 requests an hour.

### Sharing

- Chromium "limits URLs to a maximum length of 2MB" (chromium `docs/security/url_display_guidelines/url_display_guidelines.md:127`); a fragment is never sent to the server.
- The gist API returns at most 1 MB per file and 300 files (GitHub REST docs, "Gists", "Truncation"), for when gists come.

### The site

- GitHub Pages: published sites at most 1 GB, a soft bandwidth limit of 100 GB a month (GitHub docs, "GitHub Pages limits"). At about 7 MB per cold load, mostly the compiler, that is roughly 14,000 cold first visits a month; caching (below) keeps repeat visits off it.

### Prior art

Remix is a full IDE with a plugin engine, a debugger, static analysis and a desktop app, and supports no tablets or phones (remix-project `README.md:21-30`, Apache-2.0). The playground matches none of that: it is one project layout, run the way a rocketh project runs.

## Implementation Decisions

### Threads, and what crosses each boundary

- **The page** (Svelte, the editor's view): never runs user code. It holds the files, sends them out, and renders what comes back.
- **The TypeScript worker**: the language service for the editor (diagnostics, completion, hover) with rocketh's declarations and the generated artifact types loaded, and the transpiler for a run. In: file contents. Out: diagnostics, completions, transpiled JavaScript.
- **The compiler worker** (classic, for `importScripts`): holds soljson. In: standard-JSON input. Out: standard-JSON output, from which the page writes `generated/artifacts`.
- **The EVM worker**: webevm, created with `createWorkerNode`, persisted with `createIndexedDBPersistence`. It serves a `MessagePort` (`serveOn`) to the runner.
- **The runner worker**: runs the deploy scripts through `@rocketh/web` with the port as its provider (`providerOverPort`), a deployment store in IndexedDB, and `captureConsole` feeding a log stream back. In: transpiled modules and the artifacts. Out: log entries, the store's file changes, the result or the error. Requests go runner to EVM worker directly, not through the page. Stop terminates this worker only; the chain is untouched.

Why this split: user code never shares a thread with the page; the compiler and the type checker, the two heavy loads, never block typing; the chain outlives a stopped or crashed run.

### Module resolution in the runner

A registry maps the project's relative paths to their transpiled modules, `../generated/artifacts/index.js` to the module generated from the last compile, and a fixed list of bare specifiers (`rocketh`, `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond`, `@rocketh/read-execute`, `@rocketh/viem`, `@rocketh/signer`, `@rocketh/web`, `viem`) to modules bundled into the runner. Any other import fails, naming the specifier and the list.

### Configuration

`rocketh/config.ts` stays the reader's file and is used as written, except that the runner replaces `accounts` with test keys through the `privateKey` protocol (well-known throwaway keys, labelled as such), declares the in-tab chain, and passes `autoMine: false`, as `documentation/browser/index.md:63-90` requires. The export writes the template's own `accounts`, never those keys.

### Persistence

Four IndexedDB stores, each provided already: the project files (`createPersistentVFS`), the deployment records (`createIndexedDBDeploymentStore`), the chain (webevm `createIndexedDBPersistence`), the compiler (the Cache API, keyed by version and checked against its `sha256`). Reset clears the last three and restores the starting files.

### Export and share

Export writes the template's files (with published versions), the reader's `contracts/` and `deploy/`, and a README naming `pnpm i && pnpm hardhat compile && pnpm hardhat deploy`, zipped with fflate. Deployment records are not exported: their chain only existed in the tab. Share writes the files, compressed, into the URL fragment, within the cap of open question 2.

## The security boundary

User code runs in the reader's own tab, with the reader's privileges on play.rocketh.dev.

- **Permitted:** a script runs anything JavaScript allows in a worker: compute, `fetch`, the origin's IndexedDB. The origin holds nothing but the reader's playground, so that reaches nothing else.
- **Forbidden by construction:** no user code on the page's thread, so no DOM, no cookies, no `window.ethereum`; no wallet, no RPC URL, no network chain; nothing runs when a link is opened, only on Deploy; the keys are test keys and never exported.
- **Contained:** a runaway script is ended by terminating the runner worker; Solidity is data handed to solc, not code run by the page.
- **Not claimed:** a script can still `fetch` arbitrary URLs from the reader's browser. That is the same as any web page the reader chooses to run, and is stated on the page.

## Risks, and how v1 limits each

- **Bundle size and first load.** The compiler is about 95% of a cold load (spike: 6.7 MB of about 7 MB). v1: it loads in its worker while the reader reads the code, with its size shown; the Cache API keeps it after the first visit; a budget test fails a build whose page or worker bundles grow past stated limits.
- **solc loading.** One pinned version, copied into the build and checked against `list.json`; no runtime dependency on a third-party host.
- **TS transpile and type checking.** TypeScript 6 in a worker, loaded after the editor is usable (the syntax-only editor shows first); a type error never blocks a run.
- **Keeping in step with rocketh.** Published versions only, bumped by a pull request per release (open question 3), with the export test and a run of the starting project as the gate.
- **GitHub Pages bandwidth.** Long cache lifetimes on the hashed compiler file; if the soft limit is reached, serving the compiler from another static host is a build setting, not a redesign.

## The spike to retire the biggest risk first

Two spikes are done (`docs/spikes/playground-workers/` and `docs/spikes/playground-editors/`): solc and webevm each in a worker with one real deploy script took 1.4 s from click to record on headless Chromium, and the editor comparison above. The largest risk left is the runner: running TRANSPILED, reader-edited files through the registry in a worker, with the EVM reached over a port. Defined, not executed:

1. One page, four workers as above. The TypeScript worker transpiles `deploy/01_deploy_counter.ts` and `rocketh/deploy.ts` from the template, unedited, plus the reader's `rocketh/config.ts`.
2. The runner resolves them through the registry, gets the provider with `providerOverPort` on a port the EVM worker served, and runs them through `@rocketh/web` with an IndexedDB store.
3. Measure: the runner bundle size (rocketh, the extensions, viem), the time from Deploy to record, a re-run that skips, a reload that restores, Stop during an infinite loop.
4. Record what broke. Pass: the template's files run unedited, and a reload restores chain and records.

## Testing Decisions

- **Headless first:** compile, transpile, resolve and run are node tests (solc-js and webevm's `createNode` both run in node); so are the failures: a compile error, a syntax error, an unknown import, a throwing script, a revert.
- **The export is tested by installing it:** unzip into a temp folder, `pnpm i`, `pnpm hardhat compile`, `pnpm hardhat deploy` on the in-memory network, as rocketh's `test:docs:hardhat-deploy-init` does for `init`.
- **The browser suite** (Playwright) covers what only it can: the workers start, Deploy produces records, a reload restores, Stop ends a runaway script, a shared link does not run until Deploy, a type error is shown in the editor.
- **Bundle budgets** are a test.

## Acceptance criteria

- [ ] play.rocketh.dev, cold, shows the starting project; Deploy prints a transcript and writes `deployments/<environment>/Counter.json` and `.chain`, with the compiler's size shown while it loads.
- [ ] Deploy again without a change sends nothing and the transcript says so; after editing the contract, Deploy redeploys it.
- [ ] A deploy script edited to use `deployViaProxy` and an `execute` with a `guard` runs with the extensions `rocketh/config.ts` spreads.
- [ ] A wrong constructor argument is flagged in the editor before Deploy, and the run still goes ahead.
- [ ] A Solidity error and a TypeScript syntax error show file and line and send nothing; a revert appears in the transcript as rocketh prints it; an unsupported import fails naming it and the supported list.
- [ ] Reload restores files, chain and records; Reset restores the starting project on a fresh chain; Stop ends an infinite loop and the chain is still there.
- [ ] A script that touches `window` or `document` fails with a ReferenceError in the transcript; a project opened from a link does not run until Deploy.
- [ ] Share produces a link within the cap that reopens the same files; above the cap it offers the zip.
- [ ] Download produces a zip that passes `pnpm i && pnpm hardhat compile && pnpm hardhat deploy` in CI, states MIT, and contains no test key.
- [ ] The shipped soljson matches the `sha256` in binaries.soliditylang.org's `list.json` for the pinned version, and its GPL-3.0 licence and source link are served beside it.
- [ ] The rocketh packages it runs are published npm versions, the same the export pins.
- [ ] The page and worker bundles are within the budgets the tests state.

## Out of Scope

Out of v1, possibly later:

- "Open in playground" buttons on rocketh.dev (right after v1, decided above).
- Importing a gist or a GitHub repository.
- Solidity imports (OpenZeppelin, `@rocketh/proxy`'s Solidity).
- A real network through an injected wallet.
- Several solc versions or a version picker.
- The revm engine.

Out for good:

- Remix parity: a debugger, a step-through, a gas profiler, plugins, file system access, git.
- A server: accounts, collaboration, stored projects. Everything lives in the reader's browser or in a link.
- Foundry layouts, `forge test`, or running a project's test suite in the tab.
- A playground built from rocketh's `main` rather than its releases.
