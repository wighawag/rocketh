---
'@rocketh/diamond': patch
---

Advertise the ERC-165 interfaces of the default facets, stop mutating the caller's `facets` array, and stop blaming `execute` for an unrelated bad template.

Three near-misses in the same file, each a condition or a value that was almost right.

**The default facets were installed but not advertised.** A default facet is installed when its option is `undefined` (omitted) or truthy, but the ERC-165 interface list read those same options for plain truthiness:

```ts
if (options?.defaultCutFacet === undefined || options.defaultCutFacet) { /* install */ }
...
if (options?.defaultCutFacet) { interfaceList.push('0x1f931c1c'); }
```

So the DEFAULT configuration, which is every diamond that does not opt out, installed the cut and ownership facets and then advertised neither: `supportsInterface(0x1f931c1c)` and `supportsInterface(0x7f5828d0)` answered false on a diamond that has both. The two conditions are now one shared pair of booleans, so they cannot drift again, and the interface list is asserted against the constructor arguments the deploy actually encodes.

**`options.facets` was mutated.** The three default facets were pushed onto the caller's own array (`const facetsSet = options.facets`). Reusing one options object across two `diamond(...)` calls appended them twice, which puts the same selector in a single Add cut (a revert) or trips `mergeABIs({check: true})` first. It is a copy now.

**A diamond with no `execute` could be told `execute is set in option`.** `executeData` is the STRING `'0x'` when there is no initializer, and that is truthy, so the placeholder-substitution block ran unconditionally and could reach its "no `{init}` or `{initData}` found in list of args even though execute is set in option" throw for a caller who set no such option. Only the throw is conditional on there being a call now; the placeholders are still substituted either way, since an unreplaced `'{init}'` string would otherwise reach the constructor encoder.

**Removed: the `artifact` field on `DiamondDeploymentConstruction`.** It was accepted by the type and then ignored, because the base diamond deployed is always this package's bundled one. Passing it could make a caller believe they had replaced the diamond base (with an independently audited one, say) while the bundled implementation was what landed on chain. Supporting a user-provided base is a real feature and is recorded as an idea, along with the finding that the non-default `diamondContractArgs` placeholders (`{erc165}`, `{init}`, `{initAddress}`, `{initData}`) describe constructor shapes the bundled diamond does not have and are therefore unreachable until that feature exists.

**Not changed: an `execute` still only runs when a cut happens.** A review reported the initializer-only case (an `execute` with no selector change) as a bug. It is not: deploy scripts are re-run, so an initializer that fired on every re-run would not be idempotent. `@rocketh/proxy` gates its own `execute` the same way (nothing happens when the implementation is unchanged), and so did both of hardhat-deploy v1's diamond implementations. What is genuinely missing is the `{init, onUpgrade}` split the proxy already has, which is now recorded as an idea; `execute` is documented as the flat form of that option in the meantime.
