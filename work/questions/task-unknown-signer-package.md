<!-- dorfl-sidecar: item=task:unknown-signer-package type=task slug=unknown-signer-package allAnswered=false -->

## Q1

**'task:unknown-signer-package' was bounced — how should we proceed?**

> PR/code review (Gate 2) blocked this work:
> - The headline example calls execute(env) with THREE arguments, passing the call args as a positional array. The real signature takes TWO: execute(env)(deployment, args) where args is the options bag and the call arguments live inside it as args. The snippet as written does not compile, and it appears in the published package README, in documentation.md and in the module JSDoc. Correct form: execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}). (packages/rocketh-read-execute/src/index.ts:112-125 (execute takes deployment + ExecutionArgs, where ExecutionArgs = Omit<WriteContractParameters,...> & {account, message?} and so carries args). Wrong snippet at documentation.md:475, packages/rocketh-unknown-signer/README.md:9, packages/rocketh-unknown-signer/src/index.ts JSDoc example.)
> PR/code review (Gate 2) did not reach a unanimous approve across reviewMaxRounds=2 round(s) (a block is terminal and is never re-rolled); forcing needs-attention (never silently merged or looped).

<!-- q1 fields: id=q1 kind=stuck -->

**Your answer** (write below this line):
