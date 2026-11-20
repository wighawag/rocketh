---
title: "Give @rocketh/playground's log stream a source for rocketh's own lines, and a factory that writes them there"
slug: playground-log-source-for-rocketh-lines
blockedBy: []
covers: []
---

## What to build

A host that runs deploy scripts in a worker (the rocketh playground app's runner worker) wants rocketh's own transcript in its log stream: `- Executing <script>`, `reusing "<name>" at <address>`, the deploy and proxy progress lines. Those go through `named-logs`, not `console`, so `captureConsole` never sees them, and `LogSource` (`core/log-stream.ts`) has no member for them: its members are `playground`, `step`, `script`, `warning`, `error` and `success`.

It is the host's job to install a `named-logs` factory, in the worker, before any rocketh module is evaluated. That is the intended contract of `named-logs` and stays as it is: a logger created with no factory is a free no-op, and rocketh's loggers are not changed. The page's factory does not reach a worker (each realm has its own `globalThis`), so the worker installs its own, as the first import of its entry. The amended spec `rocketh-playground` (now in wighawag/rocketh-playground, `work/specs/proposed/rocketh-playground.md`; "Threads", the runner worker) already says so.

What `@rocketh/playground` adds, so every host does not write the same few lines:

- A `LogSource` member `'rocketh'` for rocketh's own lines, documented like the others.
- An exported function that takes a `LogStream` and returns a `named-logs`-compatible factory (`(namespace) => Logger`) writing into that stream: `info`, `log`, `debug` and `write` as `'rocketh'`, `warn` as `'warning'` and `error` as `'error'`, matching how `captureConsole` maps the console's severities. The host installs it (`hook(factory)` or `globalThis._logFactory = factory`) in its first-imported module. The package does not install it itself and takes no `named-logs` dependency: the factory's type is structural.

Do NOT build it on `named-logs-console` or any factory that writes to `console`: `captureConsole` would then label rocketh's lines `'script'`.

## Acceptance criteria

- [ ] `LogSource` has a `'rocketh'` member, documented.
- [ ] The new function is exported from the root (it is not an extension, so the root-surface rule for extension packages does not apply) and returns a factory whose loggers append to the given stream with the mapping above.
- [ ] A test installs the factory BEFORE importing rocketh (in a module imported first), runs the GreetingsRegistry playground, and sees rocketh's `- Executing` line and, on a re-run, its `reusing "<name>"` line in the stream under `'rocketh'`, in order with the script's own `'script'` lines.
- [ ] `captureConsole` still labels only what the script printed as `'script'`.
- [ ] The widget's terminal renders the new source (browser suite).
- [ ] A minor changeset for `@rocketh/playground` (new export).

## Blocked by

- None. Can start immediately.

## Prompt

Goal: add a `'rocketh'` `LogSource` to `@rocketh/playground` and an exported function that turns a `LogStream` into a `named-logs` factory, so a host can route rocketh's own transcript into the stream by installing that factory before rocketh loads. Read `packages/rocketh-playground/src/core/log-stream.ts`, `core/console-capture.ts` and `core/playground.ts`, `named-logs`' `src/index.ts` (about 90 lines; read the source, do not regex the minified `dist`), and `docs/adr/0009-user-facing-notices-stay-on-console.md`. Do NOT change how rocketh packages create their loggers: a logger created before a factory exists staying a no-op is intended. ES modules evaluate imports before the importing module's body, so the test must install the factory in a module of its own imported first (or with `vi.hoisted`, as `packages/rocketh-read-execute/test/unknown-signer-contract.integration.test.ts` does). Done means the acceptance criteria hold and the repository's verify gate (`dorfl.json`) passes.

FIRST, check this task against current reality; if it drifted, route it to needs-attention with the discrepancy.

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report.
