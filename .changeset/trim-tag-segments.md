---
'@rocketh/node': patch
'hardhat-deploy': patch
---

`--tags "a, b"` now selects `a` and `b`. The space a person types after a comma used to become part of the tag, producing `" b"`, which matches no script and then reports itself as "no scripts matched" rather than as a typo, so the flag appeared to work while running only half of what was asked for. Segments are now trimmed and empty ones dropped, so `a,,b` and `a,` behave sensibly too. A value that collapses to nothing (`""`, `" "`, `","`) still means NO filter rather than a filter that matches nothing, which is the case that would otherwise produce a silently do-nothing run. Both entry points parse `--tags` identically, since the rocketh CLI and the hardhat-deploy task must not disagree about what a tag is.
