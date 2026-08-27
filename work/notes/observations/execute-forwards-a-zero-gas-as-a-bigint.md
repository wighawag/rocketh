---
title: 'execute forwards gas: 0n as a raw bigint into the EIP-1193 transaction object'
type: observation
status: spotted
spotted: 2026-08-27
needsAnswers: false
---

# `gas: viemArgs.gas && ...` in `execute` leaks a bigint when the caller passes zero

Spotted while adding the `execute` guard in `packages/rocketh-read-execute/src/index.ts`. Every other numeric field on the transaction (`maxFeePerGas`, `maxPriorityFeePerGas`, `nonce`, `value`) is hex-encoded through a ternary, but `gas` uses `&&`, so a caller passing `gas: 0n` sends the bigint `0n` to the provider instead of `'0x0'` or `undefined`. Not fixed here (out of scope, and it only bites on an explicit zero gas limit, which is itself unusual).
