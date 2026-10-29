---
title: 'The skills fork-check and rehearsal commands skip the confirmation, and say why only on a fork'
slug: skills-fork-check-skips-the-confirmation
spec: agent-skill-for-rocketh-users
blockedBy: []
covers: [4, 6]
---

## What to build

The skills tell the agent to finish a live deployment with a fork re-run (`npx rocketh -e <network> --is-fork --write-transactions <file>`) and to rehearse a Safe-owned change the same way. That command still asks for confirmation (the executor asks whenever `askBeforeProceeding` is set, which is `!skipPrompts` in `packages/rocketh-node/src/cli-options.ts`, fork or not), and an agent's shell has no terminal, so the run stops with the `--skip-prompts` error (`packages/rocketh-node/src/environment/prompt.ts`). The skills' own rule then turns that into a question for the user, which is safe but pointless: a fork run against a node on `127.0.0.1` writes no record back and sends nothing to the live network. `documentation/safe-owned-project/` (step 4) already says that on a fork you answer the prompt or add `--skip-prompts`.

Add `--skip-prompts` to the fork commands, and state the narrow exception once where the run rule lives, so the agent cannot generalise it: the confirmation is the user's for any run that can reach a live network; a run with `--is-fork`, against a fork node the user or agent started on this machine, may skip it, because it writes nothing back. Never drop `--is-fork` from such a command, and never add `--skip-prompts` to a live run without the user's yes.

Places, on `main`:

- `skills/rocketh-deploy/SKILL.md`, "Running and re-running": the one sentence stating the fork exception, next to the rule that the user says yes to the environment and chain.
- `skills/rocketh-deploy/references/hardhat-deploy.md` and `skills/rocketh-deploy/references/rocketh-cli.md`, "The finished check on a fork": add `--skip-prompts` to the `rocketh ... --is-fork --write-transactions` line.
- `skills/rocketh-safe-owned-changes/SKILL.md`, "Rehearsing the change on a fork": the same on the `rocketh -e mainnet --is-fork --write-transactions` line, citing `safe-owned-project/` step 4. Check what `HARDHAT_FORK=<network> npx hardhat deploy` does about the prompt (`packages/hardhat-deploy/src/tasks/deploy.ts`) before writing anything about it; if it already asks nothing, say nothing.

## Acceptance criteria

- [ ] Every `--is-fork` command in the skills that an agent is told to run carries `--skip-prompts`, and no command without `--is-fork` gains it.
- [ ] `rocketh-deploy/SKILL.md` states the exception once, tied to `--is-fork` and to "writes nothing back", linked to the page that says so (`documentation/safe-owned-project/` step 4, or `documentation/fork-runs/` for "a fork does not save"); the guardrail that a live run needs the user's yes is unchanged.
- [ ] The claim that a fork run still asks without `--skip-prompts` is verified against `packages/rocketh/src/executor/index.ts` and `packages/rocketh-node/src/cli-options.ts`, not inferred.
- [ ] The skill harness passes (flags, links and anchors), and `pnpm format:check` passes.
- [ ] No changeset: this touches only `skills/` (and `work/`).

## Blocked by

- None, can start immediately.

## Prompt

Goal: the fork re-run that marks a deployment finished, and the Safe rehearsal, run in an agent's shell without stopping on a confirmation nobody needs, while every live run still waits for the user's yes. Keep the change to the lines named above; do not restructure the skills.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines.

FIRST, check this task against current reality (it may have DRIFTED): if the fork commands already carry `--skip-prompts`, or the executor no longer asks on a fork, route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note.

## Decisions

- **Wording of the Safe skill's added paragraph:** it says the flag "skips nothing that matters" on a fork, because the run writes nothing back and the Safe is impersonated. This follows step 4, which says the same about the unknown-signer policy: `--skip-prompts` also forces `--on-unknown-signer throw`, and that is harmless on a fork. The alternative was to add only the flag with no explanation. I added one paragraph so the agent cannot read it as permission for live runs. It affects only that skill section.
- **Where the flag goes on the line:** I put `--skip-prompts` at the end of each command rather than next to `-e`, so the change is a minimal diff. This is cosmetic and does not change how the commands behave.
