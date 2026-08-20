# @rocketh/playground

Run real rocketh deploy scripts against a real EVM, in the reader's browser.

This is what powers the stepped tutorial in the [rocketh documentation](https://rocketh.dev/documentation/): press **Start** and the page boots an EVM in your tab, then walks four actual deploy scripts through the actual `@rocketh/deploy` and `@rocketh/proxy` packages, streaming back what each one printed. Nothing is mocked, nothing is recorded, and nothing touches a network.

The four steps deploy a contract behind a proxy, expose a bug in it, upgrade the implementation to fix it, and show what survived the upgrade. All four run against **one** chain and **one** deployment store, which is the only reason the upgrade means anything: step 3 has to find the proxy step 1 deployed.

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

## Publishing

Published as `@rocketh/playground`. The docs site does not go through the registry (it consumes the package through the pnpm workspace), so a release only matters for outside consumers embedding the widget.

Two things about this repo's release flow bit us once each, and both are worth knowing before you touch versioning here:

- **npm Trusted Publishing (OIDC) cannot create a brand-new package.** npm ties a trusted publisher to an already-existing package, so the first publish of any new package in this repo has to be done by hand (`npm publish --access public`) and the trusted publisher registered on npmjs.com afterwards. Until that is done, `changeset publish` fails the entire release job with `E404 Not Found - PUT /@rocketh%2f<name>`, taking the other packages' release down with it.
- **An empty changeset sitting on `main` silently blocks publishing.** `changesets/action` takes the version/PR path whenever any changeset file exists. If every one of them is empty it logs `All changesets are empty; not creating PR` and exits WITHOUT publishing, so a package whose version is ahead of the registry stays unpublished with a green release job. The publish path only runs when there are no changeset files at all. So an empty changeset needs a real one alongside it, or it has to be consumed, before anything can ship.

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

playground.logs.subscribe((change) => {
	if (change.type === 'append') {
		console.log(`[${change.entry.source}] ${change.entry.text}`);
	}
});
playground.vfs.subscribe((change) => {
	if (change.type === 'write') {
		console.log(`wrote ${change.path}`); // deployments/browser/GreetingsRegistry.json
	}
});

while (!playground.isFinished()) {
	const result = await playground.runNextStep();
	// result.status        'success' | 'failure' — never rejects
	// result.deployments   [{name, address, codeSize, change, changedAtStep}]
	// result.files         deployment-store paths after this step
	// result.logs          the whole transcript so far
}

await playground.reset(); // new chain, empty store, back to step one
```

Two things about `runNextStep` are worth knowing:

- It **fails a step whose recorded address has no code at it**. That check is not ceremony: a proxy deployed over a missing implementation records an address quite happily and then answers `0x` to every call, so an address alone proves nothing.
- A failed step **does not advance**, so pressing the button again retries it.

`change` is `new` / `changed` / `unchanged` relative to the previous step, and `changedAtStep` is the 1-based step at which that address last moved. The second exists because the first is transient: the implementation reads `changed` during the upgrade and `unchanged` immediately after, so a UI with only `change` loses the point of the tutorial on the very next click.

### A different tutorial

`PlaygroundDefinition` is the extension point. Supply your own steps, each holding already-imported deploy-script modules:

```typescript
const playground = createPlayground({
	environment: 'browser',
	chainId: 31337,
	accounts: {deployer: '0x…'},
	extensions,
	steps: [
		{id: '001_deploy', label: 'Deploy it', modules: [{id: '001_deploy', module: myDeployScript}]},
		{id: '002_use', label: 'Use it', modules: [{id: '002_use', module: myInteractionScript}]},
	],
});
```

A step is nothing but deploy-script modules, **including** the steps that only make a call. That is deliberate: a deploy script really does interact with what it deployed, so keeping one mechanism means the tutorial never shows a reader a kind of code that rocketh does not actually have.

Three things about that shape are worth knowing, because each one costs an afternoon to rediscover:

- **`environment` must not be `memory`, `hardhat` or `default`.** rocketh treats those three as ephemeral and forces `saveDeployments` off, so the run would succeed and store nothing. `createPlayground` refuses them rather than let you find out from an empty widget.
- **Accounts are private keys, not indices.** They are configured as `privateKey:0x…` through `@rocketh/signer`. An index-based account resolves through `eth_accounts`, which `webevm` deliberately does not implement: it is execution-only, taking signed raw transactions and answering reads.
- **`modules` are imported modules, not source text.** `@rocketh/web` takes `ModuleObject[]`, so deploy scripts are bundled at build time. Letting a reader edit a script needs a compiler in the page, which is a separate problem.

## The contracts it deploys

Two implementations of the same registry, behind one proxy.

| Implementation | Origin | Regenerate with |
| --- | --- | --- |
| `GreetingsRegistry` | vendored verbatim from `template-ethereum-contracts@0.0.3` | `pnpm artifact:sync` |
| `GreetingsRegistryV2` | ours, in `contracts/` | `pnpm contracts:compile` |

The origins differ on purpose. v1 is kept exactly as published so its provenance stays "the real template contract", bug included. The template has no v2, so that one is ours, and its source lives in `contracts/` precisely so the code the tutorial **shows** is provably the code it **runs**.

`contracts:compile` shells out to `solc` and is **not** an npm dependency, the same way `artifact:sync` shells out to `npm` and `tar`. Artifacts are committed, so you only need solc to change a contract, never to use the package.

### The bug, and why it stays

v1 passes a `"proxy:"` prefix to its **constructor**, and greetings read back without it. That is not a bug in rocketh or in the proxy, and it is deliberately not fixed: a constructor runs against the *implementation's* storage, never the proxy's, so the proxy's own `_prefix` slot is never written. v2 fixes it by setting the prefix through a `postUpgrade` call that rocketh makes **through the proxy** during the upgrade.

v2 also only ever **appends** storage variables (`_prefixInitialized` at slot 2, leaving `_prefix` and `messages` where v1 put them). Reordering them, or inserting one above `messages`, would leave the new code reading the old slots and silently reinterpret every greeting anyone had stored.

## Testing

```bash
pnpm test          # headless, node, runs in CI and in the root `pnpm test`
pnpm test:browser  # real chromium; needs `pnpm exec playwright install chromium` first
```

The browser suite is opt-in and lives in its own `vitest.browser.config.ts`, which the root runner does not collect (it globs `packages/*/vitest.config.ts` by exact name). A default test command that fails until you download a browser is one people stop running.

It earns its keep. Every bug this widget has had was found in a browser and none by the headless suite: a keyed-list crash that only appeared on the SECOND run, and a `console.error` from rocketh being painted as a failure.

One lesson is baked into the tests themselves. A widget-level "run it twice" test is nearly worthless here, because both runs print identical text: when the keyed-list bug threw, the render froze on the first run's output and the assertions happily passed against the stale DOM. The regression is therefore pinned at the `Terminal` level, where the two runs say different things and a frozen render is detectable. That test was verified to fail with the bug reintroduced.

## Requirements

`webevm` **0.5.0 or later**. This package was formerly published as `embedded-eth-node`, whose last release under the old name was 0.4.0; `webevm@0.5.0` continues that version line and is otherwise identical. Releases before that answered `eth_estimateGas` with gas _consumed_ rather than a usable limit, which silently reverted the inner `CREATE2` and so broke exactly the deterministic deployment this demonstrates.

## Related packages

- [`@rocketh/web`](../rocketh-web) — the browser executor and the observable deployment store
- [`@rocketh/deploy`](../rocketh-deploy), [`@rocketh/proxy`](../rocketh-proxy) — what the deploy script actually calls
- [`@rocketh/signer`](../rocketh-signer) — the `privateKey` signer protocol

## License

[MIT](../../LICENSE)
