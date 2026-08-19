# Governed upgrades: what happens when rocketh cannot sign

A demo of `catchUnknownSigner` against the governance topologies real protocols use.

Your deploy key does not own your proxies. A multisig does, or a timelock, or an executor contract owned by a multisig. So a deploy script that wants to upgrade something cannot just send the transaction: it has to hand it to a human who will send it from somewhere else, and then be re-runnable afterwards without redoing the parts that already happened.

That is the entire job of `catchUnknownSigner`. Wrap a privileged call, and instead of halting the run you get back the exact transaction to execute out-of-band:

```typescript
const deferred = await catchUnknownSigner(() =>
	deployViaProxy(
		'Registry',
		{account: deployer, artifact: artifacts.GreetingsRegistry2, args: [prefix]},
		{owner: multisig, proxyContract},
	),
);

if (deferred) {
	// {from, to, value, data}: execute this on the multisig, then re-run.
}
```

This demo makes that loop real: five scenarios, a stand-in multisig you can actually execute through, and an operator script that plays the human.

## The one thing to understand first

**Nothing is persisted.** `catchUnknownSigner` prints the transaction and returns it. There is no unsigned-transactions file, no record mutation, no memory of any kind, exactly as in hardhat-deploy v1. Re-running is safe because the script asks the CHAIN what has already happened, not because rocketh remembers.

The `pending/*.json` files this demo writes are demo code (`demo/pending.ts`), written so the operator script has something to read in a second terminal. Delete them and nothing breaks. Everything under `demo/` is scaffolding for this walkthrough; `rocketh/` holds the real wiring.

## The second thing to understand: a script declares a destination, not a journey

Every scenario here names ONE implementation per run, chosen by `REGISTRY_VERSION` (see `demo/target.ts`):

```bash
pnpm deploy:dev localhost --tags scenario-multisig                    # converge on v1
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig # converge on v2
```

A real project does the same thing by editing the artifact its script names. What a script must NOT do is describe the journey ("deploy v1, then upgrade it to v2") as two `deployViaProxy` calls under one name.

That is not a style preference, it is the difference between a script that converges and one that cannot. `deployViaProxy` decides whether to upgrade by reading the proxy's EIP-1967 implementation slot and comparing it against the implementation it just resolved. Two calls under one name therefore fight: the second upgrades to v2, and on the next run the first sees v2 in the slot, wants v1 back, and issues a **downgrade**. Where the owner is a signable account that merely churns a redundant transaction on every run, invisibly. Where the owner is a multisig, the downgrade comes from an unsignable `from`, and if that first call is not wrapped it throws `UnknownSignerError` and kills the script on run two.

This demo was written the wrong way first, and that is how the trap was found.

## Setup

This demo is a member of the repo's pnpm workspace, so install from the **repo root**, not from here:

```bash
cd ../../..        # the rocketh repo root
pnpm install
pnpm build         # compiles the packages AND every demo's contracts
```

Then come back here and start a node in its own terminal:

```bash
cd demoes/hardhat-deploy/governance
pnpm local_node
```

