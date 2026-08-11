---
---

Docs only: `TESTING.md` now states the omit-vs-empty distinction for `createMockPromptExecutor`. OMITTING `textAnswers` gives the capability-absent shape (no `promptText`, so `'ask'` degrades to `'throw'`); passing an EMPTY array gives a text-capable prompt whose script is already exhausted, which is a different run. The published changeset wording was corrected in `0c93870`; this is the remaining half.
