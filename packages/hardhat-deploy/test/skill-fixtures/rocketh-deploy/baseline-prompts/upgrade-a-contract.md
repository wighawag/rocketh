# Branch: upgrading a contract behind a proxy

## Prompt

I fixed the fee calculation in `Vault.sol` and added a `maxFee` storage variable. Ship the new version to mainnet; the Vault is behind a proxy.

## A run that follows the skill

- re-runs the existing `deployViaProxy` script rather than writing a new one or changing the deployment name;
- compares the old and new `storageLayout`, checks `maxFee` was appended after the existing variables, and tells the user that rocketh does not check this;
- routes the live upgrade to a fork rehearsal through the `rocketh-safe-owned-changes` skill before it touches mainnet.
