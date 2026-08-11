---
'@rocketh/node': patch
---

`createNodePromptExecutor().prompt` now reads the confirm answer keyed by `request.name` (as its sibling `promptText` already did) instead of a fixed `.proceed` key. A confirm named anything other than `proceed` previously read `undefined` and was treated as "do not proceed", silently exiting the run. Both current call sites pass `proceed`, so this is behaviour-identical today. An aborted confirm (Ctrl-C, where `prompts` resolves with the key absent) now reports `{proceed: false}` rather than `{proceed: undefined}`.
