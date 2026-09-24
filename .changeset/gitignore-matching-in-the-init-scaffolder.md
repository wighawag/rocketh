---
'hardhat-deploy': patch
---

`hardhat-deploy init` now decides which template files to skip with a real gitignore matcher instead of a hand-rolled check.

The old test was `fileName === pattern || fileName.endsWith(pattern.replace('*', ''))`, which compared BASENAMES and stripped only the FIRST `*`, with a second, differently-broken copy (`pattern.replace('/', '')`) deciding directories in `copyFolder`. Four consequences, each silent: `*.log.*` kept a stray `*` and matched nothing; `build*` was evaluated as a suffix, so it also skipped `mybuild`; `!` negations survived parsing and applied as positive skips, inverted; and anchored paths such as `src/generated` could never match a basename.

Both copies are replaced by a documented subset of the gitignore spec (comments, `!` with last-match-wins, trailing-`/` directory rules, anchoring, `*`, `?`, `[...]`, `**`, escapes). `copyFolder` accumulates a relative path during the walk, which is what anchored patterns need, and `copyFile` no longer decides skipping at all.

Behaviour of the shipped `templates/basic/.gitignore` is unchanged, verified end to end by scaffolding a project from the built CLI and pinned by a test, so a scaffolded project looks exactly as before. What changes is that a future edit to that template's `.gitignore` now does what it says.
