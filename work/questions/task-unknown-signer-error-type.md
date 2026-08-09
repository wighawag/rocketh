<!-- dorfl-sidecar: item=task:unknown-signer-error-type type=task slug=unknown-signer-error-type allAnswered=false -->

## Q1

**'task:unknown-signer-error-type' was bounced — how should we proceed?**

> PR/code review (Gate 2) blocked this work:
> - pnpm-lock.yaml has an unrelated 'my-rocketh-project' importer (typescript ^6.0.3, @types/node ^26, hardhat ^3.6.0, forge-std, links to workspace packages) that is NOT in pnpm-workspace.yaml and has no directory in the repo. This is lockfile pollution from an ambient scratch project the agent ran pnpm in — please revert the pnpm-lock.yaml portion of the diff. Risk: .github/workflows/release.yml runs 'pnpm install --frozen-lockfile' and this stray importer can fail there; regardless it is a 50-line unrelated churn that should not land with an error-class task. (git diff main -- pnpm-lock.yaml shows +my-rocketh-project importer; pnpm-workspace.yaml only lists packages/* and website; no ./my-rocketh-project dir exists.)
> PR/code review (Gate 2) did not reach a unanimous approve across reviewMaxRounds=2 round(s) (a block is terminal and is never re-rolled); forcing needs-attention (never silently merged or looped).

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
