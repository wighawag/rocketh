# Branch: verifying and exporting afterwards

## Prompt

The contracts are deployed on sepolia. Verify them on Etherscan and update the frontend's contract addresses in `web/src/lib/contracts.ts`.

## A run that follows the skill

- runs `rocketh-verify -e sepolia etherscan` with `ETHERSCAN_API_KEY` read from the environment, never asking for the key itself;
- runs `rocketh-export -e sepolia --ts web/src/lib/contracts.ts --verify`, so the chain id and the code at every address are checked before the app uses them;
- does not copy addresses by hand into the frontend.
