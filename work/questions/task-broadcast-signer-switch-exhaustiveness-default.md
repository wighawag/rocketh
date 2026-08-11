<!-- dorfl-sidecar: item=task:broadcast-signer-switch-exhaustiveness-default type=task slug=broadcast-signer-switch-exhaustiveness-default allAnswered=false -->

## Q1

**'task:broadcast-signer-switch-exhaustiveness-default' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm typecheck && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm test && pnpm test:getting-started`; its last output was:
>
> > rocketh-monorepo@0.5.0 format:check /tmp/dorfl-fresh-gate-oGaKzg/tip
> > prettier --check "packages/*/{src,test}/**/*.ts"
> Checking formatting...
> [[33mwarn[39m] packages/rocketh-core/src/types.ts
> [[33mwarn[39m] packages/rocketh/src/environment/index.ts
> [[33mwarn[39m] Code style issues found in 2 files. Run Prettier with --write to fix.
>  ELIFECYCLE  Command failed with exit code 1.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
