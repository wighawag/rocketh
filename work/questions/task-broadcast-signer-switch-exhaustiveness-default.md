<!-- dorfl-sidecar: item=task:broadcast-signer-switch-exhaustiveness-default type=task slug=broadcast-signer-switch-exhaustiveness-default allAnswered=false -->

## Q1

**'task:broadcast-signer-switch-exhaustiveness-default' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm typecheck && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm test && pnpm test:getting-started`; its last output was:
>
> > rocketh-monorepo@0.5.0 format:check /tmp/dorfl-fresh-gate-oGaKzg/tip
> > prettier --check "packages/_/{src,test}/\**/_.ts"
> > Checking formatting...
> > [[33mwarn[39m] packages/rocketh-core/src/types.ts
> > [[33mwarn[39m] packages/rocketh/src/environment/index.ts
> > [[33mwarn[39m] Code style issues found in 2 files. Run Prettier with --write to fix.
> >  ELIFECYCLE  Command failed with exit code 1.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):

**CONTINUE from the branch tip — do NOT discard the work and do NOT re-do it.**

The implementation on `work/task-broadcast-signer-switch-exhaustiveness-default` (`6a259e8`) is complete: the `default` branch with an exhaustiveness assignment plus a throw naming the unexpected `signer.type`, a changeset, and the `ready -> done` move. Nothing about the CODE was rejected.

The gate failed at its FIRST step, `pnpm format:check`, on two files, and only one of them belongs to this task:

- `packages/rocketh-core/src/types.ts` — **NOT this task's doing.** The dependency bump in `b34e921` brought a prettier whose union layout differs and left this file unformatted on `main`, so it failed EVERY gate run until `022aacd` fixed it. That fix is now on `main`, so this half is already gone.
- `packages/rocketh/src/environment/index.ts` — **this task's own new code**, genuinely unformatted.

So the remaining work is one `prettier --write` on that second file. Rebase the kept branch onto current `main` (which now carries the `types.ts` fix), run `pnpm format`, and re-run the gate; `format:check` should be clean.

Two things for whoever picks it up: verify the `default` branch still matches the repo idiom (`const exhaustive: never = signer;`, the precedent at `packages/rocketh/src/environment/unknownSignerPolicy.ts:81`) so a future fourth `Signer` variant fails to COMPILE and not merely at runtime; and note that this task's own acceptance asks for BOTH halves, compile-time and runtime, not either one.
