---
'@rocketh/diamond': patch
---

Print what a diamond cut will do, with removals called out separately, before executing it.

A cut is declarative: rocketh compares the selectors the diamond currently serves against the ones the declared facet set produces, and anything on chain but not declared goes into a Remove. That is the model working as designed, and it is also its sharp edge, because the same mechanism turns a typo, a commented-out facet or a half-finished refactor into the deletion of live functions. The worst case removes the only route to a future upgrade and makes the diamond permanently immutable.

Until now the `diamondCut` transaction went out with **nothing printed**: the selectors were four-byte hex inside the calldata, so the one moment where a mistake is still cheap to catch passed in silence.

The plan is now shown first:

```
  diamondCut on MyDiamond:
  REMOVING 1 function from the diamond:
    0x55241077  setValue(uint256)
  A removed function stops existing at this address. If any of the above was not meant to go,
  stop now: check that every facet you expect is in `facets`, since anything the declared set
  does not produce is removed by design.
  adding 2 functions:
    0x20965255  getValue()  ->  0xaaa...
```

Two things make it worth printing. **Removals get their own block, ahead of everything else**, because scanning one combined list is exactly how a removal gets missed. And **selectors are resolved to signatures**: `Remove 0x1f931c1c` tells a reader nothing, `Remove diamondCut(...)` tells them to stop. The names are looked up in both the new merged ABI and the previous deployment's, since what is leaving is by definition no longer in the new one, and those are precisely the lines that matter most.

An upgrade that only adds or replaces prints its summary without the removal block, so the loud part stays meaningful.

This is a report, not a policy: nothing is refused, and a protected-selector list that would block a removal outright remains a separate, larger feature.
