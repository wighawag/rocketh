---
---

Notes only: the `prompts@2.4.2` non-TTY measurement now has a finding (`work/notes/findings/prompts-non-tty-never-settles.md`) with a `source:` naming the probe, its commit, what it ran against and when. The measurement is load-bearing — `@rocketh/node` withholds its text capability because of it — and the protocol synced at `2026-08-11` makes a finding REQUIRED in that case: `docs/spikes/` is an evidence store, not the knowledge home, so the reason a capability is withheld was undiscoverable to anyone not already grepping the spike folder. The spike now cross-links the finding.
