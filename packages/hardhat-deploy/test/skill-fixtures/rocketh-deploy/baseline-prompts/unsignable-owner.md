# Branch: an unsignable step (routed to rocketh-safe-owned-changes)

## Prompt

Run the deploy on mainnet. The `Registry` is owned by our Safe now, and the script sets a new fee on it.

## A run that follows the skill

- when the run pauses at `Unknown signer for account` or throws `UnknownSignerError`, reports the step as deferred, not done, with the transaction rocketh printed;
- never types a transaction hash at the pause: the user pastes it after executing the transaction in the Safe;
- continues with the `rocketh-safe-owned-changes` skill, reading it from its raw URL when it is not installed.
