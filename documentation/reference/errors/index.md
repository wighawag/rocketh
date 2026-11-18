# Common errors

The errors a run most often stops on, each as rocketh prints it (the first lines, with example values), what it means, and where the fix is explained. Search this page for the start of your message. Every message here is checked against the code by a test, so it reads as it does in your terminal; the values in it (names, addresses, chain ids) are examples.

## Accounts and signers

### A named account cannot be resolved

```text
cannot resolve the named account "deployer" for environment "sepolia" (chain 11155111, endpoint https://sepolia.infura.io/<redacted>):
  - "deployer" is configured as index 0, but the node lists no accounts.
```

The run stopped before any script ran, because an account in `accounts` gives nothing usable for this environment. Most often it is an index (`deployer: 0`) on a real network: an index means one of the node's own accounts, and a public endpoint holds none. Give the account a signer protocol (`privateKey:...`, read from the environment) or an address for that network. The message lists every account that failed, each with its own reason, and ends with the fix for your case. See [Named accounts on a real network](../../named-accounts/#named-accounts-on-a-real-network), and [Under hardhat-deploy](../../named-accounts/#when-the-network-has-no-accounts) when it starts with `Error in community plugin hardhat-deploy:`. Programmatically it is an `UnresolvableAccountsError`.

### A transaction's `from` is an account rocketh cannot sign for

```text
Unknown signer for account 0xfC72680ec948469C21B14F5fFD3FfC7fDa7aE3cD
  Execute the following transaction out-of-band, then re-run:
```

