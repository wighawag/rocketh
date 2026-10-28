# Baseline prompts for `rocketh-safe-owned-changes`

One realistic task per branch of `skills/rocketh-safe-owned-changes/SKILL.md`, as a user would give it to an agent working in a rocketh or hardhat-deploy v2 project whose privileged account is a Safe. The maintainer runs each against a stock agent (without the skill) to find the lines the agent already gets right and can be pruned; running them is not part of the test suite.

| file                            | branch                                                   |
| ------------------------------- | -------------------------------------------------------- |
| `01-write-a-safe-owned-step.md` | writing a step whose `from` is unsignable                |
| `02-the-run-paused.md`          | the run paused at `Unknown signer for account`           |
| `03-ci-threw.md`                | the run threw `UnknownSignerError`, then finishing it    |
| `04-governance-owner.md`        | the owner is a `TimelockController` (the reference file) |
| `05-rehearse-on-a-fork.md`      | rehearsing the privileged change on a fork               |
| `06-ported-script.md`           | a ported script that calls `catchUnknownSigner`          |
