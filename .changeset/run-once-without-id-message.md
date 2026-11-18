---
'rocketh': patch
---

A deploy script that returns `true` without an `id` now gets an error that names the script, says what `return true` asks for, and shows where the `id` goes (`deployScript`'s options), instead of `<script> return true to not be executed again, but does not provide an id`.
