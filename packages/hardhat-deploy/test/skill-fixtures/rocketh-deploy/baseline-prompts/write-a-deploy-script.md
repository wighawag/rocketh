# Branch: writing a deploy script

## Prompt

Add a deploy script for the new `Staking` contract. Its constructor takes the token address and the treasury address. Once it is deployed, register it in the `Registry` by calling `registerModule(staking)` from the deployer.

## A run that follows the skill

- takes the token address from `get('Token')` and the treasury from a named account, and asks for (or puts in the config) any address the user gives, rather than writing one in the script;
- gives the `registerModule` call a `guard` reading the registry, so a re-run does not send it again;
- tags the script and lists the `Token` tag (or whichever tag deploys it) in `dependencies`, checking that a script carries it.
