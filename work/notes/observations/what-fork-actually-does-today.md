---
needsAnswers: true
---

# What `fork` actually does today, and what a dry run would need

Investigation prompted by the proposal to use a fork to discover pending privileged work (`work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md`). Every claim below is from the code, with the location, because the proposal rests on this and "fork support exists" turns out to be generous.

## 1. `fork` does not mean "fork". It means "the environment was not given as a string".

`getEnvironmentName` (`packages/rocketh/src/executor/index.ts`) ends with:

```ts
const fork = typeof environmentProvided !== 'string';
```

`environmentProvided` is `executionParams.environment`, which is optional. So a run with NO environment (the default in-memory run, which falls back to the name `memory`) gets `fork: true`.

Benign today: for a memory run, skipping the chain-identity check is harmless and 31337 is the right chain config anyway. But it means `env.network.fork` cannot be read as "this is a fork of a real network", and that is exactly the predicate a dry-run mode would want to branch on. Anything built on today's flag would be building on "not a named network".

## 2. The forked network's chain config is not used, and HALF of that is deliberate and load-bearing.

```ts
// TODO fork chainId resolution option to keep the network being used
const idToFetch = fork ? 31337 : chainId;
```

An earlier draft of this note called this a straightforward bug. It is not, and the correction matters for how it should be fixed.

`actualChainConfig` is what supplies the **provider**: `new JSONRPCHTTPProvider(actualChainConfig.rpcUrl)` (`packages/rocketh/src/executor/index.ts`). So for a fork, sending `idToFetch` to 31337 is exactly right, because it is what makes the run connect to the LOCAL fork node instead of to real mainnet. Swapping it to the forked network's id would point a fork run at production. This line is load-bearing, not a placeholder.

What is genuinely wrong is that the SAME lookup also supplies everything else: `deterministicDeployment`, `onUnknownSigner`, `autoImpersonate`, `confirmationsRequired`, `autoMine` and the environment tags. Those should come from the network being simulated, not from the local node.

So the fix is a **split, not a swap**: connection from the local side, deployment semantics and policy from the forked network. Stating the TODO that way is more useful than "resolve chain config from the forked network", which would break the thing that currently works.

## 2b. The chainId consistency check may or may not tolerate a fork

Related, and worth checking before building `--fork`. The chain id for a named environment comes from `config.environments[environmentName].chain`, is compared against the provider's `eth_chainId`, and a mismatch THROWS (`packages/rocketh/src/executor/index.ts`, the `provider give a different chainId` message).

For a fork the environment name is the forked network's, so the expected id is mainnet's, and whether the provider agrees depends on the tool: anvil preserves the forked chain's id by default, hardhat's simulated network reports 31337 unless configured. So this plausibly passes for one and throws for the other. Verify against both before exposing a flag; do not take this paragraph as the answer.

## 3. Core would save a fork run into the real network's folder. The only caller that can fork suppresses it.

First, what is CORRECT and must not change: a fork run should READ the forked network's deployments. That is the point of forking mainnet, and it is what `context.fork` already enables by skipping the chainId/genesisHash identity check at load time (a fork reports 31337 while the folder belongs to mainnet). Reading is right. Only saving is wrong.

Core's default is unsafe. `saveDeployments` resolves (`packages/rocketh/src/executor/index.ts`) to `false` only for the names `memory`, `hardhat` and `default`; everything else defaults to `true`. A fork of mainnet has `environmentName === 'mainnet'` (`getEnvironmentName` returns the FORKED network's name), so the default is **true**, and `context.fork` is consulted on no write path.

But the hazard is not live today, and an earlier draft of this note said it was. The one caller that can currently produce a fork guards it in the caller: `packages/hardhat-deploy/src/helpers.ts:130` passes

```ts
saveDeployments: isFork ? false : undefined;
```

So nothing is corrupting anything right now. What this is, precisely, is a **trap laid for the new `--fork` path**: a CLI that constructs `{fork: ...}` and forgets the second argument gets production-record corruption with no warning, and the knowledge that the two must be paired lives in one plugin rather than in the thing being configured.

The fix should therefore move the rule INTO core (a fork implies `saveDeployments: false` unless explicitly overridden) rather than replicate the pairing in a second caller. That is the same reasoning that replaced `pushUnknownSignerPolicy`/`popUnknownSignerPolicy` with a single scoping verb: make the mistake unrepresentable instead of documenting the pairing. If a fork run should ever save, it must be to somewhere other than the forked network's folder, which is a separate decision nobody needs yet.

## 4. `autoImpersonate` has no fork-aware default.

It resolves as params > chain config > undefined, so it is OFF unless someone sets it. Impersonation is what makes the Safe-owned steps execute on a fork, so a dry run needs it ON. Combined with (2), a user who sets it on their `mainnet` chain config would NOT get it, because the run reads 31337's config.

## 5. Nothing captures transactions, and there is no `--fork`. These are not equally urgent.

No mechanism records the transactions sent on behalf of accounts that are unsignable on the real network, which is the actual output a discovery pass exists to produce. That gap affects everyone.

The CLI (`packages/rocketh-node/src/cli.ts`) has no fork option, and the only code constructing `{fork: ...}` is `packages/hardhat-deploy/src/helpers.ts` from `HARDHAT_FORK`. But that gap affects only ONE audience: a hardhat-deploy user already has a fork through hardhat's own network config and needs no rocketh-level flag. `--fork` is for rocketh users who are not on hardhat, so it is audience expansion rather than a prerequisite for the feature.

## What that adds up to

Fork support is a load-time concession (skip the chain identity check, use the local chain id) rather than a simulation mode. Getting to a usable dry run needs, roughly in dependency order:

Affecting BOTH audiences, since all of it is core-level:

1. Distinguish "fork of network X" from "not a named network", so the flag means what a dry run needs it to mean.
2. Resolve chain config from the forked network, not 31337 (the existing TODO).
3. Default `autoImpersonate` on for a fork, or make the dry-run mode imply it.
4. Capture transactions from accounts unsignable on the real network.

Affecting only rocketh users who are not on hardhat:

5. Move "a fork does not save" from the hardhat-deploy caller into core, keeping the read path exactly as it is. Not a live bug; the trap the standalone path would spring.
6. A `--fork` option in the rocketh CLI. It needs NO ARGUMENT. `-e, --environment <value>` is already a required option naming the environment, and the connection URL already comes from the 31337 chain config (see 2), so `-e mainnet --fork` carries everything needed and nothing conflicts. It maps onto the existing shape directly: `environment: options.fork ? {fork: options.environment} : options.environment`.

Only (4) and (6) are new; everything else is correcting something that already exists.

Note that (1), (2), (3) and (5) are all the same shape of problem: a fact about the run ("this is a fork of mainnet") that core half-knows, with the consequences of knowing it distributed into callers or simply not drawn. Fixing (1) properly probably makes the other three fall out, since each is an answer to "what should default differently when this is a real fork". That suggests they are one piece of work rather than four.
