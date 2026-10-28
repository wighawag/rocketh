# Handling unknown signers (Safe / multisig owners)

Sooner or later a deploy script has to make a call that it is not allowed to make itself: a proxy upgrade, a diamond cut, an ownership transfer, a treasury change. The `from` is a Safe, a timelock, a governance contract or a hardware wallet, and rocketh has no way to produce a signature for it. That address is **unsignable**.

You do not need to install anything or restructure your script to handle this. It is built into rocketh, and by default it pauses and asks you.

## The default: rocketh asks, you execute, the run continues

With the default policy (`onUnknownSigner: 'auto'`) and a terminal attached, rocketh does not fail on an unsignable `from`. It **pauses**: it prints the exact transaction that has to happen, and waits.

You go and execute that transaction wherever its authority lives (your Safe, a hardware wallet, an air-gapped machine, a governance proposal; for the last one see [When the owner is governance, not a multisig](#when-the-owner-is-governance-not-a-multisig)), then paste the resulting transaction hash back. rocketh waits for it to be mined, checks it, saves the deployment state, and **carries on with the same run**.

That is the whole workflow. There is no re-run dance, nothing to install, and an upgrade with several privileged steps pauses at each one and finishes them all in a single run.

Because the run never gives up on the step, a script that resolves its privileged calls this way finishes normally, and rocketh watched each transaction land before saving anything. So a [run-once script](../script-lifecycle/) that ends with `return true` is telling the truth on this path. Only a script that catches a deferral and carries on can record a completion nobody earned ([Running once](../script-lifecycle/#never-return-true-on-a-path-where-a-step-was-deferred)).

### What the pause prints

For a contract call made through `execute` (which is also how `deployViaProxy` sends an upgrade), the pause names the deployment, the function and its arguments, and prints the ABI of that ONE function on a single line:

```
Unknown signer for account 0x1111111111111111111111111111111111111111
  Execute the following transaction out-of-band, then re-run:
  contract: Vault.upgradeTo("0xcccccccccccccccccccccccccccccccccccccc03")
  abi: [{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  from: 0x1111111111111111111111111111111111111111
  to: 0xcccccccccccccccccccccccccccccccccccccc02
  data: 0x3659cfe6000000000000000000000000cccccccccccccccccccccccccccccccccccccc03
```

The name is the deployment record at `to`. When several records share that address, which is what extensions leave behind (`Vault` and the `Vault_Proxy` record `@rocketh/proxy` writes next to it, a diamond's `_DiamondProxy`, a router's `_Router`), the name shown is the one the others are derived from (`Vault`); an address with no record shows no name, and `to` is always printed anyway. A plain `tx`, a value transfer and a deployment have no function to name, so they print neither `contract:` nor `abi:`.

#### Executing it from a Safe with the Transaction Builder

The `abi:` line is there for a Safe's Transaction Builder. Given an ABI, the Builder decodes the call and shows its method and inputs, so you (and every co-signer) can read what you are approving instead of a hex blob. It tries to fetch an ABI for the address you enter, which is not always possible (an unverified contract, a proxy, a network its explorer does not cover), and it accepts a pasted one:

1. Open the Transaction Builder in the Safe that is the `from` above, and enter the `to` address.
2. If it does not find an ABI, paste the whole `[...]` after `abi:` into its ABI field.
3. Choose the method named on the `contract:` line and enter the arguments shown there (or use the custom-data option with the `data:` line, which is the exact calldata).
4. Create the batch, collect the signatures, execute it, and paste the hash of that execution back at the pause.

The ABI comes from the deployment your script passed to `execute`, not from looking anything up by address, so it is printed even for a contract that was never saved, and for an overloaded function it is the overload that was actually called.

### At the pause you have two answers

- **Paste the transaction hash.** rocketh looks the transaction up on the network, waits for it to be mined, requires the receipt to report a SUCCESSFUL status, saves state through the same pending-transaction path a normal broadcast uses, records the hash for gas reporting, and returns the receipt to your script. It never sends a transaction of its own.
- **`cannot sign`** (or just press enter). rocketh prints the full transaction and raises `UnknownSignerError`, which defers the transaction exactly as the `throw` policy does: [A run that threw will hand you the same transaction again](#a-run-that-threw-will-hand-you-the-same-transaction-again) says what to do next. Aborting the prompt (Ctrl-C) does the same.

### A hash that does not work out is asked again, not fatal

A paste can be wrong in two ways, and neither ends the run. A value that is **not a transaction hash** (you pasted an address, or half a line) is rejected on the spot. A hash this node has **never heard of** (copied from the wrong network's explorer, or a character your terminal ate) is given a short grace period to show up and then reported as not found. Either way rocketh asks the same question again, and for a not-found hash it offers the value you typed BACK to you: press enter to look for that same hash once more, which is what you want when the transaction is real and the RPC had simply not caught up, or type a corrected one.

The re-asking is BOUNDED: **one pause asks at most three times in total**, and the two kinds of bad answer share that budget, so a prompt nobody is really answering cannot pause a run for ever. When it runs out, the transaction is deferred exactly as `cannot sign` defers it: the full transaction is printed, `UnknownSignerError` is raised, and nothing is saved. The exits work from the re-asked question too, so you are never held at a prompt you cannot satisfy: an empty answer, `cannot sign` and Ctrl-C all defer.

Nothing is recorded for a hash that was refused. The checks below all run before rocketh writes anything at all, so a rejected paste leaves no deployment record, no pending-transaction file and no gas-tracker entry, and the invariants are applied to the hash you FINALLY gave it, not to an earlier attempt.

### A hash from an earlier run is still good

The hash you paste does not have to be fresh. rocketh asks three things of it and none of them is its age: that this network knows it, that its receipt reports success, and that it carries evidence of being the call rocketh asked for (the table below). A transaction you executed hours ago, or after a previous run that stopped on this very step, is accepted and resolves the step in the run you are in now.

That makes the interactive path the way OUT of a deferral that already happened. A run under `throw` printed a transaction, you executed it on your Safe, and the next run is showing it to you again: re-run from a terminal, and when rocketh pauses, paste the hash of the transaction you already executed. Nothing in the script has to change and nothing has to be executed twice.

### In CI it does not hang, it throws

"Can the run ask a human for text?" is a CAPABILITY of the runtime, not a preference: it is true only when the run carries a `PromptExecutor` that implements `promptText`. `@rocketh/node` (the `rocketh` CLI and the hardhat-deploy path) supplies one **only when stdin is a terminal**; `@rocketh/web` deliberately never does, because a browser cannot sensibly ask you to paste a transaction hash.

So a CI job, whose stdin is not a terminal, has no text capability at all and takes the `throw` path. It never blocks on a prompt, even under `'auto'` and even if a script hardcodes `'ask'`. Capability is a CEILING, not a default.

(The TTY check is not politeness: the underlying prompt library, asked a question with no terminal behind it, never answers and never fails, so the only safe move is not to ask.)

### A run that threw will hand you the same transaction again

The throw is not only a failure, it is an ABORT, and that has a consequence worth stating plainly. The deploy script never returns, so nothing records that this step was reached. That includes the [run-once mechanism](../script-lifecycle/): a script that declares an `id` and ends with `return true` has its migration recorded only when the function RETURNS, and the deferral unwound the run before it could. The id is never written, and the next run runs that script again from the top.

This is the one path on which an author who did everything right is still exposed. The same script, with a SIGNABLE account, executes the call, returns `true`, records its id and is skipped on every later run. With an UNSIGNABLE account under `throw` it records nothing at all.

So after you execute the transaction on your Safe and re-run, rocketh reaches the same call and prints the SAME transaction. It did not send the first one and never saw one land, so it has no way of knowing you already executed it, and following the instructions a second time executes the call twice: a wasted round trip for an idempotent setter, and a real loss for a mint, a transfer, an increment or a governance action carrying its own nonce. The error message says so, and points at the first of the two ways out:

- **Re-run from a terminal and paste the hash you already have.** [A hash from an earlier run is still good](#a-hash-from-an-earlier-run-is-still-good), so the transaction you executed after the run that threw resolves the step now. Nothing in your script changes.
- **[Guard the step](../execute-guard/)** so that a re-run reads the chain, sees the effect has already landed, and skips the call without asking anyone. That is the durable fix, and the only one that works with no human in the loop at all, which is what a CI re-run is.

Both of those are REMEDIES, and neither is the diagnosis. "You forgot a guard" does not explain this: a guard is optional, and an unguarded call re-executes on any re-run whether or not a deferral was involved. What the deferral adds is the abort, which keeps the completion from being recorded at all.

## What rocketh checks before recording anything

You pasted a hash. rocketh does not simply believe it.

### A deployment is anchored to an address

A DEPLOYMENT from an unsignable `from` is held to a stricter standard than an execution, because it has an address to check against:

- **an ordinary deployment** is recorded at the address the pasted transaction's OWN receipt reports as created;
- **a deterministic (or factory) deployment**, whose address was computed from bytecode and salt before broadcast, is recorded at that expected address only once rocketh has seen CODE at it on-chain. It confirms by looking for the code, never by parsing the transaction, so it does not matter what wrapper your multisig executed it inside.

Anything else FAILS, saving nothing: a receipt that reports no created contract (or the zero address), an expected address with no code at it, a transaction that did not succeed, or a node that cannot answer the code lookup at all (unable to confirm is not the same as confirmed, so the run fails rather than recording a deployment nobody verified). The error names the deployment, the hash you pasted and the transaction that still needs executing, so a wrong hash cannot quietly leave you with a deployment record pointing at an address holding nothing.

This applies to the interactive path only. A deployment rocketh broadcast itself is unaffected and gains no new check: it sent that transaction, so there is nothing to distrust.

### An execution is weighed on evidence

For an EXECUTION there is no address to anchor on, so rocketh weighs whether the transaction you pasted looks like the one it asked for. It cannot simply compare `to` and `data`: a governed execution is routinely wrapped by the multisig into a different shape, so a mismatch is not evidence of a mistake. It ranks the evidence instead:

| what it finds                                                                                                       | what that is                                                | outcome  |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| same `to`, `data` and `value`                                                                                       | the transaction itself                                      | accepted |
| a Safe `execTransaction` sent TO the account, whose inner call is exactly the request (`to`, `value`, `data`, CALL) | executing it from the Safe app                              | accepted |
| your calldata appears verbatim inside the transaction's input                                                       | a Safe MultiSend, a timelock, another wallet's `execute`    | accepted |
| a Safe `execTransaction` sent TO the account, whose inner call is something else                                    | another transaction of the same Safe                        | asks you |
| sent TO the account, but neither of the above                                                                       | a wallet executing by id, or any other call to that account | asks you |
| none of the above                                                                                                   | nothing linking the two                                     | asks you |

The accepted tiers say which one matched. A Safe execution of exactly the requested call prints:

```
  - accepted: the transaction you pasted is a Safe execution (execTransaction) on 0x1111...1111, the account this transaction had to come from, and the Safe executed exactly this call (same to, value and data, operation CALL)
```

The others PAUSE and ask you to confirm before recording anything. When the Safe demonstrably executed something else, the question says what it executed instead, next to what was requested:

```
The transaction you pasted SUCCEEDED, but the Safe executed a DIFFERENT call than the one requested.
  0x...
  is a Safe execution (execTransaction) on 0x1111...1111, but the Safe executed a DIFFERENT call: CALL to 0x8888...8888, value 0, data 0xa9059cbb; the requested call is CALL to 0x0000...0001, value 500, data 0xdeadbeef
```

The same call made as a DELEGATECALL, or with another value, counts as a different call: it is not the transaction you were asked to execute. For a Safe execution, "carries your calldata" is checked only inside the Safe's inner call, and only where the requested call can actually have run from the Safe: a DELEGATECALL (a MultiSend batch) or a call to the target itself (its own `multicall`). A Safe call to another contract that merely carries the calldata (queueing it in a timelock, say) did not execute it, and is treated as a different call. Being sent to the Safe is no longer enough on its own: it says WHO acted, not WHAT they did, and for a Safe the what is right there in the transaction, so it is decoded and compared. A transaction to the account that is not a Safe execution and does not carry your calldata is asked about for the same reason, rather than refused, because a wallet that executes a transaction submitted earlier by its id looks exactly like that. Governance executed by proposal id (the payload was queued in an earlier transaction) carries no trace of your calldata either, and neither does an unrelated transaction you pasted by mistake. In every case anything but an explicit `yes` defers the transaction exactly as `cannot sign` does, saving nothing.

ACCEPTED RESIDUAL RISK, stated rather than engineered around: only a Safe's `execTransaction` is decoded; every other wallet is judged structurally (does it carry your calldata), and a user who deliberately confirms the wrong transaction is believed. What is no longer possible is recording an unrelated transaction SILENTLY, including another transaction of the same Safe.

## Choosing the behaviour (`onUnknownSigner`)

| value     | what happens when a `from` is unsignable                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `'auto'`  | **the default**: `ask` when the run can ask a human for text, `throw` when it cannot |
| `'ask'`   | pause and ask, when the run can ask a human for text; otherwise behave as `throw`    |
| `'throw'` | raise `UnknownSignerError` immediately, without ever asking                          |

It is resolved as CLI flag / execution parameter > chain config > top-level config > the default `'auto'`.

Set it for a whole chain in `rocketh/config.ts`:

```typescript
export const config = {
	accounts: {/* ... */},
	chains: {
		11155111: {onUnknownSigner: 'ask'},
	},
	data: {},
} as const satisfies UserConfig;
```

Set it once for EVERY chain with the top-level key, so "never prompt me anywhere" does not have to be repeated per chain entry (a `chains[id]` entry still overrides it):

```typescript
export const config = {
	accounts: {/* ... */},
	onUnknownSigner: 'throw',
	data: {},
} as const satisfies UserConfig;
```

or for one run, which wins over both:

```typescript
await loadAndExecuteDeploymentsFromFiles({environment: 'sepolia', onUnknownSigner: 'ask'});
```

or for one INVOCATION from your shell, which is the same run-level lever:

```bash
rocketh -e sepolia --on-unknown-signer throw
pnpm hardhat deploy --network sepolia --on-unknown-signer throw
```

`--skip-prompts` (on both CLIs) forces `throw`, because the interactive resolver IS a prompt. It wins over an explicit `--on-unknown-signer ask`: asking to be prompted and not prompted at once is a contradiction, and not prompting is the safe half.

## On a fork or in the browser: impersonation instead

`@rocketh/web` implements no text prompt today, so a browser run cannot ask you to paste a transaction hash: `'ask'` (and `'auto'`) take the `throw` path there, exactly as in CI. That is a deliberate absence rather than an oversight: asking in a browser means a real UI integration point (a modal, a form, somewhere for the answer to come from), which is a different kind of thing from reading a line of stdin, and nothing forces that decision yet.

It is also not a dead end. On a FORK or a dev node there is a better answer than interactivity anyway: let the account be IMPERSONATED, which resolves it BEFORE the unknown-signer seam so no policy is ever consulted and nothing has to be executed out-of-band.

Rehearsing your Safe-owned steps on a fork of the network you are about to upgrade is the main reason to do this, and it needs no switch: impersonation is ON by default for a fork run. [Rehearsing a deployment on a fork](../fork-runs/) covers how to start one, what it inherits from the network it simulates, and the two chain ids involved.

That rehearsal is also how you get the whole upgrade as a list of transactions in one pass, instead of deferring each privileged call, executing it, and re-running to reach the next one. Impersonation makes every Safe-owned step EXECUTE, and the run keeps what it sent: [Captured transactions](../captured-transactions/) covers reading the list, where a batch has to be split, and what it does and does not promise.

```typescript
// rocketh/config.ts
export const config = {
	accounts: {
		deployer: {default: 0},
		// the Safe / timelock / owner you want the fork to sign for MUST be named here
		safeOwner: {default: '0x1111111111111111111111111111111111111111'},
	},
	data: {},
} as const satisfies UserConfig;
```

```typescript
// in the browser (@rocketh/web), against a fork or dev node
import {setupEnvironment} from '@rocketh/web';

const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, {});
await loadAndExecuteDeploymentsFromModules(modules, {provider, autoImpersonate: true});
```

Three constraints make this work, and none of them is a formality:

- **Naming the addresses is MANDATORY, not merely convenient.** Only NAMED accounts are impersonation candidates. An address that appears nowhere in `accounts` (an unnamed account, or a bare `from` passed to a call) is never impersonated, however capable the node is, and still lands on the unknown-signer seam. Naming is necessary but not on its own sufficient: the candidates are the named accounts the NODE would otherwise have to sign for, so a named account that already resolves to its own signer (a private key, a wallet) signs directly and is never impersonated, which is what you want anyway.
- **It needs a node that implements the impersonation RPC**, meaning a fork or a dev node (anvil, hardhat). Against a real chain the account simply stays unsignable and the run takes the throw-and-defer path, which is the CORRECT outcome: nothing should be able to fake a signature on mainnet.
- **`autoImpersonate` is RUN-level, not per-transaction.** It is set for the whole run (execution parameter or chain config), like every other node capability. There is no per-call impersonation knob; a per-call variant is a separate, out-of-scope idea.

If you enable it against a node that does NOT implement the RPC, the attempt is swallowed (that is what lets the switch be harmless on an ordinary provider), but the unknown-signer error you eventually get SAYS SO: it tells you auto-impersonation was enabled and `hardhat_impersonateAccount` was refused, or that this account was never a candidate at all (it is not one of the named accounts the node would have to sign for). With auto-impersonation off, the error says nothing about it at all.

Note that this is a NODE CAPABILITY and `onUnknownSigner` is a POLICY: they are orthogonal, and there is no `'impersonate'` policy value. Impersonation runs first and, when it works, the policy is never reached.

## What makes the re-run converge

A deferred step did not happen. Whether it was deferred by `throw` in CI or by `cannot sign` at the pause, rocketh did not send it and never saw it land, so it records nothing for it: once the transaction has been executed out of band, the only thing that can tell the next run the work is done is the CHAIN.

That is automatic for some of the steps rocketh guards itself, and it is worth knowing which. `deployViaProxy` compares the proxy's current implementation, read from its EIP-1967 slot, so a re-run after the Safe acted skips the upgrade with nothing declared by you. A DETERMINISTIC `deploy` (create2 or create3) does the same, because it can compute the address it would use and ask the chain whether code is already there. A plain `deploy` cannot: its address depends on the sender's nonce, so it has nothing to ask about and instead compares against the saved deployment RECORD, which a deferred run never wrote. Expect a deferred plain deploy to be offered to you again on the next run. It is NOT automatic for an `execute`, which sends whatever it is handed: without a chain check, the re-run prints the identical privileged transaction and executing it a second time is a real loss for a mint, a transfer, an increment or a governance action carrying its own nonce.

[Guarding execute calls](../execute-guard/) is how you state that check: one `guard` option declaring what to read on chain, so the deferred step is SKIPPED once its effect has landed, and the same transaction is never handed to you twice.

```typescript
await execute(proxyAdmin, {
	account: 'safeOwner',
	functionName: 'upgradeAndCall',
	args: [proxy.address, newImplementation.address, '0x'],
	// run 1 defers this; run 2, after the Safe executed it, reads the proxy's
	// EIP-1967 implementation slot, is satisfied, and skips the step entirely
	guard: {
		kind: 'storage',
		on: proxy,
		slot: EIP1967_IMPLEMENTATION_SLOT,
		as: 'address',
		equals: newImplementation.address,
	},
});
```

The guard is what an unattended re-run needs, since nobody is there to paste a hash, and it also spares a run from a terminal a pause for a call that has already landed.

## When the owner is governance, not a multisig

The transaction rocketh surfaces always names, as `from`, whoever holds the right on chain: the owner of the proxy, of the admin contract, or of the registry the upgrade goes through. When that is a Safe, you execute the transaction on the Safe as written. When it is a CONTRACT that cannot originate a transaction (a governance executor, a timelock), nobody can send it as written, and the printed block, which reads exactly like the Safe case, is not an instruction to follow literally.

What you can rely on is the `{to, data}` pair: it is the call that contract must end up making. Submit it through your governance process. For a governance executor, that pair is the action a proposal (or payload) carries: `to` is the target, `data` is the calldata, and once governance has approved the proposal and any delay has elapsed, the executor makes that exact call. Until then every re-run surfaces the same transaction again; once the call has landed, a re-run of a step rocketh checks on chain (such as `deployViaProxy` reading the proxy's implementation slot) surfaces nothing. The [registry-owned-by-a-governance-executor matrix entry](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-unknown-signer/test/scenarios.integration.test.ts) shows the whole loop: a registry contract as the proxy admin, owned by an executor that acts after a delay, upgraded through the registry's own setter with `upgradeFunction`.

An OpenZeppelin `TimelockController` you control is different, because the call you send is not the surfaced one: an account holding the timelock's proposer role sends `schedule(...)` to the timelock, then `execute(...)` is sent after the delay, each carrying the surfaced `{to, data}`. rocketh does not translate the surfaced transaction into that pair today. The [Timelock-owned admin matrix entry](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-unknown-signer/test/scenarios.integration.test.ts) pins what you get instead. The governance demo's [`004_timelock_owned_admin.ts`](https://github.com/wighawag/rocketh/blob/main/demoes/hardhat-deploy/governance/deploy/004_timelock_owned_admin.ts) shows a workaround, written the way a ported hardhat-deploy v1 script is (it catches the deferral with [`catchUnknownSigner`](#deferring-instead-of-asking-catchunknownsigner)): build the `schedule` / `execute` calls yourself from the deferred `{to, data}`, with a deterministic salt so a re-run finds the same operation again.

rocketh does not build governance proposals. It tells you which call has to happen; turning that into a proposal, a payload or a timelock operation is the governance process's job.

## Deferring is not a "never send" switch {#catchunknownsigner-is-not-a-never-send-switch}

A transaction is deferred when rocketh CANNOT sign for its `from`. No policy makes a signable account unsignable: if the run holds a key for that account, or the node signs for it, or auto-impersonation took it on, the transaction is signable and it BROADCASTS, whatever `onUnknownSigner` says. That is what keeps a mixed run working, where most steps are yours to send and one belongs to a Safe.

So a production run that unexpectedly has the admin key in its environment sends the admin transaction rather than deferring it. If that matters to you, assert it, rather than inferring it from the policy:

```typescript
const admin = env.resolveAccount('admin');
if (env.addressSignability[admin.toLowerCase() as `0x${string}`] !== 'unsignable') {
	throw new Error(`refusing to run: rocketh can sign for ${admin}, which must stay external`);
}
```

`addressSignability` is computed after auto-impersonation runs, keyed by lowercase address, and answers `'local'`, `'node'`, `'impersonated'` or `'unsignable'` (an address never seen during setup answers `'unsignable'` rather than `undefined`, so there is no third case to handle). Rehearsing the whole flow on a fork remains the stronger check, since it proves the transaction works rather than only proving who could have sent it.

For the same reason, no policy, set for the run or for one call, defeats impersonation: to exercise the unknown-signer path on a fork, set `autoImpersonate: false` for the run ([Impersonation is on by default](../fork-runs/#impersonation-is-on-by-default)).

## Overriding the policy for one call (`withUnknownSignerPolicy`)

The policy applies to the whole run. `withUnknownSignerPolicy` overrides it for a single action, typically to REHEARSE the interactive flow on a fork before doing it on mainnet. It is in its own package:

```bash
npm install -D @rocketh/unknown-signer
```

Call it curried, as below, or spread the package into `extensions` in `rocketh/config.ts` like `@rocketh/deploy`, and it arrives on the environment your deploy script is handed:

```typescript
import {withUnknownSignerPolicy} from '@rocketh/unknown-signer';

// this one call pauses and asks, even though the run's policy is 'throw'
const receipt = await withUnknownSignerPolicy(env)('ask', () =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);
```

It takes a function, not a promise, because a promise has already started running by the time it is passed, leaving no moment at which to set the policy. It returns whatever the action returned, and propagates whatever it threw (so under `throw` the deferral still raises `UnknownSignerError`). Precedence is one rule: the innermost override wins, then the run parameter, then the chain config, then the top-level config, then the default `'auto'`.

It accepts the whole policy vocabulary, `'auto'` included, not just `'ask'` and `'throw'`. Per call, `'auto'` means "use this run's capability-aware default for this one action", which is the only way to opt a single call back OUT of a run-level `'throw'` without deciding for it what to do instead.

The override chooses among what the run can do; it cannot exceed it. Asking for `'ask'` where the run cannot ask a human for text still takes the `throw` path and never prompts, so a script that hardcodes the override is still safe in CI.

## `catchUnknownSigner`, for ported hardhat-deploy v1 scripts {#deferring-instead-of-asking-catchunknownsigner}

`@rocketh/unknown-signer` also exports `catchUnknownSigner`, hardhat-deploy v1's wrapper: instead of stopping the run, a deferral is handed back to the script as a value, and the script carries on. It exists so that a v1 script ports with one mechanical change, and it is documented with the migration: [`catchUnknownSigner` in a migrated script](/hardhat-deploy/migration/#catch-unknown-signer).

A new script has no need for it. The pause finishes the job in one run, `throw` with a [guard](#what-makes-the-re-run-converge) converges unattended, and a [fork rehearsal](../fork-runs/) hands you every Safe-owned step as one batch, executed against the real state. The one thing it still does that nothing above does is collect several independent privileged transactions from a single unattended run against the real network, which matters only where a fork rehearsal is not available. And carrying on past a deferral is what makes the one way to lose a step possible: a script that reaches `return true` after a step it deferred ([Running once](../script-lifecycle/#never-return-true-on-a-path-where-a-step-was-deferred)).

## Stability

This surface is frozen for the whole 0.x line: `catchUnknownSigner` and its return value, `withUnknownSignerPolicy`, `UnknownSignerError` and its `data`, the `throw` / `ask` / `auto` policies and where they are set, and the `--on-unknown-signer` and `--skip-prompts` flags are not removed, renamed or given a different meaning before 1.0. Message wording is not part of it, and optional fields may be added. `catchUnknownSigner` stays on that list: it is documented for ported scripts, not withdrawn. The exact list is in [ADR 0016](https://github.com/wighawag/rocketh/blob/main/docs/adr/0016-the-unknown-signer-surface-is-frozen-for-0x.md).
