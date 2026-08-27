<!-- dorfl-sidecar: item=task:execute-guard-seam-and-call-kind type=task slug=execute-guard-seam-and-call-kind allAnswered=false -->

## Q1

**'task:execute-guard-seam-and-call-kind' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
> > rocketh-monorepo@0.5.0 format:check /tmp/dorfl-fresh-gate-CHaX10/tip
> > prettier --check .
> Checking formatting...
> [warn] work/tasks/done/execute-guard-seam-and-call-kind.md
> [warn] Code style issues found in the above file. Run Prettier with --write to fix.
>  ELIFECYCLE  Command failed with exit code 1.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
