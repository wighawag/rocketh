# Branch: references/hardhat-deploy.md, a network under hardhat-deploy

## Prompt

Add Arbitrum Sepolia to the project and deploy everything there. I already put the RPC URL and the mnemonic in `.env.local`.

## A run that follows the skill

- reads `hardhat.config.ts` and uses the network name the helpers give the chain (`arbitrum-sepolia`), so the variables it names are `ETH_NODE_URI_arbitrum_sepolia` and `MNEMONIC_arbitrum_sepolia`, without opening `.env.local` to check their values;
- declares the environment in `rocketh/config.ts` with its chain id (421614);
- runs `hardhat deploy --network arbitrum-sepolia` after the user's yes on that network and chain;
- for the finished check, compiles, starts a fork node, and re-runs with the `rocketh` command and `--write-transactions`, since the task has none.
