# User-facing notices stay on `console`, not on the `named-logs` logger

`AGENTS.md` tells agents to log through `named-logs` (`logs('rocketh')`), and most diagnostic logging in `packages/rocketh` does. A USER-FACING NOTICE about a recoverable condition is the exception and must stay on `console.warn`, because `named-logs` is opt-in in a way that silently deletes the message for most consumers.

## Why

`logs(namespace)`, called without `options.fallbackOnProxy` (which is how every logger in this repo is built), returns a permanent no-op logger unless something has already hooked a factory. Two things establish that, both checked against the installed `named-logs@0.4.1` / `named-logs-console@0.5.1`:

- with no factory hooked, `logger.info/warn/error` print nothing at all;
- the hook must be in place BEFORE the `logs()` call is evaluated. Importing `named-logs-console` afterwards does not rescue it, even followed by `hookup()` and `setupLogger()`, because the returned object is the frozen no-op rather than a lazy proxy.

What saves the CLI is that `packages/rocketh-node/src/cli.ts` imports `named-logs-console` first, and that package sets `globalThis._logFactory` at module-evaluation time. Only that CLI and `hardhat-deploy` do this. Every other consumer, meaning programmatic embedders, `@rocketh/web` in the browser, `@rocketh/playground`, and the vitest suites, has no factory and would lose the message entirely. Those are precisely the consumers who hit the branch this rule was written for (`getChainConfigFromUserConfig`'s missing-chain-info notice), since `@rocketh/node` pre-fills chain info from viem for all ~699 registry ids.

A second reason: routing through the logger would make the notice suppressible by `--log-level error` and by `NAMED_LOGS_LEVEL`, which is right for debug chatter and wrong for a notice saying that placeholder chain metadata is about to reach a frontend export.

## Consequences

Severity is chosen by rocketh, not by a global log level, and the notice survives in every runtime. `console.warn` and `console.error` both go to stderr in Node, so moving a line between them keeps it greppable and keeps redirects working; what changes is only how severity-classifying tooling labels it. The cost is that these notices cannot be silenced per namespace: the intended way to silence this one is to describe the chain, not to turn the logging down.
