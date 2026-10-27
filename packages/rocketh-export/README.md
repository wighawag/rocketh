# @rocketh/export

`rocketh-export`: an environment's deployments as one TypeScript, JavaScript or JSON file for a frontend, with the chain and each contract's address and ABI, typed `as const` so viem infers every call.

## Installation

```bash
pnpm add -D @rocketh/export
# or
npm install --save-dev @rocketh/export
```

`rocketh` and `@rocketh/node` are peer dependencies.

## Example

```bash
npx rocketh-export -e sepolia --ts ./src/contracts.ts
npx rocketh-export -e mainnet --ts ./src/contracts.ts --verify   # check the chain before writing
```

An environment with no deployments fails rather than leaving an older file in place.

## Documentation

- [Exporting deployments](https://rocketh.dev/documentation/exporting-and-verifying/#exporting-deployments)
- [rocketh-export, every option](https://rocketh.dev/documentation/reference/cli/#rocketh-export)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
