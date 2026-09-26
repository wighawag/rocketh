---
title: 'The privateKey signer (eip-1193-signer 0.1.1) signs LEGACY transactions without EIP-155, so they carry no chain id'
type: observation
status: spotted
spotted: 2026-09-26
---

Spotted while building `support-chains-without-eip-1559`. `EIP1193LocalSigner` (`eip-1193-signer@0.1.1`, the latest published, used by `@rocketh/signer`'s `privateKey` protocol) handles `eth_signTransaction` for `type` absent or `'0x0'` by calling viem's `signTransaction({type: 'legacy', ...})` WITHOUT passing `chainId`, although rocketh puts `chainId` on every transaction it builds. The result has `v = 27/28` (checked: signing `{type:'0x0', chainId:'0x7a69', ...}` produced a raw transaction ending `...801ba0...`, `v = 0x1b`).

Consequences for a `signerOnly` account on a chain declared `transactionType: 'legacy'` (or a call passing `gasPrice`): the transaction is replayable on any other chain where the same account has the same nonce, and nodes that accept only replay-protected transactions over RPC (geth's default) refuse it. A node-held (`remote`) account is not affected: the node signs with its own chain id. The type 1 and type 2 branches of the same signer do pass `chainId`.

The fix is upstream (pass `chainId: tonf(txData.chainId)` in the legacy branch when present), or a wrapper in `@rocketh/signer` that signs legacy transactions itself, which would add `viem` as a direct dependency of that package. The user docs (`documentation/core-concepts/index.md`, "Chains without EIP-1559") carry a caveat to remove once fixed.
