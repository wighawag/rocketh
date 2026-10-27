# @rocketh/playground

Run real rocketh deploy scripts against a real EVM, in the reader's browser, as a widget. It powers the stepped tutorial on the [rocketh introduction](https://rocketh.dev/documentation/#try-it-here): press **Start** and the page boots an EVM in the tab and walks four deploy scripts through the actual `@rocketh/deploy` and `@rocketh/proxy`, streaming what each printed. Nothing is mocked and nothing touches a network.

It has two entry points: `@rocketh/playground`, the framework-free core (EVM lifecycle, deployment store, log stream), and `@rocketh/playground/element`, the `<rocketh-playground>` custom element built on it.

## Installation

```bash
pnpm add @rocketh/playground rocketh
# or
npm install @rocketh/playground rocketh
```

`rocketh` is a peer dependency.

## Using the widget

```html
<script type="module">
	import '@rocketh/playground/element';
</script>

<rocketh-playground></rocketh-playground>
```

It is a custom element, so it drops into any framework or a plain HTML file. Styles are in a shadow root, so the host page's CSS cannot leak in and the widget's cannot leak out.

Optional attributes: `heading`, `description`.

The EVM and rocketh (~1.6MB) are behind a dynamic import that only runs on the first **Start** press, so a page carrying the widget does not make every reader download an EVM.

## Using the core, or your own tutorial

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
	// result.status        'success' | 'failure' (it never rejects)
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

## Documentation

- [The playground, and what its four steps show](https://rocketh.dev/documentation/#try-it-here)
- [Run deploy scripts in a browser](https://rocketh.dev/documentation/browser/): `@rocketh/web`, which this is built on
- Working on this package: [CONTRIBUTING.md](https://github.com/wighawag/rocketh/blob/main/CONTRIBUTING.md#the-playground-rocketh-playground)

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
