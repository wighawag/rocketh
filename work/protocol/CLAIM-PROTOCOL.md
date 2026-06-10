# Claim protocol (consumed by the runner — `agent-runner claim`/`do`/`complete`)

This documents how a `work/backlog/<slug>.md` item is **atomically claimed** by one agent (human or AFK) when several may try at once. The **slices** skill does not perform claims — it only emits files in a shape this protocol can consume. The **lifecycle** skill implements the steps here.

## The core idea: claim = an atomic compare-and-swap on `main`

A claim is a tiny, fast commit (just a `git mv backlog/ → in-progress/`) that **races to land on the arbiter's `main` before any real work happens.** Git's ref-update-on-push IS the atomic compare-and-swap: the first push to `main` wins, a concurrent non-fast-forward push is rejected. The loser wasted ~one commit, not real work, and simply picks another item.

**Separate the claim commit from the work commit.** Claim first (cheap, collision-detecting); do the work only after the claim has provably landed.

## The arbiter: one serialization point for updating `main`

The atomicity comes from a **single repo that everyone treats as the integration point** (`origin`), whose ref update on push linearizes claims. It can be EITHER:

- **A remote remote** — e.g. GitHub. Bare by construction; works across machines; everyone (including the human) participates by pushing to it.
- **A local bare remote** — a `--bare` repo in a folder (e.g. `work.git`), reached via `file://`. Works fully offline. **Must be `--bare`** (you cannot work _in_ the arbiter: a non-bare repo with `main` checked out rejects pushes to `main`, and force-enabling that moves `main` under your working tree).

The protocol is **identical** for both — it targets a remote _by name_ (`<arbiter>`), not a hardcoded URL. Switching offline↔online is `git remote set-url <arbiter> <url>` (or adding a second remote); the claim steps do not change.

> **Consequence the human must accept:** you participate like an agent — you reach `main` via push (ff / `pull --rebase` then push), NOT via unsynchronized local commits onto a checked-out `main` that is also the arbiter. The arbiter ref and a working `main` you hand-commit to cannot be the same ref. This is mild, good hygiene, and is what keeps the claim guarantee intact for everyone.

### Offline setup (local bare arbiter), once

```sh
# create the bare arbiter next to (not inside) your working clone
git clone --bare /path/to/project /path/to/project-work.git   # or: git init --bare
# in each working clone, point an `arbiter` remote at it
git remote add arbiter file:///path/to/project-work.git
```

