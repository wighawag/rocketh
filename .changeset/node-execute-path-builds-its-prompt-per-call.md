---
'@rocketh/node': patch
---

The deploy-script EXECUTE path now builds its prompt executor per call, matching the environment-only loader, so both entry points into `@rocketh/node` decide the text capability from the stdin of the run rather than from stdin at import time. No behaviour change for the CLI or for hardhat-deploy's deploy task (a process's stdin does not become a terminal later, and both already call the same function); it matters for an embedder that imports the module and runs deployments in-process, which could previously observe one capability on the environment path and another on the execute path for the same stdin. A caller-supplied `ExecutionParams.promptExecutor` still wins over both.
