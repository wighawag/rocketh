---
title: Access deployments from companion networks
slug: companion-network-deployment-access
---

## Idea

Provide a way to **access deployments from "companion" networks** — i.e. from within a run targeting one network, read deployments recorded for a different, related network.

Exploratory / underspecified: the use case, the API shape, and what "companion" formally means are all open. Captured as an idea (not a backlog slice or a `needsAnswers` slice) until the need is firmed up into a concrete scenario.

## Provenance

Migrated from `TODO.md`: "ability to access deployment from \"companion\" networks ?" (note the trailing question mark in the original — it was a tentative wish).

## Open directions (to firm up before this becomes work)

- What concrete scenario needs it? (e.g. an L2 deploy script needing the L1 contract address.)
- What API would a deploy script use to reach a companion network's deployments?
- How are companion relationships declared in config?
