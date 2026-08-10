---
title: Two pending changesets will contradict the createMockEnvironment removal in one published CHANGELOG
slug: changesets-contradict-on-test-utils-changelog-2026-08-10
date: 2026-08-10
---

# The next `@rocketh/test-utils` CHANGELOG will contradict itself

`remove-legacy-mock-environment` (PR #76) landed `'@rocketh/test-utils': minor` with

> **Breaking:** remove the legacy `createMockEnvironment` …

But two OTHER unreleased changesets that also bump `@rocketh/test-utils` still describe that export as live. All three fold into the SAME published version, so a consumer reading one CHANGELOG entry sees a direct self-contradiction — on exactly the break the removal task exists to communicate.

## The two clauses to trim

- `.changeset/test-env-harness.md` (`'@rocketh/test-utils': minor`) — final sentence: "The legacy `createMockEnvironment` is unchanged and still exported."
- `.changeset/unknown-signer-contract-enrichment.md` (`'@rocketh/test-utils': patch`) — the sentence describing the legacy `createMockEnvironment` as mirroring the widened `broadcastExecution` signature.

Trimming just those clauses is enough; the rest of both entries stays accurate.

## Two changesets that look guilty but are NOT

`.changeset/migrate-deploy-and-read-tests.md` and `.changeset/migrate-proxy-diamond-tests.md` both mention `createMockEnvironment` (one says it "is untouched and still used by the proxy and diamond suites"), but both have **EMPTY frontmatter** — they bump nothing, so they generate no CHANGELOG entry and their prose never reaches a consumer. Leave them alone.

This distinction matters because the Gate-2 review on PR #76 flagged the two empty ones and MISSED `unknown-signer-contract-enrichment`, which is the one that actually publishes. Enumerate the frontmatter, do not grep for the symbol.

## Why "do not rewrite history" does not apply here

The builder's stated reason for leaving all of them untouched was that rewriting a record corrupts it — the right instinct for `work/tasks/done/` and launch-snapshot specs, but changesets are **unpublished drafts** consumed and deleted at release. Nothing has shipped, so trimming a now-false clause misdescribes no released version. Once the release runs, the contradiction is permanent in `CHANGELOG.md` and can only be fixed by an erratum.

## Why this is easy to miss

`.github/workflows/release.yml` assembles this automatically and GitHub Actions are currently disabled, so whoever re-enables them or releases by hand is the last line of defence. The fix must happen BEFORE `changeset version` runs.
