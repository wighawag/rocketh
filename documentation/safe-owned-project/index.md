# A Safe-owned project, end to end

This guide takes one project from "a Safe owns my proxy" to "the upgrade is done and a re-run sends nothing". The deployer deploys, a Safe owns the proxy, the upgrade is rehearsed on a fork of the real network, then executed for real through the Safe app, and the next run finds nothing left to do. Nothing in it needs a plugin or a second tool: it is rocketh's own handling of an account it cannot sign for.

The worked project is branch [`examples/safe-owned-upgrade`](https://github.com/wighawag/template-ethereum-contracts/tree/examples/safe-owned-upgrade) of template-ethereum-contracts, and [what it adds to the template](https://github.com/wighawag/template-ethereum-contracts/compare/main...examples/safe-owned-upgrade) is small: a Safe declared per network, a deploy script that creates it, and two scripts to rehearse. It was run on Sepolia exactly as written below. The excerpts here are what the guide needs; the branch is the complete project.

The commands are the template's pnpm scripts, each shown once with the command it runs. They work from the repository root; `@@MODE` in the template's scripts is the network name you pass (`sepolia`).

## 1. Name the Safe before it exists

rocketh needs the Safe's address in `rocketh/config.ts`, as the account that owns the proxy, and the Safe does not exist yet. It does not have to: a Safe created through Safe's own factory (v1.4.1, at the same addresses on every chain Safe supports) lands at a CREATE2 address computed from the factory, the Safe implementation, its owners, its threshold and a salt. The branch keeps those parameters per network in `rocketh/safe.ts`:

```typescript
// contracts/rocketh/safe.ts (excerpt)
export const safes: {readonly [network: string]: SafeSpec} = {
	sepolia: {
		owners: ['0xE53cd71271AcAdbeb0f64d9c8C62bBdDc8cA9e66'], // the key that approves in the Safe app
		threshold: 1n,
		saltNonce: 0n,
	},
};

/** Where `createProxyWithNonce` puts this Safe, computed exactly as the factory does. */
export function predictSafeAddress(spec: SafeSpec): `0x${string}` {
	const salt = keccak256(encodePacked(['bytes32', 'uint256'], [keccak256(safeInitializer(spec)), spec.saltNonce]));
	return getContractAddress({
		opcode: 'CREATE2',
		from: SAFE_V1_4_1.factory,
		salt,
		bytecode: concat([SAFE_V1_4_1.proxyCreationCode, pad(SAFE_V1_4_1.singleton)]),
	});
}
```

and names the result as the `admin` account on Sepolia (the dev node's account 1 everywhere else):

```typescript
// contracts/rocketh/config.ts (excerpt)
import {predictSafeAddress, safes} from './safe.js';
const SEPOLIA_SAFE = predictSafeAddress(safes.sepolia);

export const config = {
	accounts: {
		deployer: {default: 0},
		admin: {default: 1, sepolia: SEPOLIA_SAFE},
	},
	environments: {
		sepolia: {
			chain: 11155111,
			whenForked: {fundImpersonatedAccounts: true},
		},
	},
	// ...
} as const satisfies UserConfig;
```

An address in `accounts` that rocketh holds no key for is how a Safe, a multisig or a timelock appears in a config: nothing else marks it. `environments.sepolia` matters for step 4: `chain` says what a fork of `sepolia` is a fork of (anvil reports it by itself, a hardhat fork does not), and `whenForked` holds what is true of a rehearsal only.

A deploy script then makes the Safe exist, and does nothing once it does, on a re-run or on a fork of a network where it was created (`contracts/deploy/000_deploy_safe.ts`):

```typescript
// contracts/deploy/000_deploy_safe.ts (excerpt)
export default deployScript(
	async (env) => {
		const spec = safes[env.name];
		if (!spec) return;
		const address = predictSafeAddress(spec);

		const code = await env.network.provider.request({method: 'eth_getCode', params: [address, 'latest']});
		if (code && code !== '0x') return;

		// (the script also checks that the factory on chain is Safe v1.4.1's before using it)
		await env.tx(
			{
				account: env.namedAccounts.deployer,
				to: SAFE_V1_4_1.factory,
				data: encodeFunctionData({
					abi: SAFE_FACTORY_ABI,
					functionName: 'createProxyWithNonce',
					args: [SAFE_V1_4_1.singleton, safeInitializer(spec), spec.saltNonce],
				}),
			},
			{message: `  - Creating the Safe at ${address}: {hash}`},
		);
	},
	{tags: ['Safe', 'Safe_deploy']},
);
```

The proxy's script depends on it (`dependencies: ['Safe']`), since on a network with a Safe the owner must exist first. Change the owners (before the first deployment) to use your own keys.

## 2. Deploy with the Safe as the proxy owner

```bash
pnpm contracts:deploy sepolia --reset
# runs: hardhat --network sepolia deploy --reset
```

The deployer (account 0 of the mnemonic in `MNEMONIC_sepolia`, see [Networks and accounts](/hardhat-deploy/networks/)) pays for everything: the Safe's creation, the implementation, the proxy. Nothing needs the Safe yet, because creating a proxy owned by an account is not a call from that account. `--reset` starts Sepolia's records afresh on this branch only because the template's `main` already has a proxy there with another owner, and rocketh refuses to change an owner itself.

The proxy is the ordinary `deployViaProxy` of the template, with `owner: admin`:

```typescript
await env.deployViaProxy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: [prefix]},
	{owner: admin, execute: 'init', linkedData: {prefix, admin}, deterministicImplementation: true},
);
```

## 3. Change the implementation

Make an upgrade due. On the branch, set `prefix` in `contracts/deploy/001_deploy_greetings_registry.ts` to something new (`'v2: '`): the implementation's constructor argument changes, so a new implementation is deployed and the proxy has to be upgraded to it. Only the owner can send that upgrade, and the owner is the Safe.

## 4. Rehearse on a fork

Start a fork of Sepolia in its own terminal:

```bash
pnpm contracts:fork:node sepolia
# runs: anvil --fork-url $ETH_NODE_URI_sepolia
```

It listens on `http://127.0.0.1:8545`. `ETH_NODE_URI_sepolia` comes from `contracts/.env.local`, and must be a plain URL there (anvil cannot read the `SECRET` form of the network helpers).

Then run the upgrade against it:

```bash
pnpm contracts:fork:rehearse sepolia
# runs: hardhat compile --quiet && rocketh --write-transactions fork-batch.json -e sepolia --is-fork
```

What happens, and why:

- **`--is-fork` makes it a [fork run](../fork-runs/).** It reads `deployments/sepolia` (the real proxy, the real owner), takes Sepolia's settings, and writes nothing back.
- **The Safe is impersonated.** Impersonation is on by default for a fork, and the Safe is a named account, so the node sends the upgrade as the Safe and you see the whole upgrade succeed against the real state.
- **The Safe's gas is lent.** On a fork the impersonated Safe sends, and so pays for, its own call, which it never does for real and usually cannot (a Safe holds no ETH). `whenForked: {fundImpersonatedAccounts: true}` has rocketh lend it exactly the gas of each transaction and take it back once mined. See [Paying the impersonated account's gas](../fork-runs/#paying-the-impersonated-accounts-gas-fundimpersonatedaccounts).
- **The batch is written.** `--write-transactions` writes every transaction the run sent, in order, to `contracts/fork-batch.json`:

```json
[
	{"type": "intent", "from": "0xf39f...2266", "to": "0x4e59...956c", "data": "0x0000...", "signability": "node"},
	{
		"type": "intent",
		"from": "0xfc72...e3cd",
		"to": "0xd9be...0771",
		"value": "0x0",
		"data": "0x4f1ef286...",
		"signability": "impersonated"
	}
]
```

The first entry is the new implementation, deployed deterministically by the fork node's own account. The second is the upgrade (`upgradeToAndCall`, with the `init` call attached) sent as the Safe: the `impersonated` entries are exactly what the Safe will have to execute for real. [Captured transactions](../captured-transactions/) covers reading and segmenting that list.

The run asks you to confirm the gas price before it starts; answer it, or add `--skip-prompts` (on a fork nothing is left for the unknown-signer policy, since the Safe is impersonated). Rehearsing again on the same anvil node finds the upgrade already done there: restart anvil to rehearse from scratch.

Under hardhat-deploy the same rehearsal is `HARDHAT_FORK=sepolia hardhat --network fork deploy` (the template's `contracts:fork:deploy sepolia`), with hardhat's in-process fork. That fork reports chain 31337, which is why `environments.sepolia.chain` has to be declared, see [A hardhat fork reports chain 31337](../fork-runs/#through-hardhat-deploy-hardhat_fork). It does not write a batch file (the hardhat task has no `--write-transactions`).

## 5. Upgrade for real

```bash
pnpm contracts:deploy sepolia
# runs: hardhat --network sepolia deploy
```

The run deploys the new implementation (the deployer can), then reaches the upgrade, whose `from` is the Safe. rocketh cannot sign for it, so with a terminal attached it [pauses](../unknown-signers/#the-default-rocketh-asks-you-execute-the-run-continues) and prints the transaction the Safe has to execute (abridged here):

```text
Unknown signer for account 0xfc72...e3cd
  Execute the following transaction out-of-band, then re-run:
  contract: GreetingsRegistry.upgradeToAndCall("0xb19d...3b64", "0xf9fb...")
  abi: [{"inputs":[...],"name":"upgradeToAndCall",...,"type":"function"}]
  from: 0xfc72...e3cd
  to: 0xd9be...0771
  data: 0x4f1ef286...
```

Open the Safe in the Safe app with its owner's key, and in the Transaction Builder enter the `to` address, paste the one-line ABI from `abi:` if it does not find one, pick the method named on the `contract:` line with the arguments shown there (or use the `data:` line as custom data), then create, sign and execute it ([step by step](../unknown-signers/#executing-it-from-a-safe-with-the-transaction-builder)). Paste the hash of that execution at the pause.

rocketh does not take the hash on trust. It waits for the transaction, requires a successful receipt, and decodes it: a Safe `execTransaction` on the Safe whose inner call is exactly the requested one (same `to`, `value` and `data`, a plain CALL) is accepted, and anything else makes it ask you before recording ([What rocketh checks](../unknown-signers/#an-execution-is-weighed-on-evidence)). Then the run continues and saves the records.

In CI, where nobody can paste a hash, the same step throws instead and prints the transaction, and the next run from a terminal accepts the hash of a transaction you executed in between. [A run that threw will hand you the same transaction again](../unknown-signers/#a-run-that-threw-will-hand-you-the-same-transaction-again) covers that path.

## 6. Run again: nothing is sent

```bash
pnpm contracts:deploy sepolia
```

The implementation is unchanged, so nothing is deployed, and the proxy already points at it, so there is no upgrade to send: `deployViaProxy` reads the proxy's EIP-1967 implementation slot rather than trusting its own record, so it sees the upgrade the Safe executed even if the record had not caught up. The run converges and sends nothing.

That convergence comes for free with `deployViaProxy`, `deploy` and `diamond`, which compare against the chain. A privileged `execute` you write yourself (a role grant, a parameter change sent by the Safe) has no such check, and a re-run would hand the Safe the same transaction again. Give it a [`guard`](../execute-guard/), which states what to read on chain to know the call already landed.

## Where to go from here

- [Rehearse on a fork](../fork-runs/): everything a fork run inherits, the two chain ids, `whenForked`, impersonation.
- [Unknown signers](../unknown-signers/): the pause, the `onUnknownSigner` policies, deferring with `catchUnknownSigner`, governance-owned calls.
- [Captured transactions](../captured-transactions/): turning a rehearsal into Safe proposals, and replaying a deployment in a Solidity test.
- [Guard execute calls](../execute-guard/): making a privileged call converge.
- [Production hardening](../production-hardening/): the checks before a live privileged change.
