# @rocketh/doc

`rocketh-doc`: reference documentation of an environment's deployments, generated from their ABIs and NatSpec through Handlebars templates (bundled, or your own), or as a data model you render yourself.

## Installation

```bash
pnpm add -D @rocketh/doc
# or
npm install --save-dev @rocketh/doc
```

`@rocketh/node` is a peer dependency.

## Example

```bash
# leave out the records a proxy writes next to the contract
npx rocketh-doc -e sepolia -o ./docs/contracts --except-suffix _Implementation,_Proxy
```

## Documentation

- [Generating documentation](https://rocketh.dev/documentation/exporting-and-verifying/#generating-documentation)
- [rocketh-doc, every option](https://rocketh.dev/documentation/reference/cli/#rocketh-doc)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
