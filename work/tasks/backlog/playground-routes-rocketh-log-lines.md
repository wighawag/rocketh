---
title: "Route rocketh's own log lines into @rocketh/playground's log stream"
slug: playground-routes-rocketh-log-lines
needsAnswers: true
blockedBy: [loggers-honour-a-factory-hooked-later]
covers: []
---

<!-- open-questions -->

## Open questions

1. **May `@rocketh/playground` take `named-logs` as a direct dependency?** Hooking a factory needs either `hook()` from `named-logs` (already in every consumer's tree through rocketh, at `^0.4.1`, but a new direct dependency of this package, which needs the maintainer's approval) or assigning `globalThis._logFactory` directly, which couples the package to an undocumented global of `named-logs` instead of its API.
2. **On by default, or opt-in?** `captureConsole` is per run. Should rocketh's lines reach the stream whenever a run is in flight, or only when the host asks (an option on `createPlayground` or a separate `captureRocketh(logs)` beside `captureConsole`)? The docs widget probably wants them; a tutorial that wants only what the script printed may not.
3. **The new `LogSource`'s name** (`'rocketh'` is the obvious one), and whether rocketh's `warn` / `error` lines map to the existing `'warning'` / `'error'` sources or stay under the new one so a terminal can tell rocketh's warnings from the script's.

<!-- /open-questions -->

## What to build

A reader of the playground sees what the deploy script printed (captured from `console` by `captureConsole`) but never what rocketh itself reports: `- Executing <script>`, `reusing "<name>" at <address>`, the proxy and deploy progress lines. Those go through `named-logs`, and nothing in the playground hooks a factory. `LogSource` (`core/log-stream.ts`) has no member for them either: its members are `playground`, `step`, `script`, `warning`, `error` and `success`.

Give the playground a way to route rocketh's `named-logs` output into its `LogStream`, under a new `LogSource`, so the terminal can colour it apart from the script's own output. Do NOT do it by hooking a factory that writes to `console` (for example `named-logs-console`): `captureConsole` would then label rocketh's lines `'script'`, which misattributes them.

Constraints from `named-logs` (see `loggers-honour-a-factory-hooked-later`): a logger binds to the FIRST factory it finds and keeps it, and the factory is process-global. So hook ONE factory, once, that writes to whichever stream the current run set, and drops (or passes through to a previously hooked factory) when no run is in flight. Runs are already serialised by `createPlayground` because `captureConsole` has the same process-global limit; reuse that boundary.

## Acceptance criteria

- [ ] `LogSource` has a member for rocketh's own lines, documented like the others.
- [ ] A playground run shows rocketh's `- Executing` line and, on a re-run, its `reusing "<name>"` line in the stream, under the new source, in order with the script's own lines.
- [ ] Outside a run, rocketh's lines do not reach a stream, and a factory a host hooked before the playground's is not silently discarded.
- [ ] `captureConsole` still labels only what the script printed as `'script'`.
- [ ] The widget's terminal renders the new source (browser suite).
- [ ] Patch (or minor, if a new export is added) changeset for `@rocketh/playground`.

## Blocked by

- `loggers-honour-a-factory-hooked-later`: until rocketh's loggers honour a factory hooked after load, a factory the playground hooks is too late, because the playground's own core imports rocketh statically.

## Prompt

Goal: the `@rocketh/playground` log stream should carry rocketh's own `named-logs` output under a new `LogSource`, beside what `captureConsole` captures from the deploy script. Read `packages/rocketh-playground/src/core/log-stream.ts`, `core/console-capture.ts` and `core/playground.ts` (where a run captures the console), and `docs/adr/0009-user-facing-notices-stay-on-console.md`. Confirm first that `loggers-honour-a-factory-hooked-later` landed and that a factory hooked after import now reaches rocketh's loggers; if it did not, stop and route this task to needs-attention. Test at the `createPlayground` seam (`test/playground.integration.test.ts` runs the real GreetingsRegistry playground headlessly) and in the browser suite for the terminal. Done means the acceptance criteria hold and the repository's verify gate (`dorfl.json`) passes.

FIRST, check this task against current reality; if it drifted, route it to needs-attention with the discrepancy.

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report.
