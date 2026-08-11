---
'@rocketh/node': minor
---

**New refusal:** the confirm prompt now fails with a clear message when stdin is not a terminal, instead of hanging. `prompts@2.4.2` against a non-TTY stdin never settles (`/dev/null` exits the process silently, an open pipe hangs for ever), which is why the text ability is already withheld without a TTY. The confirm could not take that route: nothing branches on `prompt` being present, and both call sites (the `--reset` confirmation and the gas-price confirmation, both behind `askBeforeProceeding`) read "not confirmed" as `exit()`, so silently answering would either destroy deployments nobody agreed to destroy or abort a run for a question nobody was asked. The error names the question it could not ask and points at `--skip-prompts`, which skips every confirmation.
