<!-- dorfl-sidecar: item=observation:magic-storage-slots-and-cbor-constants type=observation slug=magic-storage-slots-and-cbor-constants allAnswered=false -->

Item: [`observation:magic-storage-slots-and-cbor-constants`](../notes/observations/magic-storage-slots-and-cbor-constants.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Promote (small).** Still live: `packages/rocketh-proxy/src/index.ts:444` and `:467` are bare hex literals with no `EIP-1967` mention anywhere in the file. Name them as constants with a comment citing EIP-1967, and do the same for the CBOR length magic number in `@rocketh/deploy`. Cheap readability win on the two files a reader is most likely to be lost in.
