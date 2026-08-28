<!-- dorfl-sidecar: item=task:fork-chain-identity-simulated-versus-connected type=task slug=fork-chain-identity-simulated-versus-connected allAnswered=false -->

## Q1

**'task:fork-chain-identity-simulated-versus-connected' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
>        |  ^
>     552|   /**
>     553|    * The exact thing that was impossible, in the exact shape it bites.
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯
>  FAIL  |@rocketh/export| test/export.test.ts > @rocketh/export - the generated TypeScript compiles for real consumers > lets a consumer read a known chain property without casting
> Error: Test timed out in 5000ms.
> If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
>  ❯ test/export.test.ts:576:2
>     574|  });
>     575|
>     576|  it('lets a consumer read a known chain property without casting', () …
>        |  ^
>     577|   // `properties` is usually `{}`; pinned to `{}` even `undefined` was…
>     578|   const result = typecheck(`
> ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯
>  Test Files  1 failed | 92 passed (93)
>       Tests  2 failed | 1078 passed (1080)
>    Start at  12:07:21
>    Duration  61.54s (transform 288.98s, setup 0ms, import 677.54s, tests 96.72s, environment 18ms)
>  ELIFECYCLE  Test failed. See above for more details.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
