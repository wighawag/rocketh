---
'@rocketh/web': minor
---

Give the browser a deployment store that actually stores, with optional IndexedDB persistence.

`@rocketh/web` previously bound a no-op store whose every method body was commented out: writes were swallowed, `readFile` returned `''`, `listFiles` returned `[]`. Nothing a deploy script saved survived the call.

**The default store now retains deployments** for the lifetime of the page (`createVFSDeploymentStore()`). This is a behaviour change: code that relied on writes being discarded should now pass `createEmptyDeploymentStore()` explicitly.

New exports:

- `createVFSDeploymentStore(vfs?)` - a `DeploymentStore` over an in-memory file system, mirroring `@rocketh/node`'s `createFSDeploymentStore()` semantics, including which calls throw (`loadDeploymentsFromStore` reads a throwing `listFiles` as "never deployed here", so the distinction is load-bearing).
- `createIndexedDBDeploymentStore(options?)` - the same store, persisted. Async, because it loads what IndexedDB already holds before returning.
- `createMemoryVFS()`, `createPersistentVFS()`, `createIndexedDBPersistence()`, `createMemoryPersistence()` - the pieces underneath. A persistent VFS reports every failed write through `onSaveError` (defaulting to `console.error`) so a caller that never awaits `flush()` cannot lose data silently, and `dispose()` unsubscribes it. The persistence adapter is injected, so the durability behaviour is testable outside a browser, and its shape matches `embedded-eth-node`'s adapter so an app configures both the same way.
- `getDefaultDeploymentStore()` - reach the store used when none is passed.
- Every store exposes its `vfs`, which is observable (`subscribe`) and snapshottable (`snapshot`/`restore`), so a UI can watch `deployments/<env>/Foo.json` appear as a script runs.

`setupEnvironment(config, extensions, options?)` takes an optional `{deploymentStore}`.

`loadDeploymentsFromIndexedDB` is deprecated: it never touched IndexedDB, it reads the store bound to the module. Use `loadDeploymentsFromStore(store, ...)` from `rocketh` with a store you built.
