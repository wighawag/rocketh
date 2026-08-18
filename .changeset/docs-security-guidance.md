---
'rocketh': patch
---

Document what the interactive unknown-signer path now checks, that `catchUnknownSigner` is not a "never send" switch, and that `linkedData` is public.

Three gaps in `documentation.md`, all about the same thing: what a reader can rely on when a privileged transaction is involved.

**The stated residual risk was out of date.** It said an execution's pasted hash is checked for success "and nothing else", which stopped being true when the evidence check landed. It now describes what is actually weighed (the transaction itself, a Safe execution, a wrapper carrying the calldata, or nothing), that the last case pauses and asks rather than refusing, since governance executed by proposal id looks exactly like a wrong hash, and what remains accepted: no wallet ABI is decoded, so a user who deliberately confirms the wrong transaction is believed. What is gone is the silent case.

**`catchUnknownSigner` reads like a "never send" switch and is not one.** It catches the case where rocketh CANNOT sign; an account it CAN sign for still broadcasts inside the wrapper, which is what makes a mixed run work. A production run that unexpectedly holds the admin key therefore sends the admin transaction. The docs now say so and show the assertion to write instead, using `env.addressSignability`, which is public API and needed no new feature.

**`linkedData` is public.** It is stored in the deployment record and copied into every export, so it reaches the frontend bundle and the repository. Fine for a prefix, an admin address or a start block; the wrong place for an API key or an RPC URL with a token in it.

Also documented: the diamond cut plan (and why a declarative selector diff removes functions by design), `--verify` for exports, and the identifier constraint on the `--tsm` / `--jsm` module formats.
