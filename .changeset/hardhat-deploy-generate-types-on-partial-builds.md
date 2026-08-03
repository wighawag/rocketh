---
'hardhat-deploy': patch
---

Regenerate the typed artifacts after every successful contracts build, not only after full builds. The generation was hooked on `onCleanUpArtifacts`, which hardhat only triggers when the build performs an artifact cleanup, i.e. for a full build. The `deploy` task builds with `noTests: true`, which is not a full build, so the hook never fired during a deployment: solidity was recompiled with the `production` profile and `artifacts/` was up to date, but the generated typed artifacts that the deployment scripts actually import kept the content of the last full build (typically the `default` profile, optimizer off). Deployments could therefore ship unoptimized or outright stale bytecode.

Generation now runs from `processArtifactsAfterSuccessfulBuild`, and the deprecated `onCleanUpArtifacts` hook is no longer registered. That hook was introduced in hardhat `3.6.0`, so the `hardhat` peer dependency moves from `^3.4.5` to `^3.6.0`.
