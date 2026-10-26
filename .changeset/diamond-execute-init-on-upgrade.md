---
'@rocketh/diamond': minor
---

`execute` accepts an explicit `{init, onUpgrade}` form, like `@rocketh/proxy`: `init` runs only when the diamond is first created, `onUpgrade` only on a later cut that changes facets, and each may target a different function or contract. The flat form is unchanged, and a value mixing the two forms is refused.
