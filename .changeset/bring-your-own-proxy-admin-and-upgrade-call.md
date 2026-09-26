---
'@rocketh/proxy': minor
---

Bring your own ProxyAdmin and your own upgrade call: `proxyAdminArtifact` (with `proxyAdminName`) on the `SharedAdmin*` and `custom` proxy kinds deploys or reuses an admin contract of your own, and `upgradeFunction: {methodName, args}` names the upgrade method and its `{proxy}` / `{implementation}` / `{data}` / `{admin}` argument template.
