---
'@rocketh/export': patch
---

Fail instead of silently doing nothing when the named environment has no deployments.

`rocketh-export -e nosuchnet --ts ../web/src/lib/deployments.ts` printed `no deployments to export` on **stdout**, exited **0**, and wrote nothing. What made that dangerous is not the missing write on its own: the generated file is the consuming app's source of truth for addresses and ABIs, and it is normally ALREADY THERE from an earlier export against a different environment. So "write nothing and succeed" does not leave the app with no deployments, it leaves it with **another environment's** deployments, silently. The case that prompted this: a project ran `attach sepolia` against an environment with no records, the export no-opped, the dev server came up, and the app talked to localhost addresses while the developer believed they were on Sepolia. Nothing in that chain reported a problem. A typo in `-e` produces exactly the same silence and is the more common way to hit it.

Now `run()` throws `NoDeploymentsError` and the CLI prints a message on **stderr** and exits **1**. Two situations the old single branch collapsed together are now told apart, because the reader's next action differs:

- `reason: 'missing-folder'`: no deployment folder for that environment at all. The message names the path it looked at and lists the environments that DO exist, since a typo is the common cause. If the deployments folder itself is absent it says so, pointing at `-d` / the config's `deployments` rather than at the environment name.
- `reason: 'no-records'`: the folder is there but holds no deployment record. Not a typo, so the message says the folder exists and to deploy first.

Both are fatal, and the exit code is the same for both. They differ in cause but not in consequence: whichever one happened, the consumer is about to read a stale file, and there is nothing useful to write in either case. The message also names the output files that were left in place, because those holding a previous environment's addresses is the actual danger and nothing else in the chain reports it:

```
rocketh-export: no deployments to export for environment 'nosuchnet'
  no such deployment folder: /project/deployments/nosuchnet
  environments found in /project/deployments: localhost, sepolia
  check the name passed to -e, or deploy to 'nosuchnet' first
  nothing was written: /project/web/src/lib/deployments.ts still holds the result of a previous export
```

The failure is raised before any `mkdir` or write, so a failed export leaves every output file byte-identical and creates no directories: half-writing the file on the way to erroring would be worse than the bug being fixed. This is covered by a test, as is the CLI's exit code and stream, which `run()` alone cannot show.

**Is this breaking?** Yes for anyone relying on the silent no-op. It is declared `patch` only because this monorepo forces every pre-1.0 changeset to `patch` (see `scripts/force-patch-changesets.ts`, where a 0.x `minor` cascades peer-dependents to `1.0.0`), not because the change is compatible: an invocation that exited 0 now exits 1. In practice that caller has to be exporting an environment it does not require to exist, for example a loop over several environments in a build script that tolerates gaps. No such caller exists in this repo or in the documented flows: `-e/--environment` is a `requiredOption` and `run(config, environmentName, options)` takes the name as a required argument, so every invocation names exactly one environment and is therefore making a request that deserves an answer. If a tolerant caller does turn up, the fix is a flag to opt back into a warning, not a return to exiting 0 by default.

Also awaited in the CLI, which was calling `run()` without awaiting: any other failure (a missing `.chain` file, for instance) surfaced as an unhandled rejection rather than a reported error.
