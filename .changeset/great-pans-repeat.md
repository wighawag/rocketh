---
'rocketh': minor
'@rocketh/test-utils': patch
---

Prepare transactions that rocketh signs itself, and stop assuming every provider implements `eth_accounts`.

**Locally-signed transactions are now prepared before signing.** A `signerOnly` account (what the `privateKey` protocol and hardware/HSM protocols return) signs without the node, so nothing was filling `nonce`, `gas` or the fees: they were signed as zero and any correct node refused the result with `intrinsic gas too low: have 0`. `broadcastTransaction` now fills them (`eth_getTransactionCount` at `pending`, `eth_feeHistory`/`eth_gasPrice` via the estimator the executor already uses, then `eth_estimateGas`) before handing the transaction to the signer.

The two 1559 fields are resolved together rather than independently, because `maxPriorityFeePerGas > maxFeePerGas` is an invalid pair that nodes reject, and filling either one in isolation can produce it. The filled cap also carries headroom (the base-fee component is doubled, as viem multiplies it by 1.2): a cap of exactly "next block's base fee plus a tip" strands the transaction the moment it misses that block and the base fee steps up.

`UnsuccessfulTransactionError` is exported from `rocketh`, so a caller can discriminate on the type rather than on message text. It carries the `hash` and the `receipt`.

The `remote` and `wallet` variants are deliberately left untouched, which is the line viem draws in `sendTransaction`: a `json-rpc` account is passed to `eth_sendTransaction` as-is because the node or wallet is authoritative and is defined to fill what the caller omitted, while a `local` account goes through `prepareTransactionRequest` first. Preparing the json-rpc side would be worse than redundant: handing a wallet our own gas limit takes the estimate out of the user's hands, and an estimate taken at another block can be wrong by the time they confirm. This is done with plain EIP-1193 calls rather than by importing viem, because `rocketh` depends only on `eip-1193` (ADR-0002); viem stays in the optional `@rocketh/viem` extension.

**An index-based account that the node cannot supply now says so usefully.** A provider that answers `eth_accounts` with `[]` (most public RPC endpoints hold no keys) is, to the user, the same situation as one that rejects the call, and now gets the same actionable message naming the account and suggesting `privateKey:0x...`, instead of the generic "cannot get account".

**`eth_accounts` is no longer required.** It was called unconditionally when building the environment, before knowing whether any named account was index-based, so execution-only nodes and public RPC endpoints that reject the method were unusable even for configs that name accounts by address or signer protocol. The failure is now remembered and re-raised, with its cause attached, only if an index-based account (`{default: 0}`) actually has to be resolved.

**A reverted transaction is no longer recorded as a success.** `waitForTransaction` is the single choke point every normal-path receipt passes through, and until now only the pasted-transaction path looked at `receipt.status` at all. A deployment whose transaction reverted (out of gas, a throwing constructor, a failed require) was recorded with its address, so a proxy could be saved over an implementation that was never created and the failure surfaced much later as a call returning `0x`. Such a receipt now raises, and nothing is saved.

This is a behaviour break rather than a fix to something broken in all cases, hence `minor`. Two consequences worth knowing:

- A receipt with NO `status` field is also refused, since rocketh will not record what it cannot prove. Pre-Byzantium chains and some node mocks omit it. The message distinguishes this case from an actual revert, so nobody is sent looking for a bug that is not there.
- Transaction RECOVERY treats a resolved-but-unsuccessful transaction as dealt with: the pending entry is dropped and the shortened list persisted, then the failure is reported. Leaving it would make every later run replay the same reverted hash and fail identically, with no exit but hand-editing `.pending_transactions.json`. A recovery that fails for any OTHER reason still keeps its entry, because that transaction may yet resolve.

**`displayTransaction` no longer crashes on a `null` fee field.** It branched on `'maxFeePerGas' in transaction`; nodes differ on whether an inapplicable field is omitted or sent as `null`, and on the latter a legacy transaction took the 1559 branch and died on `BigInt(null)`, so a cosmetic log line could take down a deploy run.

`@rocketh/test-utils`' harness provider gained an `eth_feeHistory` default (one reward entry per requested percentile, as the spec requires), which locally-signed broadcasts now reach.
