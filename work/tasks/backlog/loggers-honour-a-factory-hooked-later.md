---
title: 'Make every rocketh logger honour a named-logs factory hooked after the module loaded'
slug: loggers-honour-a-factory-hooked-later
needsAnswers: true
blockedBy: []
covers: []
---

<!-- open-questions -->

## Open questions

1. **Fix the option type upstream in `named-logs`, or work around it here?** `named-logs@0.4.1` declares `logs(namespace, options?: {fallbackOnProxy?: boolean | string; decoration: string})`, so `decoration` is REQUIRED whenever an options bag is passed, and `logs('rocketh', {fallbackOnProxy: true})` does not compile. Its lazy path (`fallbackFactory`) also calls `factory(namespace)` without forwarding `decoration`. Option A: release a `named-logs` patch (same maintainer) that makes `decoration` optional and forwards it on the lazy path, then require that version here. Option B: pass `decoration` explicitly at every call site against 0.4.1, after checking what `named-logs-console`'s factory does with an empty `decoration` compared to `undefined` (the eager path forwards it as given).
2. **How is ADR 0009 updated?** Its premise ("`logs()` returns a permanent no-op unless something has hooked a factory FIRST") stops being true for loggers built this way. Its conclusion should survive on its OTHER grounds (no factory at all in a test run or a plain programmatic embed, and `--log-level` / `NAMED_LOGS_LEVEL` must not be able to silence a user-facing notice), so the notices stay on `console`. Decide between amending ADR 0009's "Why" in place and a new ADR that supersedes only the premise.

<!-- /open-questions -->

## What to build

Every rocketh package creates its `named-logs` logger once, at module scope, with `logs(name)` and no options. `named-logs@0.4.1` returns the frozen no-op logger from such a call when no factory is hooked at that moment, and it stays a no-op forever: hooking a factory afterwards does not reach it. Only `@rocketh/node`'s CLI and `hardhat-deploy` hook a factory early enough (they import `named-logs-console`, which sets `globalThis._logFactory` at module evaluation, before the rocketh modules evaluate). Everyone else who hooks one later gets nothing, which is how a browser host loses rocketh's whole transcript (`- Executing <script>`, `reusing "<name>" at <address>`, the deploy and proxy progress lines) even after hooking a factory in the same worker.

`named-logs` already has the mechanism: `logs(name, {fallbackOnProxy: true})` returns a Proxy that looks the factory up on each property access until it finds one, then binds the real logger once and keeps it. Checked against the installed 0.4.1: a logger built with `{fallbackOnProxy: true}` before `hook()` prints after it, a plain `logs(name)` does not. When a factory IS hooked at call time, `logs()` returns the factory's logger directly whatever the options, so the CLI path is unchanged.

Build every module-scope logger that way. The call sites on `main` at the time of writing (`git grep -nE "\blogs\(" -- 'packages/*/src/**'`, re-run it, do not trust this list): `rocketh` `src/internal/logging.ts` (`'rocketh'`, which also backs `spin()`), `@rocketh/core` `src/providers/TransactionHashTracker.ts` (`'rocketh-provider'`), `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond`, `@rocketh/read-execute`, `@rocketh/router`, `@rocketh/viem` and `@rocketh/export` (each in `src/index.ts`), and `@rocketh/node` `src/executor/index.ts`. Prefer one shared helper over ten copies of the options bag only if it does not add a dependency edge that the package graph does not already have.

Known limits to keep, and to state in the code: no factory at all still means silence (this is not a fallback to `console`); the Proxy binds to the FIRST factory it finds, so a host that wants to redirect output between runs must hook one factory once and switch where IT writes, not re-hook.

## Acceptance criteria

- [ ] Every module-scope `logs(` call in `packages/*/src` builds a logger that honours a factory hooked after the module was evaluated.
- [ ] A test imports a rocketh package with no factory hooked, hooks a recording factory afterwards (plainly, not via `vi.hoisted`), runs a deploy, and sees rocketh's own lines (for example `- Executing` and `reusing "<name>"`) in the recording.
- [ ] The `@rocketh/node` CLI output is unchanged (the getting-started doc test still shows the `- Executing ...` transcript).
- [ ] A test run with no factory hooked stays silent, as today.
- [ ] ADR 0009 is updated per the answer to open question 2, and the two code comments that restate its premise (`rocketh` `src/environment/chains.ts`, `@rocketh/verifier` `src/library-source.ts`) say the same thing.
- [ ] A patch changeset for every package touched.

## Blocked by

- None. Open question 1 may add an upstream `named-logs` release first.

## Prompt

Goal: rocketh's `named-logs` loggers must start printing once a host hooks a factory, even when the host hooks it after rocketh's modules were evaluated. Today they are bound at module load and stay no-ops. Read `docs/adr/0009-user-facing-notices-stay-on-console.md` first: it documents the current behaviour and why user-facing notices stay on `console`, and that rule must survive this change. Read `named-logs`' own source (`node_modules/.pnpm/named-logs@*/node_modules/named-logs/src/index.ts`, about 90 lines; it is small, but read the `src` file rather than running a regex over the minified `dist`). `logs(name, {fallbackOnProxy: true})` is the mechanism. Find every module-scope `logs(` call with a bounded `git grep` over `packages/*/src` and change each. Watch the `decoration` typing (open question 1). The test seam is a recording factory assigned to `globalThis._logFactory` (or `hook()`) AFTER the imports. `packages/rocketh-read-execute/test/unknown-signer-contract.integration.test.ts` shows the current workaround with `vi.hoisted`, and your new test should prove that workaround is no longer needed. Done means the acceptance criteria above hold and the repository's verify gate (`dorfl.json`) passes.

FIRST, check this task against current reality: if `named-logs` changed, or a package now hooks a factory itself, do not build on the stale premise; route the task to needs-attention with the discrepancy.

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report.
