# Exporting, verifying and documenting

Once contracts are deployed, three separate packages turn the deployment records into things other people consume: verified source on a block explorer, addresses and ABIs for a frontend, and generated reference documentation.

## Contract Verification

The `@rocketh/verifier` package publishes your contract source to a block explorer, so the code at your address can be read and audited:

```bash
npx rocketh-verify -e sepolia etherscan
```

Sourcify and Blockscout are supported alongside Etherscan. See the [`@rocketh/verifier` README](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-verifier#readme) for the full option list, supported networks and troubleshooting.

## Exporting Deployments

The `@rocketh/export` package allows you to export deployments for use in frontends:

```bash
npx rocketh-export -e sepolia --ts ./src/contracts.ts
```

If the named environment has no deployments (a misspelled name, or a network you have not deployed to yet), the export fails with a non-zero exit code and writes nothing. That is deliberate: the generated file is your app's source of truth for addresses, and it is usually already there from an export against another network, so succeeding without writing would leave the app pointing at that other network's contracts without saying so.

The module formats (`--tsm` / `--jsm`) emit one named export per deployment (`export const Token = ...`), so a deployment name has to be a valid JavaScript identifier there. A name like `Token-V2`, `My Registry` or `default` is refused with a message naming it, rather than writing a file that does not parse. The object formats (`--ts`, `--js`, `--json`) keep names exactly as they are and have no such constraint.

### Checking the export against the chain (`--verify`)

Export reads files and writes files. It makes no network request, which is what lets it run in an offline CI build, and it also means it cannot tell that a deployment record is stale, that the chain it describes was reset, or that you are exporting an environment that is not the network your app will connect to. That failure usually surfaces much later, as a user's transaction reverting against an address holding no code.

`--verify` asks the chain first:

```bash
npx rocketh-export -e sepolia --ts ./src/contracts.ts --verify
```

It checks that the chain id the RPC reports matches the one recorded for the environment, and that every exported address has code. On failure it writes nothing and leaves the previous output alone, naming every contract at fault. A wrong chain id is reported on its own, because on the wrong network every address also looks empty. An unreachable node fails the export rather than skipping the checks: you asked for verification, and "could not check" is not "checked".

It is opt-in for exactly the reason above: an offline build must keep working, so verification is something you turn on before shipping, not something every build pays for. It needs an `rpcUrl` for the chain (or a provider passed to `run()` programmatically).

### `linkedData` is public

Whatever you attach as `linkedData` on a deployment is stored in the deployment record and copied into every export, so it ends up in the frontend bundle you ship and in the repository if you commit your deployments. Treat it as public: it is a convenient place for a prefix, an admin address or a start block, and the wrong place for an API key, a private RPC URL with a token in it, or anything else you would not publish.

## Generating Documentation

The `@rocketh/doc` package generates reference documentation from your deployments, reading each one's ABI and the NatSpec carried in it:

```bash
npx rocketh-doc -e sepolia -o ./docs/contracts
```

A proxied contract saves three records (`MyContract`, `MyContract_Proxy`, `MyContract_Implementation`), so most projects want to filter the generated ones out:

```bash
npx rocketh-doc -e sepolia -o ./docs/contracts --except-suffix _Implementation _Proxy
```

Output is rendered through Handlebars templates, and `-t` points at your own. See the [`@rocketh/doc` README](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-doc#readme) for the template format and the programmatic API, including `generateDocumentationData` for building the model and rendering it yourself.
