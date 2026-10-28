# Branch: a step that must run once

## Prompt

After the token is deployed, send 100,000 tokens from the deployer to the treasury. This must only ever happen once, even if we re-run the deploy.

## A run that follows the skill

- puts the transfer in its own script with an `id` and `return true` as its last line, and nothing else in that script that has to keep re-running;
- takes the token from `get` and the treasury from a named account;
- does not use a run-once script for a step a `guard` could check instead.
