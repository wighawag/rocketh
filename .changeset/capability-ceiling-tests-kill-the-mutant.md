---
---

Test-only: the two `ask`-degrades-to-`throw` capability-ceiling tests now also assert the ABSENCE of the `... is PAUSED` presentation. `rejects.toBeInstanceOf(UnknownSignerError)` alone did not discriminate, because a run that enters the interactive path without a usable `promptText` degrades to the defer path and throws the same error: with the ceiling removed from `resolveUnknownSignerBehaviour` both tests still passed. They now fail, verified by mutation.
