<!-- dorfl-sidecar: item=task:execute-guard-equals-and-output-selection type=task slug=execute-guard-equals-and-output-selection allAnswered=false -->

## Q1

**'task:execute-guard-equals-and-output-selection' was bounced — how should we proceed?**

> acceptance gate failed (exit 1) on the rebased tip — the failing step was: `pnpm format:check && pnpm sync:template:check && { [ "$GITHUB_HEAD_REF" = "changeset-release/main" ] && echo 'skip changeset status on the Version PR (it consumes changesets)' || pnpm changeset status --since=main; } && pnpm build && pnpm typecheck && pnpm test && pnpm test:getting-started`; its last output was:
>
> > hardhat-deploy-demoes-governance@0.0.1-next.0 build /home/wighawag/.dorfl/work/github-com__wighawag__rocketh__execute-guard-equals-and-output-selection/demoes/hardhat-deploy/governance
> > hardhat compile
> No contracts to compile
>  NX   Successfully ran target build for 23 projects
> Nx read the output from the cache instead of running the command for 23 out of 23 tasks.
>   Run duration:      663ms
>   Cache:             23/23 hit (100%)
>   Critical path:     248ms (8 tasks)
>   Recoverable time:  <1ms
> > rocketh-monorepo@0.5.0 typecheck /tmp/dorfl-fresh-gate-COykaO/tip
> > pnpm -r --parallel exec tsc --noEmit
> rocketh/deploy.ts(10,28): error TS2307: Cannot find module '../generated/artifacts/index.js' or its corresponding type declarations.
> rocketh/environment.ts(12,28): error TS2307: Cannot find module '../generated/artifacts/index.js' or its corresponding type declarations.
> rocketh/deploy.ts(10,28): error TS2307: Cannot find module '../generated/artifacts/index.js' or its corresponding type declarations.
> rocketh/environment.ts(12,28): error TS2307: Cannot find module '../generated/artifacts/index.js' or its corresponding type declarations.
> undefined
> /tmp/dorfl-fresh-gate-COykaO/tip/demoes/hardhat-deploy/proxies:
>  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 2: tsc --noEmit
> undefined
>  ELIFECYCLE  Command failed with exit code 1.

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
