<!-- dorfl-sidecar: item=spec:agent-skill-for-rocketh-users type=spec slug=agent-skill-for-rocketh-users allAnswered=false -->

Item: [`spec:agent-skill-for-rocketh-users`](../specs/proposed/agent-skill-for-rocketh-users.md)

## Q1

**Which format, and how many? A single SKILL.md loaded on description match, an AGENTS.md fragment a user pastes into their own project, or both — and one skill or several (deploy, upgrade a proxy, verify, export)?**

> Open question 1 in work/specs/proposed/agent-skill-for-rocketh-users.md. A single file is easier to keep true; several match how skills are selected. The two surfaces answer different questions: the skill loads when the agent decides deployment is the task; the fragment is always in context for a project that uses rocketh.

_Suggested default (revised 2026-10-28, see the spec): SKILL.md format and a one-line AGENTS.md pointer are settled by evidence; for the count, two new skills, rocketh-deploy and rocketh-safe-owned-changes, next to the existing hardhat-deploy-migration._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Where is the skill shipped — in the rocketh package (whose 'files' currently publishes only dist and src), in a dedicated package, or only in the repo and the docs site?**

> Open question 2. Shipping in the package puts it where an agent working in a user's project can actually find it; a docs website does not help an agent that never browses. Would require adding a 'files' entry in packages/rocketh/package.json.

_Suggested default (revised 2026-10-28, see the spec): canonical in the repo's skills/, copied into the rocketh package as skills/<name>/ at build, one docs page with install paths. Open: serving raw files on rocketh.dev (yes), a Claude plugin marketplace file (not now), the AGENTS.md pointer in hardhat-deploy init (yes), a pull request to ethskills (yes, as a courtesy)._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

## Q3

**How is the skill kept from going stale — every sample lives in a compiled fixture the skill embeds, a test asserts the samples typecheck, or the samples are generated from the same source as the docs site?**

> Open question 3, flagged in Autonomy notes as the one that decides whether the artifact is worth building at all. Related work: work/... 'editable-deploy-scripts-in-the-docs' has the same underlying need for samples that are known to run, and the spec says the mechanism should be shared rather than duplicated.

_Suggested default (2026-10-28): settled by evidence, the migration skill's fixture mechanism made stricter (every TypeScript block is a marked, compiled and executed fixture), plus link and CLI-flag checks. Answer "agreed" or amend._

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

## Q4

**How far does the skill go on safety — does it merely describe rocketh, or does it also carry operating rules (confirm target network before broadcasting, never invent an address, stop and ask when a transaction is deferred)?**

> Open question 4. An agent driving deployment can spend real money and hand governance actions to a multisig. The spec cautions the rules must be ones the skill can state TRUTHFULLY, not aspirations about agent behaviour (and 'Out of Scope' notes the skill can state a rule but cannot enforce one).

_Suggested default (revised 2026-10-28, see the spec): yes, limited to rules that describe what rocketh does or whose authority a step needs, each tied to its page or code, including the --skip-prompts rule found in the code._

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):
