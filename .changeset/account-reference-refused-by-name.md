---
'rocketh': patch
---

A named account configured as the name of another account that is not in `accounts` (a typo such as `owner: 'nosuchname'`) is now refused with a message naming both, instead of crashing environment construction with a raw `TypeError`. A reference cycle (`a: 'b', b: 'a'`, or `a: 'a'`) is refused with the cycle spelled out, instead of recursing forever.
