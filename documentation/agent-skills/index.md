# Working with an AI agent

rocketh publishes skills for coding agents: instructions an agent loads when it works in a project that deploys with rocketh or hardhat-deploy v2. They carry the decisions a deployment needs (which network, when to stop, what a deferred step means) and link these pages for the mechanics.

Nothing is installed into your agent environment without your action, because adding instructions to someone's agent is not something rocketh does on their behalf ([ADR 0017](https://github.com/wighawag/rocketh/blob/main/docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md)).

## The skills

| Skill                                                                                          | Used when                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`rocketh-deploy`](https://rocketh.dev/skills/rocketh-deploy/SKILL.md)                         | writing, running or re-running deploy scripts, upgrading a proxy or a diamond, verifying or exporting deployments                                                                              |
| [`rocketh-safe-owned-changes`](https://rocketh.dev/skills/rocketh-safe-owned-changes/SKILL.md) | a step's `from` is an account rocketh cannot sign for (a Safe, a timelock, a hardware wallet), a run paused or threw on an unknown signer, or a privileged change is to be rehearsed on a fork |
| [`hardhat-deploy-migration`](https://rocketh.dev/skills/hardhat-deploy-migration/SKILL.md)     | porting a hardhat-deploy v1 project to v2                                                                                                                                                      |

Where one skill's scope ends, it points the agent to the next one.

## Installing them

Both ways work before a project exists, so you can install the skills and then ask the agent to set the project up.

With an agent that supports skills, run:

```bash
npx skills add wighawag/rocketh
```

This installs them into the current project. Add `-g` to install them for your user, in every project.

With an agent that does not support skills, start the conversation with this line:

```text
Read https://rocketh.dev/skills/rocketh-deploy/SKILL.md and follow it before deploying
```

## Versions

The skills follow the `main` branch of the repository, like this documentation. Each one states the `rocketh` version it was written for (`metadata.rocketh` in its frontmatter), and tells the agent to read the documentation at the tag of the installed version when the project uses an older `rocketh`.

## A line for your project's AGENTS.md

So that an agent opening your project learns the skills exist even when you have not installed them, paste this into the project's `AGENTS.md`. It loads nothing: the agent tells you, and you decide.

A project made with `hardhat-deploy init` already has it: the scaffold writes this text as its `AGENTS.md`.

```md
This project deploys with hardhat-deploy v2 and rocketh. If the rocketh skills are not available to you, tell the user they exist and how to install them (`npx skills add wighawag/rocketh`, or the one-line prompt at https://rocketh.dev/documentation/agent-skills/).

## Project notes

<!-- What no file in this project says: who approves a privileged change (which Safe, which signers), and anything else an agent must not guess. -->
```
