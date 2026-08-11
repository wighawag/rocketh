---
'@rocketh/proxy': patch
---

Comment only, no behaviour change: document why the `owner()` lookup in the proxy upgrade path swallows its error. An empty EIP-1967 admin slot does not mean "no owner" (an ERC173 proxy keeps it elsewhere), so the code asks the contract; that call legitimately fails for a proxy with no `owner()` at all, which is an ANSWER rather than an error worth surfacing. Nothing is hidden: `currentOwner` stays the zero address and the very next check turns that into either a clear refusal ("The Proxy belongs to no-one") or the no-admin path. This was the last of the empty catch blocks flagged by an external code review; the sibling one in `@rocketh/deploy` had already been removed.
