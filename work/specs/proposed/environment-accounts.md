---
title: 'Local accounts per environment: one account config for every chain, signed by rocketh'
slug: environment-accounts
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) and the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks or ADRs, and this spec settles to its durable framing of Problem, Solution, User Stories and Out of Scope.)

## Problem Statement

A named account given by index (`deployer: 0`) means the node's own account at that index, the ones it lists in `eth_accounts`. That works on a dev node, which holds keys, and fails on a real network, whose RPC endpoint holds none. To deploy outside Hardhat, a user therefore gives every account a per-network signer string (`sepolia: \`privateKey:${process.env.DEPLOYER_PRIVATE_KEY}\``) and registers the `privateKey` protocol from `@rocketh/signer`; forgetting the registration is its own error (`private-key-without-protocol`). There is no way to give a mnemonic at all: `@rocketh/signer` has only `privateKey`. A Hardhat user does it the other way round, in `hardhat.config.ts` (`accounts: {mnemonic}` on the network), and gets indices that work on every network, but the config then lives in Hardhat and does not carry over to a run without it.

So the same project configures its accounts in two places with two models, and the one that works without Hardhat is the more verbose and the less capable. The in-process chain (spec `in-process-chain`) adds a third: `@webevm/devnode` takes its own `accounts` option, and nothing says how rocketh's config would reach it.

## Solution

An environment can declare its **local accounts**: the accounts rocketh holds the keys of and signs for itself, given as a mnemonic (with optional `count`, `path`, `initialIndex`) or a list of private keys, in the shape Hardhat's network config and `@webevm/devnode` use. When it does, index `i` is local account `i`, signed by rocketh; when it does not, index `i` is the node's `eth_accounts[i]`, exactly as today. The setting, `localAccounts`, is a chain setting, so it is declared per environment (`environments.<name>.overrides`), on a chain for every environment on it (`chains[<id>]`), or for forks only (`environments.<name>.whenForked`), with the usual most-specific-wins layering, and `null` at any layer means "none here: an index is the node's account".

```ts
export const config = {
	environments: {
		sepolia: {chain: 11155111, overrides: {localAccounts: {mnemonic: process.env.MNEMONIC_SEPOLIA}}},
		mainnet: {chain: 1, overrides: {localAccounts: [process.env.DEPLOYER_KEY]}},
	},
	accounts: {
		deployer: 0, // the same line on every network
		admin: {default: 1, mainnet: '0x1111111111111111111111111111111111111111'}, // a Safe
	},
	data: {},
} as const satisfies UserConfig;
```