The `from` is a Safe, a timelock or a key rocketh does not hold, and the run had no terminal to pause in (in CI, or with `--skip-prompts` or `--on-unknown-signer throw`), so it deferred the transaction and stopped with an `UnknownSignerError`. Nothing was sent. Execute the printed transaction where its authority lives and run again; a step rocketh checks on chain, or one with a `guard`, is then skipped. From a terminal the run pauses instead and takes the hash of the executed transaction. See [In CI it does not hang, it throws](../../unknown-signers/#in-ci-it-does-not-hang-it-throws) and [What makes the re-run converge](../../unknown-signers/#what-makes-the-re-run-converge).

### rocketh wants to ask you something and there is no terminal

```text
Cannot ask for confirmation: stdin is not a terminal, so there is nobody to answer.
```

A confirmation was needed (the question is printed after this line) and stdin is not a terminal. Run it from a terminal, or pass `--skip-prompts`, which skips every confirmation and forces `--on-unknown-signer throw`. See [CLI](../cli/).

## Chains and deployment folders

### The node is not the chain the environment declares

```text
The node reports chainId 31337, but environment "sepolia" declares chain 11155111. Refusing to continue: every transaction would be signed for chain 31337.
```

The endpoint of the environment answers for another chain. When that node is a fork of the network, say so, and rocketh runs it as a fork: `--is-fork` on the `rocketh` command line, `HARDHAT_FORK` with hardhat-deploy, `environment: {fork: 'sepolia'}` programmatically ([Telling rocketh the run is a fork](../../fork-runs/#telling-rocketh-the-run-is-a-fork)). Otherwise the endpoint, or the chain declared for the environment, is wrong. A local development chain declared as 31337 or 1337 only gets a warning, since a local node that forks another network reports that network's id.

### The deployment folder belongs to another chain

```text
Loading deployment from environment 'sepolia' (with chainId: 11155111) for a different chainId (1)
```

The `.chain` file of `deployments/sepolia` records chain 11155111, and the node of this run is chain 1. rocketh refuses to read records made on another chain, so that pointing a network at another chain cannot make it believe a contract is deployed. Fix the endpoint, or use another environment name for the other chain. See [The folder](../../deployment-records/#the-folder).

### The chain was reset since the records were written

```text
Deployment folder for environment 'localhost' was recorded with genesisHash 0x8e9e..., but the current chain's genesisHash is 0x51d2....
```

Same chain id, but not the same chain: the node was restarted, so the records describe contracts that no longer exist. For a chain you reset on purpose, set `deleteDeploymentsIfDifferentGenesisHash: true` on its chain config and rocketh deletes the stale records itself (it is already on for 31337 and 1337, see [Local development chains](../../environments/#local-development-chains)). The rest of the message covers the case of a stale value in a real network's `.chain` file.

### A deployment folder with no `.chain` file

```text
A '.chain' or '.chainId' file is expected to be present in the deployment folder for network sepolia
```

`deployments/sepolia` exists but does not say which chain it belongs to, so rocketh will not read it. It is usually a folder copied by hand, or one whose `.chain` file was not committed (check your `.gitignore`). Restore the file: it holds `{"chainId": "...", "genesisHash": "..."}` ([The folder](../../deployment-records/#the-folder)).

## Fork runs

### `--reset` on a fork run

```text
Refusing to reset on a fork run: this would delete the deployment records of 'mainnet', the network being simulated, and a fork run never writes them back.
```

A fork run reads the forked network's records, so a reset would delete the real ones. Drop `--reset`, or rehearse from a clean slate under another environment name. See [A fork does not SAVE](../../fork-runs/#a-fork-does-not-save-and-you-do-not-have-to-remember-that).

### The fork node is not running

```text
Could not reach the node at http://127.0.0.1:8545 to ask which chain the fork of "mainnet" is connected to.
```

rocketh attaches to a fork somebody started, it does not start one. Start it (`anvil --fork-url ...`), or name its endpoint in `environments.mainnet.whenForked.rpcUrl`. See [rocketh attaches to a fork](../../fork-runs/#rocketh-attaches-to-a-fork-it-does-not-create-one).

## Transactions and scripts

### A transaction was mined but failed

```text
transaction 0x5c50...e1a7 did not succeed: its receipt reports status 0x0. rocketh requires a successful status before it records anything, so nothing was saved.
```

The transaction is on chain and reverted, usually out of gas, a failed `require`, or a constructor that threw. Nothing was recorded for it, so the next run tries the step again once you fix the cause. Programmatically it is an `UnsuccessfulTransactionError`.

### A guard could not answer

```text
the guard on "getOperationState" of 0xbbbb...bbbb could not be evaluated, so nothing was executed: execution reverted: TimelockController: unknown operation
```

An `execute` guard threw while reading the chain, and a guard that cannot answer stops the run rather than sending a transaction that may already have happened. The end of the line is the underlying failure. See [Trap 2: a guard that cannot answer FAILS the run](../../execute-guard/#trap-2-a-guard-that-cannot-answer-fails-the-run).

### `execute` of `deployViaProxy` mixes its two forms

```text
`execute` for Vault mixes the flat form ({methodName, args}) with the explicit {init, onUpgrade} form.
```

Use one: `{methodName, args}` is called on the first deployment and on every upgrade, `{init, onUpgrade}` names one call for each. Nothing was deployed. See [Upgradeable contracts with proxies](../../proxies/).

## Extensions and `rocketh/config.ts`

### An extension entry is not a function

```text
extension entry "Foo" is a class, which cannot be called with the environment.
```

Something spread into `extensions` exports a class (or a constant) from its root. Every entry is called with the environment, so the root of an extension may hold only curried `(env) => …` functions; the class goes on a subpath. When the package is your own, move it; when it is not, spread only what you use. See [Writing an extension](../../extending/#the-root-export-surface-may-contain-only-curried-functions).

### An extension entry threw before the script started

```text
extension entry "myEntry" threw while the environment was being set up
```

Every entry is called with the environment before each deploy script, whether the script uses it or not, so an entry that throws fails every script. The original message follows on the same line. See [Every entry runs before every script](../../extending/#every-entry-runs-before-every-script).

### `catchUnknownSigner` was given a promise

```text
@rocketh/unknown-signer: catchUnknownSigner takes a FUNCTION, not a promise.
```

Add the arrow: `catchUnknownSigner(() => execute(...))`, not `catchUnknownSigner(execute(...))`. The same applies to `withUnknownSignerPolicy`. See [`catchUnknownSigner` in a migrated script](/hardhat-deploy/migration/#catch-unknown-signer).

### No Hardhat connection in a deploy script

```text
Hardhat deploy connection not found in the environment.
```

`env.getHardhatConnection()` (or `getHardhatConnection(env)`) was called in a run that does not come from Hardhat: the `rocketh` command, a browser, or a test fixture that passes only a provider. Read `env.hardhatConnection`, which is `undefined` there, or pass `extra: {connection}` in the fixture. See [The Hardhat connection](/hardhat-deploy/scripts/#the-hardhat-connection).

## Exporting

### Nothing to export

```text
no deployments to export for environment 'sepolia'
  no such deployment folder: /home/me/my-project/deployments/sepolia
```

`rocketh-export` found no records for that environment. The next lines say why (no folder, an empty folder, or the environments it did find, which usually reveals a typo in `-e`). Nothing was written, and the previous export is left as it was. Programmatically it is a `NoDeploymentsError`. See [Exporting Deployments](../../exporting-and-verifying/#exporting-deployments).
