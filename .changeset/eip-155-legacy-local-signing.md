---
'@rocketh/signer': patch
---

Legacy transactions signed by a `privateKey` account are now replay-protected (EIP-155): `eip-1193-signer` 0.2.0 signs them for the transaction's chain id, where 0.1.1 signed them without one, so they could be replayed on another chain and were refused by nodes that require replay protection.