When back online, repoint: `git remote set-url arbiter <github-url>` (or push the bare repo's `main` up). Same protocol throughout.

## The script: `scripts/claim.sh`

These steps are implemented (and verified against real git, including a truly simultaneous two-agent race) by [scripts/claim.sh](scripts/claim.sh) — so a human or agent does not hand-run the dance:

```sh
scripts/claim.sh <slug> [--arbiter <remote>] [--by <who>] [--retries N] [--dry-run]
```

Exit codes: `0` claimed · `2` not claimable (not in backlog, or lost the race) · `3` push kept being rejected (contended — retry later) · `1` usage/env error. It refuses to run on a dirty tree, makes the failed-move and no-op cases fatal (never a false "claimed"), and verifies the arbiter's `main` actually points at your claim after the push. The steps it performs:

## Claim steps

```
CLAIM (fast, collision-detecting):
  1. git fetch <arbiter>
  2. git switch -c claim/<slug> <arbiter>/main        # branch off the latest main
  3. git mv work/backlog/<slug>.md work/in-progress/<slug>.md
  4. git commit -m "claim: <slug> (by <who>)"
     # who/when is recorded by THIS commit, not a frontmatter field (no claimed_by/claimed_at)
  5. git push <arbiter> claim/<slug>:main --force-with-lease    # ATOMIC CAS
        # (a plain ff-only push works too; NEVER --force)
     ├─ ACCEPTED  -> the claim is atomically yours.
     └─ REJECTED (non-fast-forward) -> someone/something moved main:
            git fetch <arbiter>
            is work/backlog/<slug>.md still present on <arbiter>/main?
              NO  -> you lost the race for THIS item:
                     delete claim branch/worktree, pick a DIFFERENT backlog item.
              YES -> main merely advanced (a different item landed):
                     rebase claim/<slug> onto <arbiter>/main and retry push.
                     Cap retries (e.g. 3) then back off, to avoid livelock.

WORK (only after the claim landed):
  6. git switch -c work/<slug> <arbiter>/main      # NEW main, includes your claim
     (use a dedicated worktree/clone for isolation when running AFK / in parallel)
  7. do the work; tests green.
  8a. SUCCESS path — in the same PR/merge:
        git mv work/in-progress/<slug>.md work/done/<slug>.md
      commit it together with the work, using the completed-slice message format
      (see below).
  8b. STUCK path — if it could NOT complete (red gate, rebase/merge conflict,
      slice too ambiguous to build, timeout, rejected review): the runner writes
      the reason (+ any surfaced questions) into the file body and
        git mv work/in-progress/<slug>.md work/needs-attention/<slug>.md
      committing/pushing it like any other transition. A human resolves the cause
      and `git mv`s it back to work/backlog/ to be re-claimed. (The build agent
      never does this move — the runner owns git transitions.)
  9. integrate to <arbiter>/main as normal (PR on GitHub, or ff/rebase push offline).
```

## The prompt handed to the work agent (the `## Prompt` wrapper)

When a human or an autonomous runner dispatches an agent to do the WORK phase, the agent is given a small, constant **wrapper** around the slice's own `## Prompt` section. The wrapper is the same every time except the slug; an autonomous runner emits it deterministically. The slice file is the brief; the wrapper just frames it and draws the line around git.

```
You are completing one work slice in this repo. It has already been claimed for
you and lives at work/in-progress/<slug>.md — read that file fully; it is your
complete brief (What to build, Acceptance criteria, Prompt). Also read its source
PRD (the slice's `prd:` field, at work/prd/<prd>.md) for context.

Implement it to satisfy every Acceptance criterion. TDD where the slice asks for
it; match the repo's house style.

If you NOTICE a problem OUTSIDE this slice's scope (a flaky test, a latent bug, a
suspicious behaviour), do NOT fix it and do NOT expand your scope. Instead drop a
short, dated note in work/observations/<short-slug>.md (one or two sentences is
enough — what you saw and where) so the signal is captured, then carry on with
your slice. (work/observations/ is an append-only capture bucket; anyone, you
included, may add to it. Writing such a NOTE is the one exception to the "no file
changes outside your slice" rule below — it is a note, not work.)

If the SLICE ITSELF is the problem — it is ambiguous, under-specified, rests on a
premise that no longer matches the code/ADRs (it has DRIFTED), or hides an
unresolved design decision — do NOT guess and build on it. STOP and report
specifically what is unclear or contradicted (and where), so a human can resolve it
(the runner routes the item to needs-attention). Do not be shy about this: a
confident build on a wrong/ambiguous premise produces wrong-but-compiling work that
is far more expensive than a question. Building exactly what a flawed slice says is
NOT success.

To STOP, make NO source change and end your final report with this EXACT
machine-readable block (the runner detects it, routes the item to
needs-attention with your reason VERBATIM, and SKIPS the gate + review — so put
the specific drift report INSIDE it):

=== SLICE-STOP ===
<the specific reason: which premises are false, where, and a suggested re-scope>
=== END SLICE-STOP ===

The decision bar between "resolve and proceed" and "STOP" / "record a decision":
A genuinely small, certain, SELF-CONTAINED factual gap you can resolve from the
code itself (it affects nothing outside this slice), resolve and proceed silently.
But a choice that touches ANOTHER command/flag/slice, introduces a new
ERROR/REFUSAL, or sets a USER-VISIBLE DEFAULT is a DESIGN decision, NOT a small
factual gap — do NOT bury it in code. If it is load-bearing AND hard to reverse,
STOP (above). Otherwise PROCEED but RECORD it: end your report with a "## Decisions"
block, one entry per decision — what you chose + why + the alternative(s) you
considered + what it touches (which other flag/command/slice). This does NOT stop
the build; it makes the choice visible so the reviewer + the human can ratify or
reverse it. The bar is "would another slice / a user / a reviewer be surprised this
was decided here?" — if yes, record it. A real ambiguity or stale premise, STOP.

COHERENCE CHECK (before you introduce a new concept). Consistency and coherence
with the system's existing LANGUAGE is a first-class quality. Before you add a new
flag / config key / status / verb / named concept, check it against the project's
`CONTEXT.md` glossary + the ADRs + the existing code: (1) does the name already
MEAN something — are you silently re-meaning it or making it mean two things? (2)
is the concept at the RIGHT LAYER (e.g. a policy gate on the autonomous-selection
step vs the explicit verb a human typed)? (3) does it DUPLICATE/overlap an existing
concept you should reuse or rename instead of forking? If a new concept conflicts
with, re-means, or duplicates an existing one — or sits at the wrong layer — that is
NOT a "small factual gap": STOP if it is load-bearing/hard-to-reverse, else RECORD
it in `## Decisions` (what concept, what it overlaps, why your placement). This is
the prevention half of the review's conceptual-coherence lens — a muddled concept
that compiles is far more expensive than the question, because every later artifact
that reuses the muddled term inherits the debt.

Do NOT perform any git operations on THIS repo — do not stage, commit, push, or
move any files between work/ folders, and do not touch work/in-progress/<slug>.md.
The runner (or human) owns every git-state transition. (Your TESTS may freely
create and operate on their OWN throwaway git repos — that is expected.)

Leave a CLEAN working tree — only the changes this slice intends. The runner
commits everything untracked (`git add -A`), so any scratch, debug, or
runtime-artifact file you or your tools created would otherwise be swept into the
commit. Before you stop, delete such stray untracked files, or add them to
.gitignore if they legitimately belong ignored. This is NOT git work: deleting an
untracked file or editing .gitignore is producing clean WORK, like writing source
— the "no git" rule above (no stage/commit/push/move) still holds.

When the acceptance criteria are met and the repo's build/test/format checks are
green, STOP and report what you did. The runner handles the `git mv` to
work/done/, the completion commit, and integration.
```

Why the "no git" line is **in-band** in the prompt (not delegated to a host config like a global `AGENTS.md`): a portable runner cannot assume the target machine has any such rule, so the boundary travels with the prompt. This keeps the acceptance-test gate authoritative (the agent can't commit/merge around it) and the runner the single owner of git state.

## Completed-slice commit message

The commit that completes a slice (the work + the `git mv` to `work/done/`) uses a consistent, greppable format so the lifecycle is visible in `git log` and an autonomous runner can author it deterministically:

```
<type>(<slug>): <slice title or short summary>; done
```

- `<type>` follows conventional-commits (`feat`, `fix`, `docs`, `chore`, …); use `feat` for a slice that adds behaviour.
- `<slug>` is the slice slug (its `work/done/<slug>.md` basename).
- the trailing **`; done`** marks the backlog→done transition landing in this commit (mirrors the `claim: <slug>` message that marks backlog→in-progress).

Example: `feat(scan): cross-repo eligible-work queue (read-only); done`

Keep it ONE commit (work + the `git mv`) so a slice's completion is a single, atomic, revertable unit — just as the claim is a single commit.

## Why this prevents (not merely detects) double-claims

The rejected push is the rejection of the claim. Because the arbiter serializes ref updates on `main`, only one `claim/<slug>:main` can be the fast-forward winner; all others are rejected atomically by `git receive-pack`'s ref lock. No lock server, no integrator process. `--force-with-lease` is a CAS against the expected old value (safe); `--force` would clobber and MUST NOT be used.

## Isolation for parallel AFK agents

Run each agent's work in its **own clone or worktree** so on-disk code changes can't collide; conflicts then only surface at integration time (normal PR-style resolution), never as corrupted shared state. Clones-of-an-arbiter give fully independent object stores (best isolation); worktrees share one object store (save disk) — either is fine, but prefer separate clones when many agents run at once.
