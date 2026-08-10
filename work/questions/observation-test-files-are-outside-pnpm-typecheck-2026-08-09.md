<!-- dorfl-sidecar: item=observation:test-files-are-outside-pnpm-typecheck-2026-08-09 type=observation slug=test-files-are-outside-pnpm-typecheck-2026-08-09 allAnswered=false -->

Item: [`observation:test-files-are-outside-pnpm-typecheck-2026-08-09`](../notes/observations/test-files-are-outside-pnpm-typecheck-2026-08-09.md)

## Q1

**Should each package grow a tsconfig.test.json (extending tsconfig.json with include of test/**) plus a typecheck step wired into the verify gate, or is leaving test files outside typecheck the intentional posture?**

> Observation body's closing paragraph frames this as the open decision: 'A repo-wide decision (a tsconfig.test.json per package plus a typecheck step in the gate, or nothing) belongs to whoever owns the build config.' Verified against current reality: every packages/*/tsconfig.json uses include: ['src/**/*.ts'], root script is 'typecheck': 'pnpm -r --parallel exec tsc --noEmit', and the verify gate (package.json scripts) runs format:check + changeset status + build + test + test:getting-started with no typecheck. Vitest does not type-check either. Consequence flagged: @ts-expect-error directives in tests (e.g. the compile-time half of the thunk-only divergence in @rocketh/unknown-signer) read as assertions but nothing enforces them.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
