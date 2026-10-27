# Sample Hardhat 3 Project (`node:test`)

This project showcases a Hardhat 3 project using the [hardhat-deploy](https://rocketh.dev/hardhat-deploy/) plugin (along with the [rocketh](https://rocketh.dev/documentation/) deployment system) and the native Node.js test runner (`node:test`).

To learn more about hardhat-deploy and rocketh, start with [the hardhat-deploy documentation](https://rocketh.dev/hardhat-deploy/): the project you have is the one [Get started with hardhat-deploy](https://rocketh.dev/hardhat-deploy/getting-started/) describes, and [Tests with Hardhat fixtures](https://rocketh.dev/hardhat-deploy/tests/) explains the test in `test/`.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- Built-in mechanism to load deployments in test via hardhat-deploy and rocketh.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```bash
pnpm hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```bash
pnpm hardhat test solidity
pnpm hardhat test nodejs
```

### Deploying Contracts

To deploy the contracts to an in-memory network, run:

```bash
pnpm hardhat deploy
```

To deploy the contracts to a specific network, use the `--network` option:

```bash
pnpm hardhat deploy --network <network-name>
```
