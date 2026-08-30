---
'rocketh': patch
---

An unknown-signer deferral that HALTS the run now says the same transaction will be surfaced again on the next run, attributing it to the abort happening before the script's completion could be recorded (so even an `id` plus `return true` script re-runs), and points at the interactive path as the way out. A `catchUnknownSigner` action stays quiet, since its script does not stop. The interactive prompt now states that a hash from a transaction executed after an earlier run is accepted.
