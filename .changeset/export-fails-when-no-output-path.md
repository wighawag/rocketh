---
'@rocketh/export': patch
---

Fail instead of silently doing nothing when no output file was asked for.

The sibling of the "no deployments" no-op, in the same function and with the same shape: `rocketh-export -e localhost` with no `--ts`/`--js`/`--json`/`--tsm`/`--jsm` printed `no filepath to export to are specified` on **stdout** and exited **0**. A chained `deploy && export && dev` therefore carried on with an output file that was never regenerated, which is the same failure the deployments fix addressed, reached by a different route.

It now throws `NoOutputPathError`, and the CLI prints on stderr and exits 1. The message names the environment that was being exported and the flags that would satisfy the request (with the `run()` option names alongside, since the same error reaches a programmatic caller):

```
rocketh-export: no output file specified for the export of environment 'localhost'
  pass at least one of --ts, --js, --json, --tsm, --jsm (tots, tojs, tojson, totsm, tojsm when calling run() directly)
```

The check stays where it was, ahead of loading the environment, so this is reported before "no deployments" when both are true. That is deliberate: it is the caller's own arguments that are wrong, and that is the first thing they have to fix, whatever the deployments hold. A test pins the precedence.

Both failures now share an `ExportError` base class, which is what the CLI branches on: an `ExportError` is reported as a message with exit 1, anything else keeps its stack trace because it means something unexpected went wrong. A base class rather than a union of `instanceof` checks, so a failure added later joins that branch instead of silently falling through to the stack-trace path.

**Is this breaking?** Only for an invocation that passed no output flag, which produced no output before and produces none now; the difference is that it says so. The one caller in this repo that could reach it, `"export": "ldenv rocketh-export -n @@MODE @@"` in `demoes/hardhat-deploy/proxies`, already fails earlier and unrelatedly: it passes `-n`, which was renamed to `-e`, so commander refuses it with `required option '-e, --environment <value>' not specified`. That script needs fixing on its own account and is untouched here.
