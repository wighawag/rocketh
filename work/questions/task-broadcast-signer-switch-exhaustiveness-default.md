<!-- dorfl-sidecar: item=task:broadcast-signer-switch-exhaustiveness-default type=task slug=broadcast-signer-switch-exhaustiveness-default allAnswered=false -->

## Q1

**'task:broadcast-signer-switch-exhaustiveness-default' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm typecheck && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm test && pnpm test:getting-started`; its last output was:
>
> > rocketh-monorepo@0.5.0 typecheck /tmp/dorfl-fresh-gate-LJnM6l/tip
> > pnpm -r --parallel exec tsc --noEmit && pnpm typecheck:tests
> src/errors.ts(19,34): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> src/errors.ts(20,70): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> src/index.ts(65,34): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> src/index.ts(66,43): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> src/index.ts(67,37): error TS2307: Cannot find module '@rocketh/core/json' or its corresponding type declarations.
> src/index.ts(68,53): error TS2307: Cannot find module '@rocketh/core/types' or its corresponding type declarations.
> src/deployment-store.ts(1,36): error TS2307: Cannot find module 'rocketh/types' or its corresponding type declarations.
> src/index.ts(2,43): error TS2307: Cannot find module '@rocketh/core/types' or its corresponding type declarations.
> src/index.ts(12,8): error TS2307: Cannot find module '@rocketh/core/types' or its corresponding type declarations.
> src/index.ts(21,8): error TS2307: Cannot find module 'rocketh' or its corresponding type declarations.
> src/index.ts(22,34): error TS2307: Cannot find module '@rocketh/core/environment' or its corresponding type declarations.
> src/index.ts(25,20): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> undefined
> /tmp/dorfl-fresh-gate-LJnM6l/tip/packages/rocketh-unknown-signer:
>  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 2: tsc --noEmit
> undefined
> undefined
>  ELIFECYCLE  Command failed with exit code 1.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
