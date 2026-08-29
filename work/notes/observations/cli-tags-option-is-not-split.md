# The `rocketh` CLI's `--tags` value is never split, so the filter iterates characters

2026-08-29, noticed while adding `--is-fork` (which is mapped after the same spread).

`packages/rocketh-node/src/cli.ts` hands commander's options to core with `...(options as ExecutionParams)`, so `--tags Token` arrives as the STRING `'Token'` while `ExecutionParams.tags` is `string[]`. `createExecutor` then does `for (const tagToFind of resolvedExecutionParams.tags)` (`packages/rocketh/src/executor/index.ts`, ~line 684), which iterates the string's CHARACTERS, so no script tag can ever match and the run appears to select nothing. `hardhat-deploy` does not have this: its task splits (`packages/hardhat-deploy/src/tasks/deploy.ts:87`, `tags: tags?.split(',')`). Not investigated further and not reproduced against a project; out of scope for the `--is-fork` task.
