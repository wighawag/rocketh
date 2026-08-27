---
---

Document the `execute` state guard on the documentation site: both kinds (a declared `call` read and a `storage` slot read), the proxy-through-a-ProxyAdmin topology it was built for, reading a contract other than the one being called, `equals` versus `satisfied`, output selection, the per-ABI-type comparison rule, what a skipped step prints, and the three traps (a guard that throws fails the run, `satisfied` hands you the value raw so an address compared with `===` is silently wrong, and the guard is what makes a deferred Safe call converge on the re-run rather than a substitute for the operator's own care). The unknown-signers page now points at it as what closes the deferral loop. Documentation only; no package code changes.
