---
'@rocketh/core': patch
---

`withEnvironment` now refuses a bad extension root export BY NAME instead of failing with an anonymous `TypeError`.

An extension package's root may export only curried `(env) => …` functions, because the documented user idiom is a namespace spread (`{...deployExtension, ...myExtension}`) and every entry is called as `value(env)`. A re-exported class or plain constant previously died on `Class constructor … cannot be invoked without 'new'` or `func is not a function`, neither of which says WHICH export is at fault, and this happens at deploy-script run time rather than at build time. Both are now rejected with the offending key named and the fix stated (move it to a subpath export, as `@rocketh/unknown-signer` does with `UnknownSignerError` on `./errors`).

No working configuration changes: both shapes already threw here, so this only replaces an unhelpful crash with a diagnosable one. Getters (`(env) => value` returning a non-function) remain a supported shape and are unaffected, since the check is on the ENTRY being callable and never on what it returns.
