# When the owner is governance, not a multisig

The printed transaction always names, as `from`, whoever holds the right on chain. When that is a contract that cannot originate a transaction (a governance executor, a timelock), the block reads exactly like the Safe case and nobody can send it as written ([When the owner is governance, not a multisig](https://rocketh.dev/documentation/unknown-signers/#when-the-owner-is-governance-not-a-multisig)).

What carries over is the `{to, data}` pair: it is the call that contract must end up making.

- **A governance executor**: `{to, data}` is a proposal's action (or a payload's), `to` the target and `data` the calldata. Give the user that pair verbatim as the action to propose; submitting, voting and executing are the governance process's job, and rocketh builds no proposal.
- **A `TimelockController`**: an account holding the proposer role sends `schedule(...)` to the timelock, and after the delay `execute(...)` is sent, each carrying the surfaced target, value and calldata. Both are sent outside rocketh, by the account that holds the role; rocketh does not translate the surfaced transaction into that pair. The salt, the predecessor and the delay are the governance's decisions: ask the user for them rather than choosing them.
- **The guard still reads the final effect**, not the proposal or the timelock operation. Until the governed call has landed, every re-run surfaces the same `{to, data}`; once it has, the guarded step is skipped and the run completes.

Report the deployment as unfinished until the governed call has executed on chain, which can be days after the run that surfaced it. The completion criterion is the one in `SKILL.md`: a fork re-run of the same scripts sends nothing.
