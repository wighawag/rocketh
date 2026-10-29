# Diamonds

`diamond`, from `@rocketh/diamond`, deploys an [EIP-2535 Diamond](https://eips.ethereum.org/EIPS/eip-2535): one address that delegates each function to one of several **facet** contracts. You declare the set of facets the diamond should have, and rocketh computes and sends the `diamondCut` that brings the diamond there, adding, replacing and removing function selectors. Where a proxy swaps its implementation wholesale, a diamond is upgraded facet by facet, and the total code behind it is not bound by the contract size limit.

## Setting it up

```bash
pnpm add -D @rocketh/diamond
```

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as diamondExtension from '@rocketh/diamond';

const extensions = {...deployExtension, ...diamondExtension};
export {extensions};
```

## Deploying a diamond

The `diamond` function from `@rocketh/diamond` allows you to deploy contracts using the Diamond pattern. The second argument says who deploys; `facets`, the set of facets the diamond should end up with, goes in the third, with the other options. The standard cut, loupe and ownership facets are added for you, so do not list them (`defaultCutFacet: false` or `defaultOwnershipFacet: false` leaves out the cut or the ownership facet; the loupe facet is always added):

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await diamond(
			'MyDiamond',
			{account: deployer},
			{
				facets: [{artifact: artifacts.CounterFacet}, {artifact: artifacts.AdminFacet}],
				owner: admin,
			},
		);
	},
	{tags: ['MyDiamond', 'MyDiamond_deploy']},
);
```

`get('MyDiamond')` returns the diamond's address with the merged ABI of every facet, so callers and frontends see one contract; the diamond contract itself is also recorded as `MyDiamond_DiamondProxy`. The deployment's second argument takes no `artifact` and no `args`: the diamond contract is the package's own (its constructor arguments, if you need them, go in `diamondContractArgs`), and each facet carries its own artifact.

A facet entry is `{artifact, args?, name?, linkedData?, libraries?, deterministic?}`. Facets are deployed deterministically by default, so an unchanged facet keeps its address across runs and chains; `facetsArgs`, `linkedData` and `libraries` at the top level apply to every facet that does not set its own. `excludeSelectors` leaves selectors of a facet out of the cut: `{excludeSelectors: {TreasuryFacet: ['0x12345678']}}`.

## Upgrading is declarative

A diamond upgrade is DECLARATIVE: rocketh compares the selectors the diamond currently serves against the ones your declared facet set produces, and anything on chain that your facets no longer produce is REMOVED. That is what makes re-running a script converge on the state you described, and it is also the sharp edge: a commented-out facet, a typo in `facets`, or a half-finished refactor deletes live functions, and removing the cut function itself makes the diamond permanently un-upgradeable.

So the cut is printed before it is sent, with removals in their own block and selectors resolved to signatures:

```text
  diamondCut on MyDiamond:
  REMOVING 1 function from the diamond:
    0x55241077  setValue(uint256)
  A removed function stops existing at this address. If any of the above was not meant to go,
  stop now: check that every facet you expect is in `facets`, since anything the declared set
  does not produce is removed by design.
  adding 2 functions:
    0x20965255  getValue()  ->  0xaaa...
```

Nothing is refused: the removal block is there so an unintended one is visible while it is still cheap to stop. For a high-value diamond, rehearse the upgrade on a fork and read that block before running it for real.

## Initialization calls: `execute`

`execute` attaches a call to the cut: EIP-2535's `_init` / `_calldata` pair, a `delegatecall` in the diamond's storage context (on the first deploy, an entry of the diamond constructor's initializations). A call targets either a function on one of the facets being cut in (`{type: 'facet', functionName, args}`) or a separate contract rocketh deploys deterministically (`{type: 'artifact', artifact, functionName, args}`).

**A call rides a cut, it is not something you schedule.** A re-run that changes no facet performs no cut, so no call is made. Deploy scripts are re-run, and this is what keeps them idempotent. Within that rule, `execute` has two forms, as in `@rocketh/proxy`:

- **Flat**, a single call: made on the first deploy AND again on every later cut that changes something, with the same arguments. Use it only for a call that is safe to repeat.
- **Explicit**, `{init, onUpgrade}` (both optional): `init` is made only when the diamond is first created, `onUpgrade` only on a later cut that changes facets. Each names its own target, so they may call different functions, even on different contracts.

Anything that must run exactly once, like an initializer, belongs in `init`: in the flat form it would run again on every later cut. Likewise `onUpgrade` is made on every later cut that changes facets, not only the next one, so a migration step there must be safe to repeat, or be replaced by the next change's own step.

```typescript
await diamond(
	'MyDiamond',
	{account: deployer},
	{
		facets: [{artifact: artifacts.MyFacet}],
		execute: {
			init: {type: 'facet', functionName: 'initialize', args: [admin]},
			onUpgrade: {type: 'artifact', artifact: artifacts.MigrationV2, functionName: 'migrate', args: []},
		},
	},
);
```

A value mixing the two forms (a `type` next to `init` / `onUpgrade`) is refused. There is no form that makes a call on a run that cuts nothing.

## Facet storage

Facets share the diamond's storage, so two facets declaring state variables the usual way would write over each other. Give each facet's state its own slot, the diamond storage pattern:

```solidity
library GreetingsStorage {
    bytes32 constant STORAGE_POSITION = keccak256("greetings.storage");

    struct Storage {
        string prefix;
        mapping(address => string) messages;
    }

    function get() internal pure returns (Storage storage s) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
```

## Options

| Option                                   | What it does                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `facets`                                 | the facets the diamond should have (required)                                                 |
| `owner`                                  | who may cut the diamond; defaults to the deployer                                             |
| `execute`                                | the initialization call(s) attached to a cut, above                                           |
| `facetsArgs`, `linkedData`, `libraries`  | defaults for every facet                                                                      |
| `excludeSelectors`                       | per facet, selectors to leave out of the cut                                                  |
| `defaultCutFacet`                        | include the standard cut facet (on by default); without it the diamond can never be cut again |
| `defaultOwnershipFacet`                  | include the standard ownership facet (on by default)                                          |
| `diamondContractArgs`                    | constructor arguments of the diamond contract                                                 |
| `deterministicSalt`                      | deploy the diamond itself deterministically, with this salt                                   |
| `alwaysOverride` / `strictBytecodeMatch` | the re-deployment controls of `deploy`, for the facets                                        |

When the owner is a Safe or a multisig, the cut goes through the [unknown-signer flow](../unknown-signers/) like any call rocketh cannot sign.
