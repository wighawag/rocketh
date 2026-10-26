---
title: 'Record script tags on deployments, and reset by tag'
slug: tag-recording-and-selective-reset
---

# Record script tags on deployments, and reset by tag

PARKED, not planned. The tasked form of this (`work/tasks/cancelled/record-script-tags-and-dependencies-on-deployments.md`, `work/tasks/cancelled/dependency-aware-selective-reset-via-reset-and-tags.md`, from the spec `work/specs/tasked/tag-tracking-selective-reset.md`) was cancelled on 2026-10-26; the reasons are in those files.

The idea: each deployment records the `tags` and `dependencies` of the script that produced it, and `--reset` can then delete only the records a set of tags reaches (forward and reverse dependencies), instead of all of them.

What would have to be true before it is worth reopening:

- A user asks for it with a concrete case that a full `--reset` (dev chain) or deleting specific records by hand (live chain) does not serve.
- A way to find the scripts that READ a deployment without declaring the dependency, or an explicit acceptance that the reset can orphan them. Without one, "no orphaned deployments" cannot be promised.
- A new spelling, not `--reset --tags`, which already means "delete everything, then run these tags".
- The two record fields go through the deployment-record schema ADR like any other addition.
