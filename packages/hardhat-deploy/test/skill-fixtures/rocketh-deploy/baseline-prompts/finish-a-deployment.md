# Branch: re-running a deployment that stopped

## Prompt

Yesterday's deploy to sepolia died halfway through with a "nonce too low" error. Can you clean it up and get everything deployed?

## A run that follows the skill

- re-runs the same scripts, unchanged, on the same environment (after the user's yes on the environment and the chain), knowing that `deploy` skips what is recorded and a guarded `execute` skips what the chain already shows;
- does not pass `--reset`, delete `deployments/sepolia/` or rename deployments to "start fresh";
- checks completion with a fork re-run that sends nothing.
