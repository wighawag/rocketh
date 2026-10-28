# Upgrading a diamond

Read this when a script calls `diamond`, from `@rocketh/diamond`. A diamond is upgraded the way a proxy is, by re-running the same script after the facets changed, and the storage-layout check in `SKILL.md` ("Upgrading a contract") applies to every facet: rocketh compares selectors and facet addresses, never storage ([Upgrading](https://rocketh.dev/documentation/proxies/#upgrading)).

## `facets` is the end state, so leaving one out removes it

The diamond ends up serving exactly the selectors the declared facets produce. On a re-run, rocketh compares them with what the diamond serves today and sends one `diamondCut` that adds, replaces and REMOVES: a selector on chain that no declared facet produces is removed ([Upgrading is declarative](https://rocketh.dev/documentation/diamonds/#upgrading-is-declarative)).

<!-- fixture: rocketh-deploy/upgrades/deploy/03_game.ts -->

```ts
// deploy/03_game.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// the facets the diamond should END UP with: a selector on chain that none of them produces is removed
		await diamond(
			'Game',
			{account: deployer},
			{
				facets: [{artifact: artifacts.CounterFacet}, {artifact: artifacts.AdminFacet}],
				owner: admin, // sends every later cut
				execute: {init: {type: 'facet', functionName: 'initialize', args: [admin]}}, // on creation only
			},
		);
	},
	{tags: ['Game']},
);
```

So when you change `facets`, or a facet's source:

- Keep in the list every facet whose functions must survive. Commenting one out, or renaming a facet while refactoring, removes its functions from the live address.
- Leave out the standard cut, loupe and ownership facets: they are added for you. Keep `defaultCutFacet` on: without the cut facet the diamond can never be cut again ([Options](https://rocketh.dev/documentation/diamonds/#options)).
- Give each facet's state its own slot (the diamond storage pattern), since facets share the diamond's storage ([Facet storage](https://rocketh.dev/documentation/diamonds/#facet-storage)).

## Read the cut plan, removals first, before the upgrade is approved

Before it sends a cut, the run prints the plan: `diamondCut on <Name>:`, then the removals in their own block (`REMOVING n functions from the diamond:`, each selector with its signature), then the additions and replacements. Nothing is refused, and when rocketh can sign for the `owner`, the cut is sent right after the plan is printed, in the same run, with no question in between ([Read the diamond cut plan, especially the removals](https://rocketh.dev/documentation/production-hardening/#read-the-diamond-cut-plan-especially-the-removals)).

So the plan to read is the one a rehearsal printed, before the live run:

1. _Rehearse_ the upgrade on a fork of the live network (`SKILL.md` routes a live upgrade to `rocketh-safe-owned-changes` for that).
2. Read the plan it printed, the `REMOVING` block first. Show the user every removed signature, and get their approval of the removals before the upgrade runs on the live network.
3. A removal nobody intended is a stop: restore the facet or the function in `facets`, compile, and rehearse again. A plan that removes `diamondCut` itself makes the diamond permanently un-upgradeable.

When the owner is _unsignable_ (a Safe), the plan is printed before the pause, and the same reading applies before the user executes the cut.

## Calls ride a cut

`execute` attaches its call to a cut, so a re-run that changes no facet makes no call ([Initialization calls: `execute`](https://rocketh.dev/documentation/diamonds/#initialization-calls-execute)).

- An initializer goes in `init`, as above: it is made only when the diamond is created. In the flat form it would be made again on every later cut.
- `onUpgrade` is made on every later cut that changes a facet; a migration step there must be safe to repeat, or be replaced with the next change.
- A call that must happen whether or not a facet changed is not an `execute` of `diamond`: write it as an `execute` from `@rocketh/read-execute`, with a `guard` (`SKILL.md`, "Writing a deploy script").
