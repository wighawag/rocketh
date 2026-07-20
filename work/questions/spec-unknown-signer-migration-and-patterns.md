<!-- dorfl-sidecar: item=spec:unknown-signer-migration-and-patterns type=spec slug=unknown-signer-migration-and-patterns allAnswered=false -->

Item: [`spec:unknown-signer-migration-and-patterns`](../specs/ready/unknown-signer-migration-and-patterns.md)

## Q1

**Governance shape: for each target team's upgrades, is the proxy owned directly by a Safe, by a ProxyAdmin owned by a Safe, or does a Timelock sit between Safe and ProxyAdmin (Safe → Timelock → ProxyAdmin → proxy)?**

> Pre-existing open question #1 in the spec body. Determines WHO the deferred tx is addressed to (raw upgrade vs Timelock.schedule/execute). Not derivable from rocketh or hardhat-deploy-v1 codebases — needs external-team specifics (Aave V3; Marcelo cohort: Odyssey / Metronome / Vesper). See work/specs/ready/unknown-signer-migration-and-patterns.md open-questions block.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Proxy type per team: Transparent-via-ProxyAdmin, UUPS, or EIP173/other?**

> Pre-existing open question #2. Determines the exact upgrade call caught (upgrade/upgradeAndCall on admin vs upgradeTo(AndCall) on proxy). See spec open-questions block.

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

## Q3

**Batching expectation: do these teams execute multiple upgrades as one Safe MultiSend tx, or one Safe tx per upgrade?**

> Pre-existing open question #3. Affects validation-test matrix here; the MultiSend EMITTER itself lives in explore-unknown-signer-adapters. See spec open-questions block.

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

## Q4

**Post-upgrade init/migration ordering: are there init/migration calls that must be in the same batch as the upgrade, with ordering constraints between them?**

> Pre-existing open question #4. Needed to shape idempotency + multi-step test cases (Testing Decisions #2, #4, #5). See spec open-questions block.

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):

## Q5

**Reference scripts: can you provide links or snapshots of the actual Aave V3 / Marcelo deploy scripts (or the minimal facts from Q1–Q4) so validation tests reflect real patterns rather than plausible ones?**

> Pre-existing open question #5. Validation here means testing against the PATTERNS these teams use (run directly by us), not their participation. Without this the test matrix in Testing Decisions is speculative. See spec open-questions block.

<!-- q5 fields: id=q5 -->

**Your answer** (write below this line):

## Q6

**Timelock support scope: given the spec commits to Timelock-in-path support as a 'logical requirement even absent team specifics', should this be implemented / tested even if the answers to Q1 reveal NO current target team uses a Timelock, or gated on at least one team confirming it?**

> Solution section commits to Timelock-in-path support unconditionally, but Testing Decisions #7 and the exact Timelock-op shape are gated on open-question answers. Ambiguity: is Timelock support in-scope for this spec regardless, or contingent on Q1? Affects tasking scope and whether Testing #7 blocks tasking.

_Suggested default: In scope regardless (implement + test with a generic OZ-style TimelockController), so the seam is proven; adjust exact op shape once a team confirms specifics._

<!-- q6 fields: id=q6 -->

**Your answer** (write below this line):
