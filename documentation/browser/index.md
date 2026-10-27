# Run deploy scripts in a browser

rocketh's core reads no file and needs no Node API, so your deploy scripts run in a browser unchanged. `@rocketh/web` is the browser's executor adapter, as `@rocketh/node` is Node's: you hand it the scripts as modules (a browser cannot list a folder) and a store for the records (a browser has no `deployments/` folder). The [playground on the introduction page](../#try-it-here) is exactly this, running four real scripts against an EVM in your tab.

Two uses come up in practice:

- **Deploying from an app**, through the user's wallet: an in-app deployment, a tool that deploys contracts for its users, a dashboard.
- **Booting a local chain in the tab** and deploying your real system on it: an offline mode, a demo, a game world that needs no node. Running the real scripts there, rather than loading a state dump baked at build time, means nothing goes stale when the contracts change.

## Setting it up

```bash
pnpm add @rocketh/web rocketh
```

`setupEnvironment` takes your config object and your extensions directly (there is no config file to read), so import them from your `rocketh/config.ts`:

```typescript
import {setupEnvironment, createVFSDeploymentStore} from '@rocketh/web';
import {config, extensions} from './rocketh/config.js';
import deployGreetingsRegistry from './deploy/001_deploy_greetings_registry.js';

const {loadAndExecuteDeploymentsFromModules, loadEnvironment} = setupEnvironment(config, extensions, {
	deploymentStore: createVFSDeploymentStore(),
});

const env = await loadAndExecuteDeploymentsFromModules(
	[{id: '001_deploy_greetings_registry', module: deployGreetingsRegistry}],
	{environment: 'sepolia', provider: window.ethereum},
);
```

The modules are run in the order given, with their tags and dependencies applied as in a Node run; `id` names each script in logs. The execution parameters are the same as everywhere else (`tags`, `saveDeployments`, `askBeforeProceeding`, `autoMine`, ...), and the run's arguments are the third parameter, as for [`loadAndExecuteDeploymentsFromFiles`](../deploy-scripts/#arguments-one-run-different-parameters).

`loadEnvironment(params)` builds the environment without running anything, to read deployments and call contracts:

```typescript
const env = await loadEnvironment({environment: 'sepolia', provider: window.ethereum});
const registry = env.get('GreetingsRegistry');
```

## Where the records go

Pick the store explicitly:

| Store                                      | Survives a reload | For                                          |
| ------------------------------------------ | ----------------- | -------------------------------------------- |
| `createVFSDeploymentStore()` (the default) | no                | one-off runs, playgrounds, tests             |
| `await createIndexedDBDeploymentStore()`   | yes               | an app that must remember what it deployed   |
| `createEmptyDeploymentStore()`             | no (discards)     | read-only environments that must not persist |

Without `deploymentStore`, every `setupEnvironment` of the page shares one in-memory store. Every store is backed by a small in-memory file system you can observe, which is how a UI shows records appearing as a script runs:

```typescript
const deploymentStore = createVFSDeploymentStore();
deploymentStore.vfs.subscribe((change) => {
	if (change.type === 'write') console.log(`wrote ${change.path}`); // deployments/sepolia/GreetingsRegistry.json
});
```

To read records back without running anything, load through the store: `loadDeploymentsFromStore(store, 'deployments', 'sepolia')` from `rocketh`. Records written by a Node run are not visible to the browser: bundle an [export](../exporting-and-verifying/#exporting-deployments) or fetch them.

## Against an EVM in the tab

A browser EVM (a node with no network behind it, the kind the playground runs) is an **execution-only** node, and two things that a dev node gives you are absent. Both are one line, and both were learned by a project the hard way:

- **Named accounts cannot be indexes.** `deployer: {default: 0}` means the node's account 0, and an execution-only node has no accounts. Give every account the scripts use as a private key, through the `privateKey` signer protocol, which signs locally:

  ```typescript
  import {privateKey} from '@rocketh/signer';

  const accounts = {
  	deployer: {default: `privateKey:${deployerKey}`},
  	admin: {default: `privateKey:${adminKey}`},
  };
  const inTabConfig = {...config, accounts, signerProtocols: {privateKey}};
  ```

  Replace `accounts` rather than merging it: an index-based entry left behind fails half way through the deploy.

- **`autoMine` must be off.** It makes rocketh send `evm_mine` after each transaction, for a node that needs telling; an execution-only node answers that with "method not found" (`-32601`) and has already mined the block anyway. Pass `autoMine: false` in the run parameters, which wins over a chain or environment that sets it (the template's `localhost` does).

Give the in-tab chain an environment of its own, with its own chain id and its own `data` entries, rather than borrowing `localhost`, so that what the offline world is does not change what a developer's local chain is. `data` is per key, so add an entry under the new environment's name to each key that differs ([Per-environment data](../environments/#per-environment-data-data)):

```typescript
const worldConfig = {
	...inTabConfig,
	environments: {...config.environments, world: {chain: 900001}},
	chains: {...config.chains, 900001: {tags: ['local'], properties: {gasPrice: '0'}}},
	data: {...config.data, Game: {...config.data.Game, world: {commitPhaseDuration: 0, revealPhaseDuration: 0}}},
};

// the scripts are typed against your app's config; the world's has the same names
const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(worldConfig as unknown as typeof config, extensions, {
	deploymentStore: createVFSDeploymentStore(),
});
await loadAndExecuteDeploymentsFromModules(scripts, {
	environment: 'world',
	provider: inTabEvm, // an EIP-1193 provider over the in-tab EVM
	saveDeployments: true,
	askBeforeProceeding: false,
	autoMine: false,
});
```

## Accounts a browser run cannot sign for

A browser run never asks for a transaction hash: `@rocketh/web` has no text prompt, so a call from an account rocketh cannot sign for takes the `throw` path, as in CI ([Unknown signers](../unknown-signers/#on-a-fork-or-in-the-browser-impersonation-instead)). Against a fork or a dev node, `autoImpersonate: true` makes such a named account executable instead.
