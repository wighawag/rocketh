---
'rocketh': patch
---

Fail with the name of the deployment record that could not be read, instead of a bare `SyntaxError`.

Every deployment record was parsed with no error handling, so a truncated or hand-edited JSON file surfaced as:

```
SyntaxError: Expected property name or '}' in JSON at position 2
```

That answers neither of the two questions the reader has, which file and which environment, and it reached users through every path that loads deployments: the `rocketh` CLI, hardhat-deploy, `rocketh-export` and `rocketh-doc`.

It now names the record, the environment and the folder, keeps the original parse error as `cause`, and says why it stops rather than skipping the file: a deployment rocketh cannot see is one it would **deploy again**, at a new address, silently replacing what the unreadable record described.

`.migrations.json` keeps its existing non-fatal handling, deliberately, and the asymmetry is now pinned by a test. What is lost there is the record of which scripts have run, and those are idempotent by design, so the run continues; the message just has to say so, or a reader watches every script re-run with no explanation. `failed to parse .migrations.json` named neither the environment nor the consequence, and now does both.
