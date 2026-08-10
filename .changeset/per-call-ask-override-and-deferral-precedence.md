---
'@rocketh/unknown-signer': minor
---

Add `withUnknownSignerPolicy`, a PER-CALL override of the unknown-signer policy.

`withUnknownSignerPolicy(env)('ask', () => execute(...))` runs one action under the policy you name, overriding the run-level `onUnknownSigner` (itself resolved as run parameter > chain config > the default `'auto'`). It is the SAME policy frame `catchUnknownSigner` pushes, so precedence stays one rule — innermost override, then the run parameter, then the chain config, then the default — and the frame is popped in a `finally`, so an action that throws (the deferral itself does) cannot strand it on the stack. The action is a thunk for the same reason `catchUnknownSigner`'s is: a promise has already started before the frame could be pushed, so the override would silently not apply. It returns whatever the action returned and propagates whatever it threw, so wrapping it in `catchUnknownSigner` still defers.

CAPABILITY IS A CEILING, NOT A DEFAULT: an overridden `'ask'` degrades to `'throw'` wherever the run cannot ask a human for text (CI, a non-TTY shell, the browser), so a script that hardcodes the override still runs un-hangable in CI. And since it is the same frame, it is read only inside the seam's `unsignable` branch: a `local`, `node` or `impersonated` account broadcasts identically inside the scope, and a pre-signed `raw` transaction never reaches the seam at all.

`catchUnknownSigner` is unchanged in behaviour (it now shares the one push/pop site) and its deferral guarantee is finally ASSERTABLE: under an ambient `'ask'` with a working prompt, a wrapped action takes the throw path without the prompt being consulted at all, and the printed deferral message is byte-for-byte the one an ambient `'throw'` produces. The core slice could not test this, because both of its policy values resolved to `'throw'`.
