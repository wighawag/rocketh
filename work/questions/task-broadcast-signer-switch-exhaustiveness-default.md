<!-- dorfl-sidecar: item=task:broadcast-signer-switch-exhaustiveness-default type=task slug=broadcast-signer-switch-exhaustiveness-default allAnswered=false -->

## Q1

**'task:broadcast-signer-switch-exhaustiveness-default' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm typecheck && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm test && pnpm test:getting-started`; its last output was:
>
> > rocketh-monorepo@0.5.0 typecheck /tmp/dorfl-fresh-gate-LJnM6l/tip
> > pnpm -r --parallel exec tsc --noEmit && pnpm typecheck:tests
> > src/errors.ts(19,34): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> > src/errors.ts(20,70): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> > src/index.ts(65,34): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> > src/index.ts(66,43): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> > src/index.ts(67,37): error TS2307: Cannot find module '@rocketh/core/json' or its corresponding type declarations.
> > src/index.ts(68,53): error TS2307: Cannot find module '@rocketh/core/types' or its corresponding type declarations.
> > src/deployment-store.ts(1,36): error TS2307: Cannot find module 'rocketh/types' or its corresponding type declarations.
> > src/index.ts(2,43): error TS2307: Cannot find module '@rocketh/core/types' or its corresponding type declarations.
> > src/index.ts(12,8): error TS2307: Cannot find module '@rocketh/core/types' or its corresponding type declarations.
> > src/index.ts(21,8): error TS2307: Cannot find module 'rocketh' or its corresponding type declarations.
> > src/index.ts(22,34): error TS2307: Cannot find module '@rocketh/core/environment' or its corresponding type declarations.
> > src/index.ts(25,20): error TS2307: Cannot find module '@rocketh/core' or its corresponding type declarations.
> > undefined
> > /tmp/dorfl-fresh-gate-LJnM6l/tip/packages/rocketh-unknown-signer:
> >  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 2: tsc --noEmit
> > undefined
> > undefined
> >  ELIFECYCLE  Command failed with exit code 1.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):

**CONTINUE from the branch tip again — and this bounce, like the last one, was NOT this task's fault.**

The gate failed on `pnpm typecheck` with `Cannot find module '@rocketh/core'` (and siblings) across several packages. That is a REPO bug, now fixed on `main` in `b46a1a6`: `typecheck` resolves cross-package imports through the workspace link to `packages/*/dist/*.d.ts`, which does not exist until `pnpm build` has run, and the gate was running `typecheck` BEFORE `build`. It passed for everyone locally because a local `dist/` is always present; it failed only in a fresh gate worktree. Reproduced by deleting `packages/*/dist` and re-running, then passing again straight after a build. The gate now runs `build` first.

So this task has now been bounced twice by the repo and zero times on its merits: first on a `prettier` reformat of `packages/rocketh-core/src/types.ts` that a dependency bump left behind (fixed in `022aacd`), now on the gate ordering (fixed in `b46a1a6`).

What is actually left, unchanged from the previous answer: the implementation on `work/task-broadcast-signer-switch-exhaustiveness-default` is complete and was never rejected. Rebase onto current `main`, run `pnpm format` (its own `packages/rocketh/src/environment/index.ts` is genuinely unformatted — that part WAS this task's), and re-run the gate.

Before finishing, verify the `default` branch matches the repo idiom (`const exhaustive: never = signer;`, the precedent at `packages/rocketh/src/environment/unknownSignerPolicy.ts:81`), because the acceptance asks for BOTH the compile-time exhaustiveness assignment and the runtime throw naming the unexpected `signer.type` — not either one alone.
