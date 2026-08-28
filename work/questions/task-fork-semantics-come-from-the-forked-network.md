<!-- dorfl-sidecar: item=task:fork-semantics-come-from-the-forked-network type=task slug=fork-semantics-come-from-the-forked-network allAnswered=false -->

## Q1

**'task:fork-semantics-come-from-the-forked-network' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
>        |  ^
>     588|   /**
>     589|    * The widening is deliberately surgical. If it had been done by dro…
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/4]⎯
>  FAIL  |@rocketh/export| test/export.test.ts > @rocketh/export - the generated TypeScript compiles for real consumers > reports an error for a genuinely wrong usage, so the check above is not vacuous
> Error: Test timed out in 5000ms.
> If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
>  ❯ test/export.test.ts:605:2
>     603|  });
>     604|
>     605|  it('reports an error for a genuinely wrong usage, so the check above …
>        |  ^
>     606|   // If tsc were silently not running, or not resolving the generated …
>     607|   // assertion above would pass for the wrong reason.
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/4]⎯
>  Test Files  1 failed | 90 passed (91)
>       Tests  4 failed | 1062 passed (1066)
>    Start at  09:30:59
>    Duration  83.94s (transform 461.95s, setup 0ms, import 945.36s, tests 141.78s, environment 19ms)
>  ELIFECYCLE  Test failed. See above for more details.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
