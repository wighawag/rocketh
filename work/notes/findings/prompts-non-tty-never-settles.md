---
title: '`prompts@2.4.2` never settles when stdin is not a TTY (it does not reject either)'
slug: prompts-non-tty-never-settles
source: 'measured by docs/spikes/ask-policy-interactive-resolver/probe.mjs @ 1bd0758, against prompts@2.4.2 on node v22.14.0, 2026-08-10'
---

# `prompts` on a non-TTY stdin never settles, and never rejects

External ground truth about a third-party library, established by measurement rather than by reading its docs. It is **load-bearing**: `@rocketh/node` withholds a capability BECAUSE of it, so this finding exists to stop the next reader re-litigating the measurement or reversing the behaviour it justifies.

## What was measured

`prompts@2.4.2` called exactly as `@rocketh/node` calls it (`await prompts({type: 'text', name: 'txHash', message: '...'})`), on node v22.14.0, across four kinds of stdin:

| stdin                       | `process.stdin.isTTY` | what `prompts` does                                                                                                                   |
| --------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/dev/null` (immediate EOF) | `undefined`           | the promise **never settles** — neither resolves nor rejects. Node then exits when the event loop drains, with no error and no output |
| an open pipe with no data   | `undefined`           | **hangs** indefinitely                                                                                                                |
| a pipe carrying `0xabc\n`   | `undefined`           | resolves in ~4ms with `{txHash: '0xabc'}` — it reads piped bytes as keystrokes                                                        |
| a terminal                  | `true`                | the normal interactive prompt                                                                                                         |

In every case the question is still rendered to stdout, so a CI log shows the prompt and then either nothing or a hang.

## Why it is load-bearing

**It never REJECTS.** A `try`/`catch` around the call therefore cannot rescue a non-interactive run — there is nothing to catch, and the "the prompt threw, so defer instead" fallback in the interactive unknown-signer resolver can never fire. Only NOT ASKING can.

That is why `createNodePromptExecutor` supplies `promptText` **only when `process.stdin.isTTY`**, leaving a non-TTY run with no text capability at all, so the unknown-signer policy degrades to `throw` through the already-tested path. The gate lives in the RUNTIME rather than inside `canPromptForText()`, which stays pure method presence (`docs/adr/0007-prompt-capability-on-the-environment-not-the-executor.md`).

Two corollaries that are easy to get wrong:

- **"There is a readable pipe" is NOT a capability.** A pipe answers, but with whatever bytes happen to be on it. TTY-ness, not readability, is the right probe.
- **The `/dev/null` case is worse than a hang.** The process exits with no error and no further output, so the run looks like it stopped for no reason.

The same library call underlies the CONFIRM prompt, which has the same failure mode; that one answers it by REFUSING with a clear message rather than by withholding the ability, because nothing branches on a confirm's presence and both of its call sites read "not confirmed" as `exit()`.

## Evidence

`docs/spikes/ask-policy-interactive-resolver/` holds the probe script and the raw write-up. Re-run from a package that depends on `prompts`:

```
cd packages/rocketh-node
P=../../docs/spikes/ask-policy-interactive-resolver/probe.mjs
node $P < /dev/null                     # never settles, silent exit
sleep 30 | node $P                      # hangs
(printf '0xabc\n'; sleep 5) | node $P   # reads the pipe as keystrokes
```
