---
'rocketh': minor
---

`ExecutionParams.network` is removed. It was an undocumented alias for `environment`, readable only because `getEnvironmentName` reached for it through a cast (`(executionParams as any).network`): it appeared in no type, nothing in this repo passed it, and no documentation mentioned it, so only a JavaScript caller could have been relying on it. Passing it now throws an error naming `environment`, rather than being ignored: ignoring it would turn `{network: 'mainnet'}` into the default in-memory run, so a caller who meant mainnet would get a run that deploys nowhere and reports nothing wrong. A caller still passing `network` should rename it to `environment`, which has always accepted the same value.
