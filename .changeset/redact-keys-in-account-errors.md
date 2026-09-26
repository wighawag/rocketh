---
'rocketh': patch
'@rocketh/signer': patch
---

Errors raised while resolving named accounts no longer print private keys. `cannot get account for <name>` used to dump the whole account definition, which for a per-network map included the keys configured for every other network; an unprefixed key mistaken for an account reference was quoted verbatim; and `@rocketh/signer` echoed the full value when a key lacked its `0x`. GitHub masks only an exact secret string, so a key printed inside a larger value reached CI logs unmasked. Definitions are now described with anything key-shaped replaced by `<redacted>`, keeping the account name, network keys and protocol name. A bare private key with no `privateKey` signer protocol registered now gets its own message naming the fix.
