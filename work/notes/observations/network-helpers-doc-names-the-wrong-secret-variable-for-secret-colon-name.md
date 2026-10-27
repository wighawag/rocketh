---
title: 'The network-helpers doc names the wrong configuration variable for `SECRET:<name>`'
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

`hardhat-deploy/documentation/how-to/configure-network-helpers/index.md` (section "Secret Management") says `ETH_NODE_URI_mainnet=SECRET:MAINNET_RPC_URL` uses `configVariable('SECRET_MAINNET_RPC_URL')`.

`getVariable` in `packages/hardhat-deploy/src/helpers.ts` builds `configVariable(\`SECRET_${prefix + splitted[1]}\`)`, with `prefix` being `ETH_NODE_URI_` (or `MNEMONIC_`), so that value reads `SECRET_ETH_NODE_URI_MAINNET_RPC_URL`, not `SECRET_MAINNET_RPC_URL`. Either the doc or the code is wrong; which one was intended is not verified. Spotted while documenting the unresolvable-account error, which only relies on the plain `SECRET` value (`SECRET_MNEMONIC_<network>`), where doc and code agree.
