---
'rocketh': minor
---

`ExecutionParams.network` is removed. It was an alias for `environment`, readable only because `getEnvironmentName` reached for it through a cast (`(executionParams as any).network`): it appeared in no type, so only a JavaScript caller (or one casting) could have been passing it. It was not entirely undocumented, and that is the migration note that matters: `@rocketh/node`'s own README used it in its "then in a test" snippet, which is corrected in this same release. Passing it now throws an error naming `environment`, rather than being ignored: ignoring it would turn `{network: 'mainnet'}` into the default in-memory run, so a caller who meant mainnet would get a run that deploys nowhere and reports nothing wrong. A caller still passing `network` should rename it to `environment`, which has always accepted the same value.
