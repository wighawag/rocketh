---
'@rocketh/diamond': patch
---

A diamond's deployment record no longer stores the `execute` option it was deployed or cut with. The field was an echo of the option (written even on runs where no init call ran), nothing read it back, and its `artifact` form embedded a whole artifact in the record.
