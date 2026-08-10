# What `prompts` does when stdin is not a TTY (measured 2026-08-10)

Measured because the interactive unknown-signer resolver (`onUnknownSigner: 'ask'`, and `'auto'` where a text capability exists) asks a human to paste a transaction hash, and story 5 of `unknown-signer-interactive` requires that a CI run never blocks on that prompt. The question was concrete: if `@rocketh/node` supplies its `promptText` in a non-interactive run, does `prompts` reject (so the resolver's "prompt failed, defer instead" fallback fires), or does it block?

Library: `prompts@2.4.2` (the version pinned in this repo), node 22, called exactly as `@rocketh/node` calls it: `await prompts({type: 'text', name: 'txHash', message: '...'})`.

Reproduce with `probe.mjs` next to this file, run from a package that depends on `prompts` so it resolves (`cd packages/rocketh-node`):

```
P=../../docs/spikes/ask-policy-interactive-resolver/probe.mjs
node $P < /dev/null                  # case 1
sleep 30 | node $P                   # case 2
(printf '0xabc\n'; sleep 5) | node $P   # case 3
```

## Results

| stdin                              | `process.stdin.isTTY` | what `prompts` does                                                                             |
| ---------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| `/dev/null` (immediate EOF)        | `undefined`           | the promise NEVER SETTLES. It neither resolves nor rejects; node then exits when the event loop drains (exit code 13 under a top-level await, silently otherwise) |
| an open pipe with no data          | `undefined`           | HANGS indefinitely (killed at 8s by the probe's timeout)                                          |
| a pipe carrying `0xabc\n`          | `undefined`           | resolves in ~4ms with `{txHash: '0xabc'}` (it reads piped bytes as keystrokes)                     |
| a terminal                         | `true`                | the normal interactive prompt                                                                     |

The prompt still renders its question to stdout in every case, so a CI log shows the question and then either nothing or a hang.

## Consequences taken

- **`prompts` NEVER REJECTS on a non-TTY stdin.** The resolver's "the prompt threw, so defer instead" fallback (`interactiveUnknownSigner.ts`) therefore cannot rescue such a run: there is nothing to catch. Only NOT ASKING can, which is why `createNodePromptExecutor` supplies `promptText` **only when `process.stdin.isTTY`** and a non-TTY run simply has no text capability, degrading to `throw` through the already-tested path. The gate is in the RUNTIME, not in `canPromptForText()`, which stays pure method presence (ADR 0007).
- **Case 1 is worse than a hang**, and worth knowing when reading a CI log: with `stdin < /dev/null` the process exits with no error and no further output, so the run looks like it stopped for no reason.
- **Case 3 is why "there is a pipe" is not a capability.** A pipe would answer, but with whatever bytes happen to be on it, so TTY-ness (not readability) is the right probe.

## Also true of the CONFIRM prompt (not fixed here, out of this task's scope)

`@rocketh/node`'s confirm prompt (`prompt`, used by the executor's `askBeforeProceeding` gas-price and `--reset` confirmations) calls the same library the same way, so it has the same failure mode in a non-TTY run. It is gated behind `askBeforeProceeding` rather than reached by default, so it was left alone here; recorded in `work/notes/observations/confirm-prompt-non-tty-2026-08-10.md`.
