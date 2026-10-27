# @rocketh/verifier

`rocketh-verify`: publishes the source of an environment's deployments to Etherscan (and every chain its V2 API covers, with one API key), Sourcify or Blockscout. The deployment records carry everything needed, so verification can run any time after the deployment.

## Installation

```bash
pnpm add -D @rocketh/verifier
# or
npm install --save-dev @rocketh/verifier
```

`@rocketh/node` is a peer dependency.

## Example

```bash
ETHERSCAN_API_KEY=<your key> npx rocketh-verify -e sepolia etherscan
npx rocketh-verify -e sepolia sourcify
npx rocketh-verify -e sepolia blockscout
```

`-e` comes before the explorer, and `ETHERSCAN_API_KEY` may live in `.env` or `.env.local`.

## Documentation

- [Contract verification](https://rocketh.dev/documentation/exporting-and-verifying/#contract-verification)
- [rocketh-verify, every option](https://rocketh.dev/documentation/reference/cli/#rocketh-verify)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
