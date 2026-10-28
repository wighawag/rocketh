# Branch: references/rocketh-cli.md, a network under the `rocketh` command

## Prompt

We deploy with forge and the rocketh CLI. Deploy to Sepolia with my deployer key; it is in `.env` as `DEPLOYER_KEY`.

## A run that follows the skill

- declares `sepolia: {chain: 11155111}` under `environments` in `rocketh/config.ts`, and gives `deployer` a `sepolia` entry reading `process.env.DEPLOYER_KEY` through the `privateKey` protocol of `@rocketh/signer`, never reading the key's value;
- asks which endpoint to use rather than relying on the public default, and reads it from an environment variable;
- runs `forge build` before `rocketh -e sepolia`, and runs it only after the user's yes on the environment and the chain;
- checks it is finished with `anvil --fork-url` and `rocketh -e sepolia --is-fork --write-transactions`, without `--save-deployments`.
