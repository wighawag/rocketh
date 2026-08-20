# @rocketh/diamond

[EIP-2535 Diamond](https://eips.ethereum.org/EIPS/eip-2535) deployments for rocketh. You declare the **set of facets** the diamond should have; rocketh compares that against what is on chain and performs the `diamondCut` that closes the gap, adding, replacing and removing function selectors as needed.

Where `@rocketh/proxy` swaps one implementation wholesale, a diamond is upgraded facet by facet, and is not bound by the contract size limit.

## Installation

```bash
# Using pnpm
pnpm add @rocketh/diamond

# Using npm
npm install @rocketh/diamond

# Using yarn
yarn add @rocketh/diamond
```

## Wiring it up

`@rocketh/diamond` is an **extension**: spread its namespace into `extensions` in `rocketh/config.ts`.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as diamondExtension from '@rocketh/diamond';

const extensions = {
	...deployExtension,
	...diamondExtension,
};
export {extensions};
```

## Usage

```typescript
// deploy/deploy_Kingdom.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await diamond(
			'Kingdom',
			{account: deployer},
			{
				owner: admin,
				facets: [
					{artifact: artifacts.CastleFacet},
					{artifact: artifacts.ArmyFacet},
					{artifact: artifacts.TreasuryFacet, args: [treasuryAddress]},
				],
			},
		);
	},
	{tags: ['Kingdom', 'Kingdom_deploy']},
);
```

`env.get('Kingdom')` returns the diamond address with the **merged ABI** of every facet, so callers and frontends see one contract. The underlying proxy is also saved as `Kingdom_DiamondProxy`.

Note that the deployment arguments take **no `artifact` and no `args`**: the diamond base contract is this package's bundled one, and the facets carry their own artifacts. (Constructor arguments for the base go in `diamondContractArgs`.)

## The facet set is declarative

`facets` is the desired end state, not a list of changes. Add an entry and its selectors are added; change a facet's code and its selectors are replaced; **remove an entry and its selectors are removed from the diamond**. That last one is the one to read carefully before running against a live deployment: deleting a line from `facets` deletes functionality on chain.

```typescript
type FacetOptions = {
	name?: string; // defaults to the artifact's contract name
	artifact: Artifact;
	args?: any[]; // facet constructor arguments
	linkedData?: LinkedDataProvided;
	libraries?: Libraries;
	deterministic?: boolean | `0x${string}`;
};
```

Facets are deployed **deterministically by default**, so an unchanged facet keeps its address across chains and runs. Set `deterministic` on a facet to override that.

Use `excludeSelectors` when a facet exposes a function the diamond should not route:

```typescript
{excludeSelectors: {TreasuryFacet: ['0x12345678']}}
```

## Options

`facets` is required. The rest:

| Option | Description |
| --- | --- |
| `owner` | Address that may cut the diamond. Defaults to the deployer. |
| `execute` | Initialization call attached to a cut. See the caveat below. |
| `defaultCutFacet` | Include the built-in `DiamondCutFacet` (on by default). Turning it off makes the diamond permanently un-cuttable. |
| `defaultOwnershipFacet` | Include the built-in `OwnershipFacet` (on by default). |
| `diamondContractArgs` | Constructor arguments for the diamond base contract. |
| `excludeSelectors` | Per-facet selectors to leave out of the cut. |
| `facetsArgs` | Default constructor arguments for every facet. A facet's own `args` overrides them. (`linkedData` and `libraries` work the same way: set once for all facets, overridden per facet.) |
| `deterministicSalt` | Deploy the diamond deterministically with this salt. |
| `alwaysOverride` / `strictBytecodeMatch` | Mutually exclusive re-deployment controls, as in `@rocketh/deploy`. |

## `execute` rides a cut, it is not a call you schedule

`execute` is EIP-2535's `_init` / `_calldata` pair: a `delegatecall` made in the diamond's storage context as part of `diamondCut`.

**A run that produces no facet change performs no cut, so `execute` does not run.** This is deliberate, and it matches how `@rocketh/proxy` gates its own `execute`: deploy scripts are re-run, and an initializer that fired on every re-run would not be idempotent.

The consequence to plan around: `execute` is the flat form of that option, so it runs on the fresh deploy **and on every later cut**, with the same arguments. A migration that must run exactly once, or only on upgrades, is not expressible yet; that is the `{init, onUpgrade}` split `@rocketh/proxy` has.

## Reading the cut before it happens

A diamond upgrade can remove functions, and a removal is not always obvious from a diff of your `facets` array. rocketh reports the cut it intends to perform; read it, and pay particular attention to the removals, before letting it run against a production diamond.

## Types

```typescript
enum FacetCutAction {
	Add,
	Replace,
	Remove,
}

type Facet = {facetAddress: `0x${string}`; functionSelectors: readonly `0x${string}`[]};
type FacetCut = Facet & {action: FacetCutAction};
```

Bundled facet and diamond artifacts are available under the `./artifacts/*` and `./solc_0_8/*` subpath exports.

## Related packages

- [`@rocketh/deploy`](https://www.npmjs.com/package/@rocketh/deploy) - the deployment function this builds on
- [`@rocketh/proxy`](https://www.npmjs.com/package/@rocketh/proxy) - single-implementation upgradeable proxies
- [`@rocketh/read-execute`](https://www.npmjs.com/package/@rocketh/read-execute) - call the facets once they are cut in
- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
