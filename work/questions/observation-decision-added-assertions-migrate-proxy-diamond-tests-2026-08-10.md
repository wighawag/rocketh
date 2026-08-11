<!-- dorfl-sidecar: item=observation:decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10 type=observation slug=decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10 allAnswered=false -->

Item: [`observation:decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10`](../notes/observations/decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratify both blocks; do not trim.** Reviewed the actual assertions.

The PROXY block (`packages/rocketh-proxy/test/proxy.integration.test.ts:84-95`) is inside acceptance criterion 3's fence and demonstrably so: under the old fake's single-`contractAddress` receipt the implementation and the proxy genuinely collapsed onto one address, so `expect(implementation.address).not.toBe(proxy.address)` could not have been written before the migration.

The DIAMOND block (`diamond.integration.test.ts:113-131`) is outside the fence, as the note itself says - facets default to `deterministic: true`, so those four addresses were already distinct under the old fake. Ratified anyway, as a deliberate strengthening. Trimming it back would restore a `toBeDefined()`-only case in exactly the file where such a case has already been shown to hide a real defect: the multi-facet example had three differently-named facets deploying to ONE create2 address and stayed green (now fixed, and asserted). The fence is worth enforcing against behaviour changes; enforcing it against added coverage costs more than it protects.
