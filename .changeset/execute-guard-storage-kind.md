---
'@rocketh/read-execute': minor
---

Add the `storage` guard kind to `execute`: read a slot on any contract (`kind: 'storage'`, `on`, `slot`, `as`), decode the word under a declared interpretation from a closed set (`address`, `bytes32`, `uint256`, `bool`), and compare it under the same ABI-type rule a getter's return goes through. This is what expresses the commonest upgrade topology there is, where the proxy exposes no getter and the effect is observable only in its EIP-1967 implementation slot.
