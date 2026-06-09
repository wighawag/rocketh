# The `work/` on-disk contract

This is the shared contract between the **slices** skill (producer) and the **lifecycle** skill (consumer). It is designed to be **conflict-safe for parallel AFK agents**. Every rule below exists to avoid merge conflicts and lost updates.

## Location

`work/` lives **inside the target project repo**, versioned with that repo's code (the same place the `tasks/` convention uses today). Slices reference that repo's code; AFK work happens in clones/worktrees of that repo.

## Layout — two categories: WORK ITEMS (status = folder) + CAPTURE BUCKETS (notes)

```
work/
  # ---- WORK ITEMS: status IS the folder; they FLOW via `git mv` ----
  prd/<slug>.md            # PRDs / design docs to slice (ready to slice)
  slicing/<slug>.md        # TRANSIENT HELD LOCK: a PRD is CURRENTLY being sliced
                           #   (not a resting state) — see note below
  prd-sliced/<slug>.md     # SLICED, resting PRDs — the PRD `done/` analogue; the
                           #   SOURCE OF TRUTH for sliced-ness (see note below)
  backlog/<slug>.md        # sliced, grabbable items — NOT yet claimed
  in-progress/<slug>.md    # claimed (moved here via `git mv` during claim)
  needs-attention/<slug>.md # claimed + attempted but STUCK — bounced back for a human
  done/<slug>.md           # completed (moved here in the work PR)
  out-of-scope/<slug>.md   # durable "won't do" records (lightweight ADR)

  # ---- CAPTURE BUCKETS: NOT status-governed; they do NOT flow/move ----
  ideas/<slug>.md          # proposed, pre-PRD ideas — EDITABLE, deletable
  observations/<slug>.md   # spotted, unverified signals — APPEND-ONLY, deletable
  findings/<slug>.md       # VERIFIED external/domain ground truth — durable
```

### Two governance regimes (this is the key distinction)

- **Work items** (`prd`/`slicing`/`prd-sliced`/`backlog`/`in-progress`/ `needs-attention`/`done`/`out-of-scope`) are the lifecycle: **status = the folder**, transitions are `git mv`, each has one destiny. This is the conflict-safe core. (PRDs flow `prd/ → slicing/ → prd-sliced/` — the build machine minus `done/`; see the `slicing/` note below.)
- **Capture buckets** (`ideas`/`observations`/`findings`) are **NOT work items** and are **exempt from status = folder** — they are _notes_, not units of work. They do not move through statuses; they sit in their bucket, and the folder is the inbox (`ls work/observations/` = the live signal list). They leave only by **deletion** (git history is the archive). A note may _spawn_ work (a slice, an idea, an ADR) created independently — the note does not "become" or `git mv` into that work; it is simply deleted once it is no longer a useful signal.

### The three capture buckets (different by polarity + mutability)