The defaults are Hardhat's, anvil's and devnode's (derivation path `m/44'/60'/0'/0`, `count` 10, `initialIndex` 0), so mnemonic index `i` is the same address in rocketh, on anvil, on Hardhat and in-process. Core rocketh does the deriving and the signing, so the same `rocketh/config.ts` works under the `rocketh` CLI, under `hardhat deploy`, in vitest, in a browser and in-process, with no `signerProtocols` entry. Signer protocols remain for external signers (a hardware wallet, a KMS). And because core can now sign locally, a bare private key in a named account, or a `privateKey:` string, no longer needs the `privateKey` protocol registered either.

## User Stories

1. As a rocketh CLI user, I want to give an environment a mnemonic and have `deployer: 0` resolve to its first account, so that I configure a live network the way I configure a dev node.
2. As a rocketh CLI user, I want to give an environment a list of private keys instead, so that a project without a mnemonic works the same way.
3. As a user, I want to write no `signerProtocols` entry for this, in any runtime (CLI, hardhat-deploy, vitest, browser), so that a config that type-checks works wherever rocketh runs.
4. As a user, I want a bare private key or a `privateKey:` string in a named account to work without registering the `privateKey` protocol, so that the existing per-account form loses its registration step too.
5. As a user who registered my own `privateKey` protocol, I want it to keep winning, so that nothing changes for me.
6. As a user, I want the same index to be the same address in rocketh, on anvil, on Hardhat and in-process when they share a mnemonic, so that addresses do not change with the tool.
7. As a user, I want the setting per environment, so that a staging and a production environment on one chain use different keys.
8. As a user, I want to declare it once on a chain and override it in one environment, so that it follows the same layering as every other chain setting.
9. As a user rehearsing on a fork, I want the forked environment's local accounts inherited by default, so that the rehearsal deploys from the same addresses as the real run, as `HARDHAT_FORK` already does with the forked network's mnemonic.
10. As a user rehearsing on a fork without the production secret, I want `whenForked: {localAccounts: null}` to make an index the node's account again, so that I can rehearse with the node's accounts and impersonation.
11. As a user, I want `null` to undo a broader declaration at any layer (`chains[<id>]` under `overrides`, say), so that one environment can opt out.
12. As a user, I want an environment with no such setting to behave exactly as today, so that nothing changes for a project that does not use it.
13. As a user, I want per-account definitions (an address, a `privateKey:` string, a protocol string, a reference, `null`) to keep working alongside it, so that a Safe on mainnet or a Ledger deployer is still one line.
14. As a user, I want a missing mnemonic or key (an unset environment variable) to stop the run before any script runs, naming the environment and the layer and never printing the value, so that a typo in `.env.local` is not a silent fallback to the node's accounts.
15. As a user, I want an index beyond the declared list to fail with the same collected error as the other unresolvable accounts, so that I see every problem in one run.
16. As a user, I want a notice when the node also lists accounts and they differ from the declared ones, so that I know which ones the run used.
17. As a hardhat-deploy user, I want the same setting to work under `hardhat deploy`, winning over the hardhat network's `accounts`, so that one config file serves both commands.
18. As a hardhat-deploy user who sets nothing, I want my hardhat network's accounts to keep working, so that the change costs me nothing.
19. As a user of the in-process chain, I want it created with the environment's local accounts when declared, funded at genesis, so that the in-process run and the live run use the same addresses.
20. As a user, I want transactions from these accounts recorded as locally signed (`signerOnly`) in captured transactions and treated as signable without the node, so that the unknown-signer and fork logic reason from the truth.
21. As a browser user who never declares local accounts, I want my bundle not to carry the derivation code, so that the feature costs nothing when unused.
22. As a maintainer, I want no layer in front of the RPC that intercepts `eth_sendTransaction`, so that fees, nonces and transaction types keep one home in rocketh's broadcast path.

### Autonomy notes

- **`humanOnly`:** not set. The tasks are agent-buildable.
- **`needsAnswers`:** not set. The three launch questions (where derivation lives, the name, fork behaviour) were answered by the maintainer on 2026-11-21 and are recorded below.

## Implementation Decisions

- **Core rocketh derives and signs.** The setting is declared in `@rocketh/core`'s types, so every runtime honours it, with no registration. `rocketh` declares `viem` as its own dependency (already shipped in every rocketh bundle: `@rocketh/core` imports it at runtime) and uses `viem/accounts` (`mnemonicToAccount`, `privateKeyToAccount`) through a DYNAMIC import, made only when a local account or a private key has to be resolved, so a bundle that never declares one does not carry the BIP-39/BIP-32 code (ADR 0002). Each local account resolves to a `signerOnly` signer: an EIP-1193 signer answering `eth_accounts` and `eth_signTransaction`, the contract the broadcast path already uses for `privateKey`.
- **The built-in `privateKey`.** With local signing in core, a bare 64-hex key and a `privateKey:<key>` string resolve without registration; a user-registered `signerProtocols.privateKey` still wins. The `private-key-without-protocol` failure reason is retired. `@rocketh/signer`'s `privateKey` stays exported, for compatibility.
- **The name is `localAccounts`**, viem's term for an account whose key the client holds and signs with, and distinct from the top-level `accounts` (the named accounts). The named-accounts page says in its first paragraph which is which.
- **It is a chain setting.** A new optional key on `ChainUserConfig` (a `@rocketh/core` type change, approved by the maintainer with this spec). Because `overrides` and `whenForked` are `Omit<ChainUserConfig, 'info'>`, it is accepted at all three layers with no new layering code, and resolved like `rpcUrl`: the most specific layer that sets it wins, replaced whole, never merged.
- **Its value:** `{mnemonic: string, count?: number, path?: string, initialIndex?: number}`, a readonly list of 0x-prefixed 32-byte private keys, or `null`. `null` is an explicit "none at this layer", which overrides a declaration at a broader layer, as `null` means "absent on this network" for a named account. Defaults: `count` 10, `path` `m/44'/60'/0'/0`, `initialIndex` 0, account `i` at `<path>/<initialIndex + i>`, as in Hardhat, anvil and `@webevm/devnode` 0.1.0 (its README, "Options").
- **Index resolution.** When the resolved chain config declares local accounts, index `i` resolves to local account `i` as a `signerOnly` signer and the node's `eth_accounts` is not consulted for it; otherwise (nothing declared, or `null`) index resolution is unchanged (`packages/rocketh/src/environment/index.ts`, the `typeof accountDef === 'number'` branch of `getAccount`). Every other definition form is unchanged.
- **Forks inherit it**, like every chain setting (ADR 0014's layering: `chains[<forked id>]`, then `overrides`, then `whenForked`). This matches hardhat-deploy today: `addForkConfiguration` (`packages/hardhat-deploy/src/helpers.ts`) copies the forked network's mnemonic into the fork network, so `HARDHAT_FORK=mainnet` already deploys from the production addresses when `MNEMONIC_mainnet` is set. The declared accounts hold their real balances on the fork, so nothing needs funding. `whenForked: {localAccounts: null}` opts out.
- **Errors join the existing collected error** (`UnresolvableAccountsError`, `packages/rocketh/src/environment/unresolvableAccounts.ts`): new reasons for an index beyond the declared list and for an empty or invalid mnemonic or key, with remedies that name the environment and the layer. Nothing secret is ever printed, per the existing rule there.
- **The notice** for a node listing different accounts is printed once per run on the console (ADR 0009).
- **Funding: none.** rocketh never sets a balance for these accounts on a node it did not create: on anvil or Hardhat with a different mnemonic they start empty, and the user funds them or uses the node's. The in-process chain is the exception only because rocketh creates that node, and it passes the declared accounts to `createDevNode`, which funds them at genesis.
- **Under hardhat-deploy** the declared setting wins over the hardhat network's `accounts`, and with none declared the hardhat network's accounts are the node's `eth_accounts`, as today. hardhat-deploy's `MNEMONIC_<network>` helpers stay, and the docs present `localAccounts` as the recommended way for new projects.
- **No RPC front layer.** The rationale, and the meaning of an index this establishes, is ADR 0019 (`docs/adr/0019-an-index-names-the-environments-account-and-rocketh-signs-for-it.md`).

## Testing Decisions

- Integration tests through `createTestEnvironment` (the real environment against the mock provider): a mnemonic resolves index 0 to the anvil address `0xf39f...2266` and the transaction leaves through the `signerOnly` path (`eth_sendRawTransaction`), with the node's `eth_accounts` ignored; a list of keys; the layering (`chains` under `overrides` under `whenForked`); `null` undoing a broader layer; a fork run inheriting, and `whenForked: {localAccounts: null}` opting out; an index beyond `count`; an unset mnemonic, asserting the value is absent from the message; the notice; no declaration behaving as before.
- A bare private key and a `privateKey:` string resolving with no `signerProtocols`, and a registered `privateKey` protocol still being the one called.
- hardhat-deploy: one test that a declared setting wins over the hardhat network's accounts.
- A type-level test that a wrong value shape fails `tsc`.

## Out of Scope

- Funding declared accounts on a node rocketh did not create (decided: nothing for now).
- A `mnemonic:` per-account signer protocol: the environment setting covers the need.
- Changing Hardhat's own account mechanism or hardhat-deploy's network helpers.
- The in-process chain itself: spec `in-process-chain`, which consumes this setting.

## Further Notes

Spec `in-process-chain` is `taskedAfter` this one: its devnode is created from `localAccounts`, which settles the two points its tasking had left open (how named accounts declared otherwise than by index are funded in-process, and where devnode options live in the config). Docs to update when it lands: `documentation/named-accounts/` (the definition table, the `privateKey` registration, and "Named accounts on a real network", including the `UnresolvableAccountsError` remedy text), `documentation/environments/`, `documentation/fork-runs/` (what a fork inherits), `documentation/reference/configuration/`, the hardhat-deploy migration page, the `rocketh-deploy` agent skill, and the `index` sense in `CONTEXT.md`.
