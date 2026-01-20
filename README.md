<div align="center">
<img alt="Rocketh Logo" src="./public/logo.svg" width="100"><br/>
  <a href="https://rocketh.dev">Rocketh</a>
<hr/>

<img src="https://img.shields.io/github/repo-size/wighawag/rocketh" alt="Repo Size">
<img src="https://img.shields.io/npm/v/rocketh" alt="npm version">
<img src="https://img.shields.io/github/license/wighawag/rocketh" alt="License">

</div>

# Rocketh

A framework-agnostic smart contract deployment system for Ethereum-compatible networks.

## Features

- 🔧 **Framework Agnostic** - Works with any Ethereum development toolchain
- 📝 **Deploy Scripts** - Write deployment scripts that run anywhere, including in the browser
- 🔄 **Deterministic Deployments** - Support for CREATE2 and CREATE3 deployment patterns
- 💎 **Diamond Pattern** - First-class support for EIP-2535 Diamond proxies
- 🔀 **Proxy Patterns** - Support for ERC1967, UUPS, Transparent, and ERC173 proxies
- 📦 **Named Accounts** - Reference accounts by name instead of address
- 💾 **Deployment Tracking** - Save and track deployments with transaction receipts
- ✅ **Contract Verification** - Built-in support for Etherscan and Sourcify
- 📄 **Documentation Generation** - Auto-generate documentation from deployed contracts

## Packages

| Package | Description |
|---------|-------------|
| [`rocketh`](./packages/rocketh) | Core deployment environment and execution |
| [`@rocketh/core`](./packages/rocketh-core) | Shared types and utilities |
| [`@rocketh/deploy`](./packages/rocketh-deploy) | Standard contract deployment |
| [`@rocketh/proxy`](./packages/rocketh-proxy) | Proxy deployment patterns (UUPS, Transparent, ERC173) |
| [`@rocketh/diamond`](./packages/rocketh-diamond) | EIP-2535 Diamond proxy support |
| [`@rocketh/read-execute`](./packages/rocketh-read-execute) | Contract read/write utilities |
| [`@rocketh/node`](./packages/rocketh-node) | Node.js deployment executor |
| [`@rocketh/verifier`](./packages/rocketh-verifier) | Contract verification (Etherscan, Sourcify) |
| [`@rocketh/export`](./packages/rocketh-export) | Export deployments for frontend consumption |
| [`@rocketh/doc`](./packages/rocketh-doc) | Documentation generation |
| [`@rocketh/signer`](./packages/rocketh-signer) | Signer utilities |
| [`@rocketh/router`](./packages/rocketh-router) | Route-based contract deployment |
| [`@rocketh/web`](./packages/rocketh-web) | rocketh in web browser |

## Installation

```bash
# Using pnpm
pnpm add rocketh @rocketh/deploy @rocketh/node

# Using npm
npm install rocketh @rocketh/deploy @rocketh/node

# Using yarn
yarn add rocketh @rocketh/deploy @rocketh/node
```

## Documentation

For full documentation, visit [rocketh.dev](https://rocketh.dev).

## License

[MIT](LICENSE)