<!-- dorfl-sidecar: item=task:execute-guard-storage-kind type=task slug=execute-guard-storage-kind allAnswered=false -->

## Q1

**'task:execute-guard-storage-kind' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
>   Plugin: builtin:vite-resolve
>  ❯ |@rocketh/export| test/export.test.ts (35 tests | 1 failed) 21244ms
>      × lets a consumer build a chain of the exported type carrying an injected RPC endpoint 5476ms
> ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
>  FAIL  |@rocketh/export| test/export.test.ts > @rocketh/export - the generated TypeScript compiles for real consumers > lets a consumer build a chain of the exported type carrying an injected RPC endpoint
> Error: Test timed out in 5000ms.
> If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
>  ❯ test/export.test.ts:551:2
>     549|  });
>     550|
>     551|  it('lets a consumer build a chain of the exported type carrying an in…
>        |  ^
>     552|   /**
>     553|    * The exact thing that was impossible, in the exact shape it bites.
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
>  Test Files  1 failed | 84 passed (85)
>       Tests  1 failed | 1009 passed (1010)
>    Start at  12:13:55
>    Duration  36.54s (transform 163.64s, setup 0ms, import 358.15s, tests 51.54s, environment 20ms)
>  ELIFECYCLE  Test failed. See above for more details.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
