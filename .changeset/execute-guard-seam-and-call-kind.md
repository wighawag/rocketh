---
'@rocketh/read-execute': minor
---

`execute` and `executeByName` accept an optional `guard`, a declared read that answers whether the call is still needed. `kind: 'call'` reads a view function on a target (another contract by default, since that is where the effect is usually observable) and judges the decoded value with `satisfied`. A satisfied guard skips the call: no transaction is built and nothing is broadcast. The evaluation record is returned on both paths, and `evaluateGuard(env)` evaluates a guard standalone without executing anything. Unguarded calls keep their exact previous signature.