| Bucket | What | Mutability | Leaves by |
| --- | --- | --- | --- |
| `ideas/` | a _proposed_, pre-PRD opportunity ("we might want to build this") | **editable** (refine the proposal in place) | deletion (when built/abandoned) |
| `observations/` | an _observed, unverified_ signal ("I noticed something maybe wrong") | **append-only** (add `## Update` notes; don't rewrite what was seen) | deletion (when no longer a useful signal) |
| `findings/` | _verified external/domain_ ground truth (a reverse-engineered protocol, an external API's real behaviour) | accumulates; durable | rarely — it is reference knowledge |

> **`findings/` is for EXTERNAL/DOMAIN ground truth, NOT internal post-mortems.** A finding is durable knowledge about a _world the software integrates with_ (e.g. a Bluetooth/hardware protocol we reverse-engineered, a third-party API's undocumented behaviour) — it accumulates, it does not "resolve". An _internal_ investigation (why a test flakes, a perf regression) is NOT a finding: it is a transient `observations/` signal that drives a fix slice and/or an ADR. **ADRs — the durable _why_ of OUR technical decisions — live in `docs/adr/`** (format: `ADR-FORMAT.md`, alongside this contract), never in `work/findings/`. So: observation = "spotted, unverified"; finding = "verified external ground truth"; ADR = "what WE decided and why".
>
> **Every finding MUST carry a `source:` (provenance) — how, and how _currently_, the finding came to be believed.** A finding is only as true as the source it was derived from, so the source is what makes it _correctable_: if the source is later shown wrong (or stale), the finding can be revised and you can trace _why_ it was believed. There is deliberately **no separate `confidence:` field** — a bare confidence label is redundant at best and misleading at worst ("doc- verified" sounds authoritative until you learn the doc was last touched ten years ago). The honest signal lives IN a rich `source:` string: state _what_ the source is AND _how current_ it is, specifically enough that a reader can judge its weight themselves. Examples (weakest → strongest, by their own description):
>
> - `"derived from reading packages/rocketh-verifier/src/etherscan.ts @ <commit>"` — weakest: it assumes our code is correct, so the finding inherits any bug in it. (A code-derived finding describes the _external behaviour our code assumes_, NOT our code's internal shape — that is `CONTEXT.md`/`docs/`.)
> - `"Etherscan API docs, retrieved 2026-06-09"` — a dated external authority (the date is what stops it silently going stale).
> - `"captured live API response 2026-06-09, trace in <path>"` — strongest.
> - `"told by maintainer @alice, 2026-06"` / `"inferred from the test asserting it at <path>"` — whatever it actually was; write it plainly.
>
> Put `source:` in the finding's frontmatter (see below) and, when the provenance is non-obvious, expand on it in the body. A finding without a source is an `observations/` signal, not a finding.

**For work items, status is the folder a file lives in — never a frontmatter field.** Claiming / finishing = moving the file between folders with `git mv`. This is what makes concurrent updates safe: two agents moving _different_ files never conflict. (Capture buckets are exempt — see above.)

### The PRD lifecycle: `prd/ → slicing/ → prd-sliced/` (the build machine minus `done/`)

A PRD flows through the SAME folder state machine as a slice, **minus `done/`**: `work/prd/` (ready to slice) → `work/slicing/` (the held LOCK, being sliced) → `work/prd-sliced/` (sliced, resting). The **folder is the source of truth for sliced-ness**, exactly as `work/done/` is for slices (and as `done/` carries no `done:` marker). Re-slicing a reshaped PRD is `work/prd-sliced/ → work/prd/` (reopen-to-ready, mirroring `done/ → backlog/`).

**`slicing/` — the PRD-slicing concurrency lock (a TRANSIENT HELD LOCK).** `work/slicing/<slug>.md` is **not a resting/post-slice state** — it is a _transient held lock_ that serialises _concurrent_ slicers (two CI runs, or human

- CI) so a PRD is never double-sliced. Acquiring the lock races a `git mv work/prd/<slug>.md → work/slicing/<slug>.md` micro-commit to the arbiter via the SAME compare-and-swap the build-claim uses (winner holds the lock; a loser backs off). On a **successful slice** the release transition moves the PRD `work/slicing/ → work/prd-sliced/` (the sliced resting state) in the SAME runner-owned commit that emits the backlog slices. On an **aborted / unclear** slice the lock release instead returns the PRD `work/slicing/ → work/prd/` (re-slice later) or routes it `work/slicing/ → work/needs-attention/`.

* **Sliced-ness is RESIDENCE in `work/prd-sliced/` — the FOLDER, the SOLE signal.** There is no `sliced:` frontmatter marker (it was removed in `remove-sliced-marker-step-b`); the folder is canonical. A PRD in `slicing/` is _being sliced right now_; a PRD in `prd-sliced/` _has been sliced_; a PRD in `prd/` is _to-slice_.
* **`slicing/`-absence-from-`prd/` is the hands-off signal.** While the lock is held the PRD lives at `work/slicing/<slug>.md`, not `work/prd/` — the same folder-as-signal a claimed slice leaving `backlog/` gives. **Edit a PRD after it leaves `slicing/` (in `prd/` or `prd-sliced/`), not while it is in `slicing/`.** (A human on a stale local checkout won't see the `git mv` until they fetch — the protocol guarantees no _silent corruption_, not no _human surprise_.)
* **Release fails loud on a concurrent edit (never a silent stale slice).** If the held PRD body was edited while the lock was held, the release detects it (the held content no longer matches the snapshot the lock took) and FAILS LOUD: the slicing is stale → re-slice from the edited PRD or route it to `needs-attention/`. The release NEVER force-restores over the edit or emits slices cut from a stale snapshot.
* **The human path needs no lock.** A human slicing locally with no agent running has no contention and may slice on `main` directly — the lock is mandatory for the agent, optional for the human (parallel to "the runner never skips verify; the human may").

### `needs-attention/` — the post-claim "stuck" state

An item that was claimed (`in-progress/`) and _attempted_ but could not complete is moved to `work/needs-attention/<slug>.md` instead of `done/`. This is the single home for every "couldn't finish, a human must look" outcome — a failed acceptance gate (red tests), a rebase/merge conflict, a slice the agent found too ambiguous to build, a timeout, or a rejected review. It is the folder-native form of surfacing: there are no labels and no status field (rule 3) — the item simply _moves_, exactly like the done-move.

- **Who moves it:** the runner/human that owns git transitions — NOT the build agent (which does no git). On a stuck job the runner writes the **reason** (and any questions the agent surfaced) into the file body, then `git mv work/in-progress/<slug>.md work/needs-attention/<slug>.md` and commits it like any other transition.
- **Not claimable:** `needs-attention/` items are NOT eligible (a `scan`/runner skips them for claiming) but ARE surfaced (a human/`status` lists them with their reason — this folder IS the "look here" set).
- **Return path:** once the human resolves the cause (clarifies the slice, resolves the conflict, fixes the env), the item is `git mv`'d **back to `backlog/`** to be re-claimed (or work resumes on its branch directly). It must not rot in `needs-attention/`.
- This is a _post-claim_ state. (A separate _pre-claim_ "not ready to be claimed yet" state is intentionally NOT added for now: under-specified items simply should not be written into `backlog/` until they are ready. Revisit only if a genuine intake-triage need appears.)

### Drift is a needs-attention signal (check the doc against reality first)

A PRD and a slice are **launch snapshots** — they capture intent at creation and are deliberately NOT kept in sync (current truth lives in `docs/adr/` + the code in `done/`). So by the time you act on one, it MAY have **drifted**: a dependency landed differently than the doc assumed, an ADR superseded a decision the doc relies on, a sibling slice changed the seam it builds against. (Real example: the `watch` slice predated the ledger-transition seam and still described the old direct-`main` failure-surfacing.)

**Discipline (applies whenever you investigate / slice / claim / build):** before acting, **check the doc against reality** — the code in `done/`, the relevant ADRs, and sibling slices it depends on. If you find a discrepancy that would make you build/slice against a false premise, that is a **needs-attention candidate — do NOT silently proceed on the stale spec.** Route it per the item's kind:

- **A SLICE that contradicts current reality** → route to `needs-attention/` with the discrepancy as the reason (the same mechanism as a red gate), rather than building on a stale assumption. A human reconciles the slice, then returns it to `backlog/`. (Building on a stale slice produces wrong-but-compiling work — the worst outcome.)
- **A PRD that has drifted** (before slicing) → do NOT slice it as-is. Set `needsAnswers: true` on the PRD with the discrepancy in its body (or, if it is a small factual correction you are certain of, fix the PRD first), so the slicer never emits slices from a stale spec. A human reconciles, clears the flag, then it is sliced.

The rule is symmetric: _a discrepancy between a doc and reality is not something to paper over — it is exactly the "a human must look" signal `needs-attention` (slices) / `needsAnswers` (PRDs) exists to carry._ Cheap to honour, and it stops drift from silently propagating into built work.

## Conflict-safety rules (non-negotiable)

1. **One file per item.** Never put two work items in one file. Disjoint files merge trivially.
2. **No shared index / manifest.** Do not maintain a `work/INDEX.md`, `work/list.json`, or any file every item touches — it is a guaranteed conflict point. Derive lists on demand with `ls work/backlog/` / `grep`. (Same reasoning as the existing `tasks/README`: "no hand-maintained index — it just goes stale".)
3. **Status = location, not a field.** See above.
4. **Content-derived slugs, never counters.** Use a URL-safe slug from the title (e.g. "Historical store schema" → `historical-store-schema`). NO monotonic integer IDs — two agents would both grab "next = 43". A short hash or date prefix is fine if disambiguation is needed (`historical-store-schema` or `2026-06-03-historical-store-schema`).
5. **Dependencies by slug, read-only.** `blockedBy: [other-slug]` references other items; an item never writes another item's file. The blocker owns its own status (its folder).
6. **Claim state is the folder + git history, never a frontmatter field.** Who claimed an item and when is recorded authoritatively by the `git mv` into `in-progress/` and its commit (`claim: <slug> (by <who>)`). There is NO `claimed_by` / `claimed_at` frontmatter — it would only duplicate what git already holds and tempt agents to coordinate on a non-authoritative field.

## Slice quality rule — tests must not touch the real environment

A slice that makes code **write to a SHARED / GLOBAL location** — a real home/config dir, a system path, a shared service, or an **external tool's managed store** (e.g. another agent's session directory) — MUST, as an acceptance criterion, have its **tests ISOLATE that location** (point it at a temp/scratch dir via the relevant env var or config knob) **AND assert the real one is UNTOUCHED after the run**. State the _mechanism_, not just the outcome: name the env/config lever and note WHERE the path is resolved (in-process vs in a child), because that determines whether overriding a child's env is enough or the test process's own `process.env` must be set.

This is the generalisation of the git-config isolation tests already do (`GIT_CONFIG_GLOBAL=/dev/null`): the same discipline for ANY shared write target. It exists because a slice that _moves_ a write into a shared location (e.g. “write sessions to the tool's default dir instead of the worktree”) silently turns previously-isolated tests into ones that pollute — and a malformed fixture in a shared store can crash unrelated tools that read it. (Real incident: session-log test fixtures leaked into a real `~/.pi/agent/sessions/` and crashed a dashboard; see that repo's `work/findings/pi-session-contract.md`.) Corollary: a synthetic fixture written into any store an external tool reads MUST be VALID per that tool's contract (capture the contract as a `findings/` doc).

## Field-naming convention

All frontmatter and config field names are **camelCase** (`humanOnly`, `needsAnswers`, `blockedBy`, `sliceAfter`, `allowAgents`) — matching the JSON config and the TypeScript that parses them (1:1 property mapping, no snake↔camel translation layer). No exceptions.

## Frontmatter (YAML)

### Slice frontmatter

```yaml
---
title: Human Readable Title
slug: historical-store-schema
prd: historical-store # slug of the work/prd/<slug>.md this slice derives from. REQUIRED iff `covers` is set; OMIT for a self-contained chore/refactor (covers: []).
humanOnly: true # gate axis 1 (DECIDED): a human must drive this. true | omitted. MOST OMIT IT.
needsAnswers: true # gate axis 2 (DISCOVERED): open questions block autonomous work. true | omitted.
blockedBy: [] # list of slugs that must reach done/ first; [] = startable now
covers: [] # optional: user-story numbers (within `prd`) this slice covers
---
```

### PRD frontmatter

```yaml
---
title: Human Readable Title
slug: historical-store
issue: 123 # optional: the issue this PRD was spawned from (the surviving thread)
humanOnly: true # optional: a human must drive the SLICING of this PRD. true | omitted.
needsAnswers: true # optional: open questions block AUTO-slicing this PRD. true | omitted.
sliceAfter: [] # optional: PRD slugs that must be SLICED first (see below). [] = sliceable now.
# sliced-ness has NO frontmatter marker: it is RESIDENCE in work/prd-sliced/ (the release transition moves the PRD there).
---
```

### Finding frontmatter

A finding (`work/findings/<slug>.md`) is a capture-bucket note (no status flow), but it MUST declare its **provenance** so it stays correctable (see the findings box above):

```yaml
---
title: Human Readable Title
slug: etherscan-verification-api
source: 'derived from packages/rocketh-verifier/src/etherscan.ts @ <commit>' # REQUIRED: what the source is AND how current (a date for external sources). Be specific & honest — there is NO separate confidence field; the source string carries the weight.
---
```

- `source` is **required** — a finding without it is an `observations/` signal, not a finding. State it specifically (a file+commit, a doc URL, a captured trace), so a later "the source was wrong" can revise the finding traceably.
- A **code-derived** finding describes the _external behaviour our code assumes_, never our code's internal architecture (that is `CONTEXT.md` / a `docs/` overview). If you find yourself describing our own package layout, it is not a finding.

### The two autonomy axes: `humanOnly` (decided) × `needsAnswers` (discovered)

The autonomy gate is TWO orthogonal binary fields (both default to omitted = false), present on BOTH slices and PRDs, plus the repo's `allowAgents` policy (see `docs/adr/methodology-and-skills.md` §4, authoritative):

- **`humanOnly: true` — the DECIDED axis.** _Should a human drive this, regardless of how complete the spec is?_ A product/design/security/judgement call, or an `AGENTS.md`-type rule. Driven by a decision (in the PRD conversation, or the slicer's own judgement). On a PRD it means "a human must drive the slicing"; on a slice it means "a human must drive the build".
- **`needsAnswers: true` — the DISCOVERED axis.** _Are there unresolved questions blocking autonomous progress?_ The spec is incomplete; **the open questions live in the body**. Once answered, the flag is cleared and an agent may proceed.
- They are **orthogonal** — four honest states. e.g. `humanOnly:true, needsAnswers:false` = fully specified but a human must own it; `humanOnly:false, needsAnswers:true` = anyone can do it once the questions are answered.
- **Repo policy `allowAgents`** answers the question the _repo_ owns: _may agents claim undeclared items here?_ Per-repo config key (`.agent-runner.json`), resolved like `integration`: \*\*CLI flag (`--allow-agents` / `--no-allow-agents`)
  > per-repo config > global config > built-in default (`false`)\*\*.

**Predicate (same shape at both levels):** an item is **auto-eligible** iff `needsAnswers` is not `true` AND `humanOnly` is not `true` AND `allowAgents` is `true`. A human is never bound by it (a human may slice/build a flagged item — the gate binds the agent, like the runner-vs-human stance on `verify`).

(This supersedes the older single `humanOnly`-only gate, which itself replaced the three-state `afk` field + `allowUnspecifiedGate`.)

### `sliceAfter` — PRD slicing-order (enforced against `work/prd-sliced/`, NOT `done/`)

`sliceAfter: [other-prd]` on a PRD is **distinct from** slice `blockedBy`, and deliberately named differently because it gates a different verb against a different signal:

- **slice `blockedBy`** gates **building** a slice, resolved against `done/`.
- **PRD `sliceAfter`** gates **slicing** a PRD, resolved against `work/prd-sliced/` residence (i.e. the listed PRDs must already be sliced — reside in `work/prd-sliced/` — so this PRD's emitted slices can reference the real slugs of those PRDs' slices in their `blockedBy`). This mirrors `blockedBy` → `done/` exactly: ordering resolves against folder residence, not a frontmatter marker.

It waits on **sliced-ness (`work/prd-sliced/`), not `done/`** on purpose: the reason B waits for A is that B's slices need A's slugs to _exist_, which happens the moment A is sliced — not when A is fully built. Build-ordering between A's and B's actual work is then expressed where it belongs, in B's individual slices' `blockedBy` (against `done/`). Enforced for the auto-slicer (it skips a PRD whose `sliceAfter` PRDs do not yet reside in `work/prd-sliced/`); a human may slice anyway.

### The `prd` link (required _when `covers` is set_)

`prd` names the source document this slice was sliced from — the slug of a `work/prd/<slug>.md` in the same repo. Its load-bearing job is to make `covers` unambiguous: `covers: [4]` means nothing without knowing _which_ PRD's story 4. So the requirement tracks that job:

- **`prd` is REQUIRED iff `covers` is non-empty.** Any slice that points into PRD user stories MUST name the PRD those numbers belong to (a slice spanning multiple PRDs names its primary one in `prd` and references the others in prose).
- **`prd` MAY be omitted for a self-contained slice** — a refactor, chore, build fix, or dependency bump that derives from no PRD and covers no user stories (`covers: []`). Such a slice MUST instead carry a clear, standalone _What to build_ + _Prompt_ (it is its own source of truth). This is **in contract** — not all work is feature work; only _feature_ work flows from a PRD.

(Consequence, by design: a PRD-less chore slice is part of no PRD's completion set — the `issue-to-prd` "PRD complete?" query counts only `prd:<slug>` slices — which is correct, since a chore is not part of any feature's traceability.)

The body uses [slice-template.md](slice-template.md): What to build (end-to-end), Acceptance criteria (checkboxes), Blocked by (prose mirror of frontmatter), and a **Prompt** section — a self-contained instruction block that can be pasted into a fresh agent context (the existing `tasks/` convention), so an AFK agent needs nothing but the file to start.
