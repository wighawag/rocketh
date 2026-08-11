<!-- dorfl-sidecar: item=observation:any-casts-in-deploy-proxy-diamond type=observation slug=any-casts-in-deploy-proxy-diamond allAnswered=false -->

Item: [`observation:any-casts-in-deploy-proxy-diamond`](../notes/observations/any-casts-in-deploy-proxy-diamond.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Keep (resolve, note stays).** Verified still live and still accurate, so it remains a useful standing map of where the "no `any`" rule is broken: `packages/rocketh-deploy/src/index.ts:333` (`encodeDeployData(argsToUse as any) // TODO any`), `packages/rocketh-proxy/src/index.ts:347,352,359,364,371,376,475`, `packages/rocketh-diamond/src/index.ts:207,441`. Not promoting to a task now: the fix is a viem/abitype generics exercise with no user-visible payoff, and the note is worth more as the map than as a scheduled chore.

