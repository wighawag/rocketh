# @rocketh/playground

Run a real rocketh deploy script against a real EVM, in the reader's browser.

This is what powers the **Run** button in the [rocketh documentation](https://rocketh.dev/documentation): press it and the page boots an EVM in your tab, executes an actual deploy script through the actual `@rocketh/deploy` and `@rocketh/proxy` packages, and streams back what the script printed. Nothing is mocked, nothing is recorded, and nothing touches a network.

It exists because rocketh's central claim is that its core is framework-agnostic and browser-capable ([ADR-0002](../../docs/adr/0002-framework-agnostic-browser-capable-core.md)). A page where you watch a deploy script run is a better argument for that than a paragraph.

## Two layers, one seam

| Entry point                    | What it is                                                    | Built by |
| ------------------------------ | ------------------------------------------------------------- | -------- |
| `@rocketh/playground`          | the framework-free core: EVM lifecycle, store, log stream      | `tsc`    |
| `@rocketh/playground/element`  | the `<rocketh-playground>` custom element (Svelte 5, compiled) | `vite`   |

The core has no DOM in it and runs unchanged under node, which is why the deploy pipeline is tested headlessly in `test/` rather than only behind a browser runner. The UI is a consumer of the core's public entry, never the other way round.

## Using the widget

```html
<script type="module">
	import '@rocketh/playground/element';
</script>

<rocketh-playground></rocketh-playground>
```

It is a custom element rather than a component, so it drops into a Vue-rendered VitePress page, a Svelte app, or a plain HTML file with no per-framework wrapper. Styles are in a shadow root, so the host page's CSS cannot leak in and the widget's cannot leak out.

Optional attributes: `heading`, `description`.

The EVM and rocketh (~1.6MB) are behind a dynamic import that only runs on the first **Run** press, so a page carrying the widget does not make every reader download an EVM.

## How the docs site consumes it

The site imports the built `dist`, not the source, so it has to be built before VitePress runs. That is wired into the docs scripts themselves rather than left to CI, so a fresh clone works:

```jsonc
"docs:widgets": "nx build @rocketh/playground", // builds this package and its workspace deps
"docs:dev": "pnpm docs:widgets && vitepress dev",
"docs:build": "pnpm prepare && pnpm docs:widgets && vitepress build",
```

Without it, `vitepress build` fails with `Rolldown failed to resolve import "@rocketh/playground/element"`, and the deployed site would break rather than merely lose the widget.

`docs:widgets` runs ONCE when the dev server starts. While iterating on the core or the components, run `pnpm --filter @rocketh/playground dev` alongside it to rebuild on change.

## Using the core on its own

```typescript
import {createPlayground, greetingsRegistryPlayground} from '@rocketh/playground';

const playground = createPlayground(greetingsRegistryPlayground);

playground.logs.subscribe((entry) => console.log(`[${entry.source}] ${entry.text}`));
playground.vfs.subscribe((change) => {
	if (change.type === 'write') {
		console.log(`wrote ${change.path}`); // deployments/browser/GreetingsRegistry.json
	}
});

const result = await playground.run();
// result.status        'success' | 'failure' — never rejects
// result.deployments   [{name, address, codeSize}] — codeSize is real runtime code
// result.files         deployment-store paths at the end
// result.logs          everything the script and the playground printed
```

`run()` fails a run whose recorded address has **no code at it**. That check is not ceremony: a proxy deployed over a missing implementation records an address quite happily and then answers `0x` to every call, so an address alone proves nothing.

### A different script

`PlaygroundDefinition` is the extension point. Supply your own already-imported deploy-script modules and extensions:

```typescript
const playground = createPlayground({
	environment: 'browser',
	chainId: 31337,
	accounts: {deployer: '0x…'},
	extensions,
	modules: [{id: '001_deploy', module: myDeployScript}],
});
```

Three things about that shape are worth knowing, because each one costs an afternoon to rediscover:

- **`environment` must not be `memory`, `hardhat` or `default`.** rocketh treats those three as ephemeral and forces `saveDeployments` off, so the run would succeed and store nothing. `createPlayground` refuses them rather than let you find out from an empty widget.
- **Accounts are private keys, not indices.** They are configured as `privateKey:0x…` through `@rocketh/signer`. An index-based account resolves through `eth_accounts`, which `embedded-eth-node` deliberately does not implement: it is execution-only, taking signed raw transactions and answering reads.
- **`modules` are imported modules, not source text.** `@rocketh/web` takes `ModuleObject[]`, so deploy scripts are bundled at build time. Letting a reader edit a script needs a compiler in the page, which is a separate problem.

## The contract it deploys

`GreetingsRegistry`, behind a proxy, with the implementation deployed deterministically via `CREATE2`. The artifact is vendored in `src/fixture/` (regenerate with `pnpm artifact:sync`); the header of that file explains why it is a copy rather than a dependency.

The script passes a `"proxy:"` prefix to the constructor and the message reads back **without** it. That is not a bug and it is deliberately not fixed: a constructor runs against the implementation's storage, never the proxy's, and this script passes no `execute: 'init'` to write the proxy's own slot. It is one of the most common proxy mistakes, it is pinned by a test, and it is good tutorial material.

## Testing

```bash
pnpm test          # headless, node, runs in CI and in the root `pnpm test`
pnpm test:browser  # real chromium; needs `pnpm exec playwright install chromium` first
```

The browser suite is opt-in and lives in its own `vitest.browser.config.ts`, which the root runner does not collect (it globs `packages/*/vitest.config.ts` by exact name). A default test command that fails until you download a browser is one people stop running.

It earns its keep. Every bug this widget has had was found in a browser and none by the headless suite: a keyed-list crash that only appeared on the SECOND run, and a `console.error` from rocketh being painted as a failure.

One lesson is baked into the tests themselves. A widget-level "run it twice" test is nearly worthless here, because both runs print identical text: when the keyed-list bug threw, the render froze on the first run's output and the assertions happily passed against the stale DOM. The regression is therefore pinned at the `Terminal` level, where the two runs say different things and a frozen render is detectable. That test was verified to fail with the bug reintroduced.

## Requirements

`embedded-eth-node` **0.4.0 or later**. Earlier versions answered `eth_estimateGas` with gas _consumed_ rather than a usable limit, which silently reverted the inner `CREATE2` and so broke exactly the deterministic deployment this demonstrates.

## Related packages

- [`@rocketh/web`](../rocketh-web) — the browser executor and the observable deployment store
- [`@rocketh/deploy`](../rocketh-deploy), [`@rocketh/proxy`](../rocketh-proxy) — what the deploy script actually calls
- [`@rocketh/signer`](../rocketh-signer) — the `privateKey` signer protocol

## License

[MIT](../../LICENSE)
