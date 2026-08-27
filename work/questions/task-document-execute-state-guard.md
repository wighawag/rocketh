<!-- dorfl-sidecar: item=task:document-execute-state-guard type=task slug=document-execute-state-guard allAnswered=false -->

## Q1

**'task:document-execute-state-guard' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
>   Plugin: builtin:vite-resolve
>  ❯ |@rocketh/export| test/export.test.ts (35 tests | 1 failed) 30915ms
>      × lets a consumer build a chain of the exported type carrying an injected RPC endpoint 7709ms
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
>  Test Files  1 failed | 87 passed (88)
>       Tests  1 failed | 1040 passed (1041)
>    Start at  14:57:19
>    Duration  55.40s (transform 253.96s, setup 0ms, import 577.49s, tests 79.86s, environment 23ms)
>  ELIFECYCLE  Test failed. See above for more details.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
