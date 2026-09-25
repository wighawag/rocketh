---
title: 'A mnemonic signer protocol in @rocketh/signer'
slug: mnemonic-signer-protocol
---

# Idea: `mnemonic:` as a signer protocol

Status: incubating. Wanted, not scheduled.

## What exists today

`@rocketh/signer` implements ONE signer protocol, `privateKey` (`packages/rocketh-signer/src/index.ts:4-14`), which returns a `signerOnly` signer. Its `package.json` description nevertheless says "Attach private-key and mnemonic signers", so the package already advertises something it does not ship. Whoever builds this fixes that sentence for free; whoever decides NOT to build it should fix the sentence instead.

A mnemonic works today only under hardhat, and only indirectly: `hardhat-deploy`'s helpers put the mnemonic (from `MNEMONIC_<network>` or `MNEMONIC`) into the hardhat network's `accounts` (`packages/hardhat-deploy/src/helpers.ts:181-209, 223`), hardhat derives and holds the keys, and a NUMERIC named account then resolves through `eth_accounts` to a `remote` signer (`packages/rocketh/src/environment/index.ts:586-592`). So the node signs, not rocketh, and the standalone `rocketh` CLI (no hardhat in the picture) has no mnemonic path at all.

## What it would be

A `mnemonic:` protocol string resolved through `signerProtocols`, returning `signerOnly` like `privateKey` does, so signing is local and works against any node including a public RPC that holds no keys. hardhat-deploy v1's closest analogue is `privatekey://`; v1 had no mnemonic protocol for named accounts either (the closed set is `external`, `trezor`, `ledger`, `privatekey`, `src/utils.ts:331-356` at v1.0.4), so this is not a parity gap. It is a gap between what the package says and what it does.

## Open

- The string shape: the mnemonic inline (which puts a secret in config) or an environment-variable reference, and how the derivation index and path are spelled.
- Whether `eip-1193-signer`, the dependency `privateKey` already uses, derives from a mnemonic, or whether this adds a dependency (which AGENTS.md says needs approval).
