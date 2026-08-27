---
'@rocketh/read-execute': minor
---

A skipped guarded step now says so, on one line, through the environment's user-message channel (`env.showMessage`, the channel `catchUnknownSigner` already prints through): which step was skipped, which contract was read and how (a view function plus its arguments, or a slot plus the interpretation the word was decoded under), the value that came back, the selected output where one was selected, and the expected value where one was given. A skip is otherwise the only outcome with no trace at all, so a run whose guard is subtly wrong looked exactly like one where the work was already done. Everything reported is read off the evaluation record, so the line and the returned record cannot disagree. The path that sends stays silent: it already leaves a transaction behind.
