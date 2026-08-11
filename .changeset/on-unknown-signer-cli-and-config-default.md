---
'@rocketh/core': minor
'@rocketh/node': minor
'hardhat-deploy': minor
'rocketh': minor
---

Make the unknown-signer policy reachable from the shell and settable once for every chain.

- **New CLI option on both CLIs:** `rocketh --on-unknown-signer <throw|ask|auto>` and `hardhat deploy --on-unknown-signer <throw|ask|auto>`. Previously the only run-level lever was the programmatic `ExecutionParams.onUnknownSigner`, so there was no way to say "not interactive, just this once" from a terminal. An invalid value is rejected by name rather than silently passed through, and omitting the flag leaves config in charge.
- **Fix: `--skip-prompts` now also forces `throw`** on both CLIs. It is documented as "skip any prompts" but only ever silenced the reset and gas-price confirmations, which was harmless until the interactive resolver landed and made `'auto'` prompt by default on a TTY. It wins over an explicit `--on-unknown-signer ask`, since asking to be prompted and not prompted at once is a contradiction and not prompting is the safe half. (For hardhat-deploy this also covers an in-memory network, where `skipPrompts` is forced on and there is no Safe to execute anything on.)
- **New top-level `onUnknownSigner` in `UserConfig`**, so a repo-wide default is one line instead of one per `chains[id]` entry. Full precedence is now run parameter (including the CLI flag) > chain config > top-level config > the built-in `'auto'`; a more specific setting always wins.

Docs: `@rocketh/unknown-signer` is now documented primarily as an EXTENSION (spread it into `extensions` and call `catchUnknownSigner(() => …)` straight off the deploy-script environment, no `env` threading), with the curried `catchUnknownSigner(env)(…)` form shown for use outside a deploy script.
