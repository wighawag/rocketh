---
title: Simulate high-friction signers (hardware wallet, HSM, KMS) on a fork
slug: simulate-high-friction-signers
---

# Simulate high-friction signers on a fork

Status: incubating. Independently shippable — it does NOT share the blocker that parked `per-call-autoimpersonate`.

## What

Let a user declare that a named account with a REAL signer should nonetheless be signed for by the node on a dev/fork network, so they can rehearse a deployment without the friction that signer normally imposes.

The motivating case is a hardware wallet: an account defined through a signer protocol (`ledger:...`) is genuinely signable, but every transaction demands the device be plugged in and each signature physically confirmed. On a fork, where the point is to rehearse rather than to authorise, that friction buys nothing. The same applies to any high-friction signer: an HSM, a remote KMS, a passphrase prompt, an operator with 2FA.

It is the mirror image of the unknown-signer work. `catchUnknownSigner` is "I CANNOT sign this, show me the transaction". This is "I CAN sign it, but not right now, let the node stand in for me".

## Why it does not already work

It looks as though `autoImpersonate` should cover it, and it does not. Impersonation and signing are two different decisions:

- Impersonation changes what the NODE will accept: after `hardhat_impersonateAccount`, the node will process an `eth_sendTransaction` from that address without a signature.
- The broadcast path chooses HOW to send based on the resolved signer variant. `wallet` and `remote` signers go to `eth_sendTransaction` (someone else signs); a `signerOnly` signer takes `eth_signTransaction` then `eth_sendRawTransaction`, signing LOCALLY. A hardware wallet reached through a signer protocol resolves to `signerOnly` (as does `privateKey`), so it takes the local-signing branch. See `CONTEXT.md` under `signer` — these three variants are easy to get backwards and doing so has already cost a review round.

So impersonating a ledger account today accomplishes nothing: the `signerOnly` branch still wins and the device is still prompted. (Rocketh even impersonates such accounts by accident today, because the impersonation candidate set is "named accounts absent from `eth_accounts`", which sweeps in `signerOnly` accounts. The task `account-signability-classification` corrects that as a wasted RPC call, NOT as the removal of this capability — the capability was never there.)

What is missing is the ROUTING decision, not the impersonation.

## Design shape

**Keep capability and preference as separate concepts.** After `account-signability-classification`, the environment knows each address's signing CAPABILITY (`local` / `node` / `impersonated` / `unsignable`). This idea adds a thin PREFERENCE layer on top: given an account that could be signed several ways, which way should this run actually use.

Resist the two tempting shortcuts. A fifth signability state, or a new mode on `autoImpersonate`, would both fold a preference into a capability — the same conflation that `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` records the project already making once, between a node capability and a resolution policy. Capability answers "what can sign this"; preference answers "which of those to use". Keep them apart and this feature stays small.

**Put it at run/account level, not per call.** "Do not make me plug in my ledger for this fork run" is a property of the run, not of one call. A per-call knob would be strange to use: nobody wants the device for call 3 and not call 5.

**It must fail closed, and never silently.** On a real network `hardhat_impersonateAccount` is rejected, so the preference simply cannot take effect and the genuine signer is used, leaving the hardware device as the last line of defence. That is the right behaviour, but it must be LOUD: a user who asked to simulate and silently got a mainnet hardware prompt has been surprised in the worst possible direction. Say what happened.

**Do not call it `autoImpersonate`.** That name is already pinned to a node capability. This is a signer substitution preference and wants its own word (a per-account `simulate: true`, or a run-level list of accounts to simulate).

## Why it is independently shippable

`per-call-autoimpersonate` is parked because its second direction needs a decision on lazy-versus-eager impersonation timing. This idea needs neither: the set of accounts to simulate is known at CONFIG time, and environment init is already exactly where impersonation happens. So it does not inherit that blocker and should not be folded into that note.

## Open

- The config surface: per-account flag, a run-level list of account names, or an execution parameter. Per-account reads best but rocketh has no per-account config today.
- Whether a simulated signer should be reflected in the signability view (as a preference alongside the capability) or resolved purely at the broadcast site.
- Whether the simulation should be refused outright, rather than silently ignored, when the target account has no signer at all (in which case the user wanted plain `autoImpersonate`).
- Whether a deployment produced under a simulated signer deserves any marker. Probably not: it is no different from one produced under an impersonated account, which is already unmarked.

## Related

- `work/notes/ideas/per-call-autoimpersonate.md` — adjacent, but parked on a blocker this idea does not share.
- `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` — the capability-versus-policy separation this idea must not re-muddle.
- `work/tasks/backlog/account-signability-classification.md` — makes this cheap by giving the environment a real notion of per-account signing capability.
- `work/specs/ready/explore-unknown-signer-adapters.md` — the other direction (accounts that genuinely cannot be signed for locally).

_Source: raised in conversation on 2026-08-09 while reviewing the unknown-signer task set, from the observation that a genuine-but-high-friction signer is a distinct case from both a normal signer and an unsignable account._
