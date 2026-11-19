---
'@rocketh/web': patch
---

Drop the unused `tsx` and `ldenv` runtime dependencies. Nothing in the package's source, tests or build imports either, and for a browser package they installed esbuild (through `tsx`) and `@parcel/watcher`'s native binaries (through `ldenv`) for every consumer.
