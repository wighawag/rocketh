---
'@rocketh/read-execute': patch
'@rocketh/deploy': patch
---

An explicit zero `gas`, fee, `nonce` or `value` is now encoded as the 0x quantity `0x0` instead of being leaked as a bigint or silently dropped.

These fields were guarded on truthiness, which splits badly on `0n`. `gas` used `&&`, and `&&` returns its LEFT operand when that operand is falsy, so `gas: 0n` reached the provider as the bigint `0n` on a field typed `` `0x${string}` ``: a type violation on the wire, and one a JSON-RPC transport cannot serialise. The `?:` spelling used on the other fields did not leak a type but silently DROPPED the zero, which matters most for `nonce`, where 0 is the first transaction of any fresh account, so "nonce 0" and "no nonce" are different instructions that had become indistinguishable.

Every numeric transaction field in both packages is now guarded on `!== undefined`, which is the spelling `@rocketh/deploy` already used for `value`. An absent field is still omitted exactly as before, so only an explicit zero changes behaviour.