**If port 8545 is already taken** (another project's node, a local signer, anything), `pnpm local_node` fails with `EADDRINUSE`. Check what is on it before killing anything (`lsof -i :8545 -sTCP:LISTEN`); it may not be yours. To run alongside it, pick another port and point the demo at it:

```bash
npx hardhat node --port 8599
```

and create a `.env.local` here (gitignored) with:

```
ETH_NODE_URI_localhost="http://127.0.0.1:8599"
MNEMONIC_localhost="test test test test test test test test test test test junk"
```

## There is no `pnpm test` here

Deliberately. This demo has no automated tests yet, and a `test` script that runs no tests exits 0, which is worse than not having one. You drive it by hand with the commands below, and the behaviour it demonstrates is covered by the test suite in `packages/rocketh-unknown-signer/test/`.

The short version of the walkthrough, which is the closest thing to "testing" it:

```bash
pnpm deploy:dev localhost --tags scenario-multisig                     # deploys, nothing deferred
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig  # prints the deferred upgrade
pnpm act-as-governance scenario-multisig                               # executes it on the multisig
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig  # converges, nothing left
```

To start over at any point, `rm -rf deployments/localhost pending` and restart the node.

## The scenarios

Each is tag-selected, so you can run just the one matching your governance shape.

| Tag                 | Topology                                    | Works today?     |
| ------------------- | ------------------------------------------- | ---------------- |
| `scenario-multisig` | ProxyAdmin owned by a multisig              | yes              |
| `scenario-multi`    | N proxies, one multisig-owned ProxyAdmin    | yes              |
| `scenario-ordered`  | upgrade plus a dependent follow-up call     | yes              |
| `scenario-timelock` | multisig to Timelock to ProxyAdmin          | **not directly** |
| `scenario-handoff`  | deployer hands the ProxyAdmin to governance | **partly**       |

The last two are known gaps and the demo shows them honestly rather than hiding them. See "The two gaps" below.

### 1. A multisig-owned ProxyAdmin (`scenario-multisig`)

The base case, and the one rocketh serves well.

```bash
pnpm deploy:dev localhost --tags scenario-multisig
```

The first run is a fresh deployment, so it broadcasts from the deployer and `catchUnknownSigner` returns `null`. Wrapping a call that turns out to be signable is harmless, which is worth seeing rather than being told.

Now ask for the new implementation:

```bash
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig
```

The implementation deploy broadcasts from the deployer. The `upgrade` call on the ProxyAdmin has `from` set to the multisig, which rocketh cannot sign for, so it is printed and returned instead:

```
---------------------------------------------------------------------------------------
no signer for 0x…
Please execute the following transaction, then re-run this script:
---------------------------------------------------------------------------------------
from: 0x…      (the multisig)
to: 0x…        (SharedProxyAdmin)
method: upgrade
args:
  - 0x…        (the proxy)
  - 0x…        (the new implementation)
---------------------------------------------------------------------------------------
```

Now play the operator:

```bash
pnpm act-as-governance scenario-multisig
```

And re-run:

```bash
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig
```

That run reads the proxy's implementation slot, finds the upgrade already done, and skips it. `catchUnknownSigner` returns `null`. That convergence is the whole point: **the chain is the state**.

Re-run WITHOUT executing and you get the identical transaction back, with nothing broadcast twice. Re-running is free.

### 2. Many proxies, one admin (`scenario-multi`)

```bash
pnpm deploy:dev localhost --tags scenario-multi
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multi
```

Three proxies behind one multisig-owned ProxyAdmin produce three deferred transactions: same `from`, same `to`, differing in the proxy address inside `data`. They are independent, so they may be executed in any order.

**The trap this scenario exists to teach:** one wrapper captures ONE transaction. The error unwinds the action it was thrown inside, so everything after the deferred call in that action is skipped. Wrapping all three upgrades in a single `catchUnknownSigner` would surface the first and silently drop the other two. Wrap each step separately.

### 3. An upgrade and a dependent follow-up (`scenario-ordered`)

```bash
pnpm deploy:dev localhost --tags scenario-ordered
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-ordered
```

Real upgrades rarely stop at `upgrade()`. Here the upgrade is followed by pointing a governance-owned `Registrar` at the new implementation, from the same owner, so both defer and the operator receives an ordered pair.

The order is enforced on chain: `Registrar.setRegistry` refuses any version that is not exactly the next one. Replay the pair out of order (or twice) and it reverts rather than quietly producing a wrong state. Try it: reverse the array in `pending/scenario-ordered.json` and run the operator script.

The follow-up is guarded by an on-chain read, which is what makes the pair idempotent. Since rocketh persists nothing, "have I already done this?" can only ever be answered by asking the chain.

### 4. A Timelock in the path (`scenario-timelock`)

```bash
pnpm deploy:dev localhost --tags scenario-timelock
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-timelock
pnpm act-as-governance scenario-timelock   # sends the schedule()
# wait 60 seconds for the timelock delay
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-timelock
pnpm act-as-governance scenario-timelock   # sends the execute()
```

Governance here is multisig to Timelock to ProxyAdmin. rocketh reads the ProxyAdmin's on-chain owner and uses it as `from`, so what comes back is `{from: <the timelock>, to: <the admin>, data: upgrade(...)}`.

That is an accurate statement of intent and an impossible transaction. **Nobody can send a transaction from a timelock.**

`deploy/004_timelock_owned_admin.ts` does the translation by hand, visibly, so you can see both the gap and the shape of the fix. Note what the hand-written version has to get right:

- **A deterministic salt.** A re-run must derive the SAME operation id. A random salt schedules an operation you can never match to the first, and the delay has to be waited out again.
- **Three states, not two.** Not scheduled / scheduled but waiting / done. Handing the operator the `schedule` call again while the delay runs would make them send a duplicate that reverts. Surfacing nothing, and saying why, is the correct answer.

The same shape applies to an OpenZeppelin `AccessManager` with a non-zero role delay, which is how newer protocols gate configuration.

### 5. The deployer-to-governance handoff (`scenario-handoff`)

```bash
pnpm deploy:dev localhost --tags scenario-handoff
REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-handoff
```

Every protocol does this exactly once and cannot rehearse it: the ProxyAdmin starts owned by the deploy key and ends owned by governance.

**The sharp edge.** `deployViaProxy`'s `owner` option is not a wish, it is an assertion about the current on-chain owner. Change it from `deployer` to `multisig` in your script without performing the transfer first, and rocketh does not defer a `transferOwnership` for you. It throws:

```
To change owner/admin, you need to call transferOwnership on HandoffProxyAdmin
```

That is a plain `Error`, not an `UnknownSignerError`, so `catchUnknownSigner` rethrows it and the run stops.

**The pattern that works,** and what this scenario demonstrates: declare the owner you currently have (read it from the chain), perform the transfer as its own explicit step, then upgrade.

It also shows something reassuring. While the deployer still owns the admin, the wrapped `transferOwnership` is signable: it broadcasts and returns `null`. **Wrapping a call that turns out to be signable is harmless.** The wrapper forces the throw path only for a `from` rocketh cannot sign for; it never turns a signable account into a deferral, and it never defeats impersonation. The second time a project does this (multisig to timelock, say) the very same line defers instead of broadcasting, with no change to the script.

## The two gaps, stated plainly

1. **A contract that must be called THROUGH, not sent FROM.** Timelocks, `AccessManager` with delays, governance executors. rocketh surfaces a transaction that reads like an instruction and cannot be executed. Scenario 4 works around it by hand. Tracked in `work/specs/proposed/unsignable-routes.md`.
2. **The ownership handoff throws instead of deferring.** Scenario 5 works around it by reading the current owner. Same spec.

Neither is a reason to avoid `catchUnknownSigner`: the multisig case, which is most of the world, works today, and both gaps have a workaround that fits in a few lines of a deploy script.

## About the contracts

- **`SimpleMultisig` is a stand-in for a Gnosis Safe and nothing more.** No threshold, no signature collection, no nonce, no modules: any owner executes alone. It exists because the demo needs an address that CAN be made to send a transaction, which is the only property the flow depends on. Do not read this as a Safe integration, and do not deploy it anywhere that matters.
- **`GovernanceTimelock` is OpenZeppelin's `TimelockController`, unmodified.** The point is to exercise a contract users actually deploy. The delay is 60 seconds instead of a realistic two days so the demo is watchable.
- **`Registrar`** exists to make an ordering constraint enforceable rather than merely described.

## Notes

- **Auto-impersonation must be off** for any of this to happen, and it is off by default. On a fork with `autoImpersonate` on, the node can sign for the multisig, so the account is signable, so nothing defers and everything just broadcasts. That is correct behaviour, and it is why testing the deferral path on a fork means turning impersonation off for the run.
- **The demo never prompts.** `rocketh/config.ts` sets `onUnknownSigner: 'throw'`. The default (`'auto'`) would open the interactive resolver on a TTY, which is a good feature and the wrong one here: the point is to see the transaction printed and hand it to someone.
- This demo lives in this repo alongside its siblings, but like them it is a separate pnpm project with its own `package.json`: install and run it from this directory. It is not currently wired into the root workspace or CI, so nothing compiles it automatically. The behaviour it shows is (or will be) covered by tests in `packages/rocketh-unknown-signer/test/`.
