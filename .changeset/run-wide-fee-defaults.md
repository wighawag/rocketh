---
'@rocketh/core': minor
'rocketh': minor
'@rocketh/deploy': minor
'@rocketh/read-execute': minor
'@rocketh/node': minor
'hardhat-deploy': minor
---

Run-wide fee defaults: `--gas-price`, `--max-fee-per-gas` and `--max-priority-fee-per-gas` (in wei) on the `rocketh` CLI (which also accepts hardhat-deploy v1's `--gasprice`, `--maxfee`, `--priorityfee`) and on `hardhat deploy`, or `gasPrice` / `maxFeePerGas` / `maxPriorityFeePerGas` on `ExecutionParams`. They apply to every transaction whose call states no fee option of its own (deploy, execute, tx, and the deterministic-factory bootstrap); a run-level `gasPrice` sends legacy transactions on any chain, the EIP-1559 values send EIP-1559 even on a chain declared legacy. A run-level `gasPrice` together with an EIP-1559 value, or a value that is not a non-negative integer, is refused at startup. A run that sets none sends exactly what it sent before.
