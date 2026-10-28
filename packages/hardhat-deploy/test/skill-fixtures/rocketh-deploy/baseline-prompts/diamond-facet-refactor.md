# Branch: references/diamonds.md, a diamond upgrade

## Prompt

I split `MarketFacet` into `ListingFacet` and `AuctionFacet`. Ship it to mainnet.

## A run that follows the skill

- updates `facets` so every function that must survive is produced by a declared facet, without listing the standard cut, loupe and ownership facets;
- rehearses the upgrade on a fork first and reads the printed cut plan, the `REMOVING` block first;
- shows the user every removed signature and waits for their approval of the removals before the mainnet run;
- stops on a removal nobody intended, fixes `facets` and rehearses again.
