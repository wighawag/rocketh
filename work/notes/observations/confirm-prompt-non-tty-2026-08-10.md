---
title: the CONFIRM prompt has the same non-TTY failure mode the text prompt was just gated for
date: 2026-08-10
status: open
---

`@rocketh/node`'s confirm prompt (`createNodePromptExecutor().prompt`, used by the executor's `askBeforeProceeding` gas-price confirmation and the `--reset` confirmation in `packages/rocketh/src/executor/index.ts`) calls `prompts` the same way the text prompt did, and `prompts@2.4.2` against a non-TTY stdin never settles (measured in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`): with `stdin < /dev/null` the process exits silently, with an open pipe it hangs.

Noticed while gating the TEXT ability on a TTY for `ask-policy-interactive-resolver`; left alone because it is reached only behind `askBeforeProceeding` rather than by default, and it is not that task's surface. Someone should decide whether a non-TTY run should skip the confirmation, fail with a clear message, or require an explicit flag.
