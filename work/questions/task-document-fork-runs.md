<!-- dorfl-sidecar: item=task:document-fork-runs type=task slug=document-fork-runs allAnswered=false -->

## Q1

**'task:document-fork-runs' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
>        |  ^
>     577|   // `properties` is usually `{}`; pinned to `{}` even `undefined` was…
>     578|   const result = typecheck(`
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯
>  FAIL  |@rocketh/export| test/export.test.ts > @rocketh/export - the generated TypeScript compiles for real consumers > still infers literal contract addresses and ABIs, which is why the output is TypeScript
> Error: Test timed out in 5000ms.
> If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
>  ❯ test/export.test.ts:587:2
>     585|  });
>     586|
>     587|  it('still infers literal contract addresses and ABIs, which is why th…
>        |  ^
>     588|   /**
>     589|    * The widening is deliberately surgical. If it had been done by dro…
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯
>  Test Files  1 failed | 94 passed (95)
>       Tests  3 failed | 1099 passed (1102)
>    Start at  15:50:51
>    Duration  65.01s (transform 360.65s, setup 0ms, import 760.72s, tests 79.47s, environment 21ms)
>  ELIFECYCLE  Test failed. See above for more details.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
