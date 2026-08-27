<!-- dorfl-sidecar: item=observation:what-fork-actually-does-today type=observation slug=what-fork-actually-does-today allAnswered=true -->

Item: [`observation:what-fork-actually-does-today`](../notes/observations/what-fork-actually-does-today.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Promote**, to a SPEC in `work/specs/proposed/`, `humanOnly: true`. Not a task: this changes what a core flag MEANS plus the defaults derived from it, which is a coherent multi-change effort with user-visible consequences rather than one unit of work. `humanOnly` for the same reason `execute-state-guard` carries it (it settles public core semantics we then keep), and because it keeps the auto-tasker off it until the empirical question at the bottom of this answer is answered.

**Scope: the three corrections Track A asks for**, per the recorded plan in `work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md`. All three were re-verified against the code today, unchanged and at the lines the note cites:

1. **`fork` must mean "a fork of network X", not "the environment was not given as a string".** `packages/rocketh/src/executor/index.ts:181` is still `const fork = typeof environmentProvided !== 'string'`, and `environment` is optional, so a plain in-memory run is flagged as a fork today. Nothing downstream can branch on "this is really a fork" until that is fixed, which is why it comes first.
2. **Resolve the `idToFetch` TODO as a SPLIT, never a swap** (`:192-193`). The connection must keep coming from the local 31337 config: `actualChainConfig` is what supplies the provider, so sending it to 31337 is exactly what points a fork run at the fork instead of at production. Only the deployment semantics and policy should come from the forked network (`deterministicDeployment`, `onUnknownSigner`, `autoImpersonate`, `confirmationsRequired`, `autoMine`, and the environment tags). A spec that says "resolve the chain config from the forked network" would break the thing that currently works.
3. **A fork-aware `autoImpersonate` default.** It resolves params > chain config > undefined (`:255-257`), so it is OFF unless someone sets it, and impersonation is what makes Safe-owned steps execute on a fork at all. Note the interaction with (2): a user who sets it on their `mainnet` chain config does not get it today, because the run reads 31337's config.

These are one spec rather than three because they are the same question asked three times ("what should default differently when this is a real fork"), and fixing (1) is what makes the other two expressible at all.

**Explicit NON-goals, so nobody helpfully does them anyway.** Moving "a fork does not save" from the hardhat-deploy caller into core is the same shape of problem and is deliberately Track B: it is not a live bug (`packages/hardhat-deploy/src/helpers.ts:130` still guards it in the caller with `saveDeployments: isFork ? false : undefined`, verified today) and it only bites the standalone `--fork` path, which does not exist yet. Transaction capture (Track A item 3) and the `--fork` CLI flag (Track B item 5, verified absent: the CLI contains no occurrence of "fork") are separate specs ordered after this one.

**The one thing the spec must settle EMPIRICALLY before it can be tasked.** The chainId consistency check compares `config.environments[<name>].chain` against the provider's `eth_chainId` and throws on a mismatch. For a fork the environment name is the FORKED network's, so the expected id is mainnet's, while anvil preserves the forked chain's id by default and hardhat's simulated network reports 31337 unless configured. So this plausibly passes for one and throws for the other, and the note deliberately refuses to assert which. That is a spike against both nodes, not a paragraph, and its answer decides whether changing the flag's meaning is sufficient on its own or whether the check needs a fork-aware branch too. Until it is run, the spec carries `needsAnswers: true`.

**Keep the note on record.** Every claim in it is cited to a file and a line, all five re-verified unchanged today, and it is the only written account of what fork support actually is (a load-time concession, not a simulation mode). The spec should reference it rather than restate it.
