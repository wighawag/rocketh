---
'@rocketh/deploy': patch
---

**Fix two bugs in the CBOR metadata stripping that decides whether a re-run redeploys.** Both affect the default (non-strict) comparison, and therefore also whether `@rocketh/proxy` upgrades a proxy.

1. **The two-byte length suffix was not removed.** solc terminates the metadata blob with a two-byte big-endian length of the blob, NOT counting those two bytes, so the removal is `length + 2` bytes. Stripping only `length` bytes cut the suffix but left the first two bytes of the blob itself in the comparison. That did not bite in practice only because those leading bytes are the CBOR header, which is usually identical between compilations; where it differed, an unchanged contract was redeployed.

2. **The declared length was trusted without validation, and applied to both sides.** Any bytecode ends in some two bytes, and reading them as a length is only meaningful when a blob that size could actually be there. A short runtime bytecode (a stub, a minimal proxy, a test fixture) routinely ends in bytes that parse as tens of thousands; stripping that many characters silently produced an EMPTY string on both sides, so every such contract compared equal to every other one and a genuinely changed contract was skipped as already deployed — the new code never reaching the chain. An implausible length now falls back to the creation-bytecode comparison instead. Relatedly, each side is now stripped by ITS OWN declared length: metadata length varies with what solc puts in the blob (an absolute source path is enough), so applying one side's length to both cut at a different offset in each and reported differences that did not exist.

All three failure modes are pinned by tests, verified by mutation.
