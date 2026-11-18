# Spike: solc and webevm in workers, a real rocketh deploy script, one page

Throwaway evidence for the proposed spec `work/specs/proposed/playground-app.md`. Not built by the workspace, not published, not meant to be merged.

## What it does

One page (`index.html`, `src/main.ts`):

1. compiles `Greeter.sol` with solc 0.8.30 in a classic worker (`src/solc.worker.ts`), the compiler fetched at run time from `binaries.soliditylang.org`;
2. boots webevm 0.9.1 in a module worker (`src/node.worker.ts`, one line: `import 'webevm/worker-entry'`) and drives it with `createWorkerNode` from `webevm/worker-client`;
3. runs an ordinary rocketh deploy script (`src/deploy/001_deploy_greeter.ts`, `deployScript` from `setupDeployScripts`, `deploy` from `@rocketh/deploy`) through `@rocketh/web`'s `setupEnvironment(...).loadAndExecuteDeploymentsFromModules`, with `request` of the worker node as the EIP-1193 provider and a `createVFSDeploymentStore()` as the store;
4. prints the deployment record as rocketh saved it (`deployments/playground/Greeter.json` in the store's VFS).

`measure.mjs` serves the build with `vite preview`, drives it with headless Chromium (Playwright 1.62.1 from `packages/rocketh-playground`), prints the page's timings and every byte it fetched, and stops the server.

```bash
pnpm install   # its own pnpm root; the rocketh packages are linked from ../../../packages (build them first)
pnpm build
node measure.mjs
```

## Measured (2026-11-18, headless Chromium 1.62.1 on Linux x64, fast network, cold browser cache)

| Phase                                                       | Time    |
| ----------------------------------------------------------- | ------- |
| fetch + instantiate soljson 0.8.30 in the worker            | 847 ms  |
| first compile of `Greeter.sol` (optimizer on)               | 210 ms  |
| a second compile, warm                                      | 230 ms  |
| boot webevm in its worker                                   | 63 ms   |
| run the deploy script (estimate, sign, send, receipt, save) | 24 ms   |
| click to record printed                                     | 1390 ms |

| Asset                                                                               | Raw    | Over the wire                                   |
| ----------------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `soljson-v0.8.30+commit.73712a01.js` (from binaries.soliditylang.org)               | 9.6 MB | 6.7 MB (brotli), `cache-control: max-age=14400` |
| page bundle (`@rocketh/web`, `rocketh`, `@rocketh/deploy`, `@rocketh/signer`, viem) | 272 KB | 93 KB gzip                                      |
| webevm worker bundle                                                                | 488 KB | 145 KB gzip                                     |
| solc worker bundle                                                                  | 0.5 KB | 0.3 KB                                          |

The compiler is 95% of the bytes. Everything rocketh and the chain need is under 250 KB gzip.

## What broke, or nearly did

- **Nothing failed in the run.** The deploy script, written exactly as in a project, deployed and saved a normal record (`address`, `abi`, `bytecode`, `deployedBytecode`, `metadata`, `argsData`, `transaction`, `receipt`) and a `.chain` file.
- **soljson needs a CLASSIC worker.** It is an emscripten script that defines a global `Module`, loaded with `importScripts`, which a module worker does not have. Vite emits a classic worker for `new Worker(url)` without `{type: 'module'}`. The solc-js wrapper (npm `solc`) is not needed: `Module.cwrap('solidity_compile', 'string', ['string', 'number', 'number'])` with a null import callback compiles a self-contained source. Imports (OpenZeppelin, a second file) need that callback, which is synchronous: every file must be in memory before the compile starts.
- **The environment name matters.** `memory`, `hardhat` and `default` are treated as ephemeral and save nothing, so the record would be empty; the spike uses `playground`, as `packages/rocketh-playground` does.
- **Accounts must be private keys.** webevm signs nothing and has no `eth_accounts`, so `deployer: 0` cannot resolve; `privateKey:0x...` with the `privateKey` signer protocol works, and the address needs a genesis balance (`initialBalances`).
- **A runtime artifact is untyped.** The compiled artifact is filled into a registry (`src/artifacts.ts`) after compilation, so the deploy script's `artifact:` is not the `as const` object a project's generated `artifacts` give, and TypeScript cannot check `args` against the constructor. The spike casts; a playground needs either generated `.d.ts` for the editor or to accept the loss.
- **The deploy script here is bundled, not typed in by a user.** Running source text the reader edits needs a transpiler and a module map for `../rocketh/deploy.js`, `@rocketh/*` and the artifacts; that is the next thing to measure, not done here.
- **Workspace hygiene.** The spike is its own pnpm root (`pnpm-workspace.yaml` with no packages) so its dependencies (`webevm`, `comlink`, `vite`, `viem`) stay out of the rocketh workspace, and pnpm 11 needs `allowBuilds: {esbuild: false}` before it finishes the install.
