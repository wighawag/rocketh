---
title: 'Hint when impersonation was attempted but unsupported, and document the browser/fork route'
slug: impersonation-unsupported-hint-and-web-guidance
spec: unknown-signer-interactive
blockedBy: [per-call-ask-override-and-deferral-precedence]
covers: []
---

## What to build

Close the two loose ends the spec's implementation decisions recorded, both about the same silent gap: what a user is told when they cannot sign and cannot prompt.

1. **A hint in the unknown-signer error when auto-impersonation was ON but did not resolve the account.** Auto-impersonation deliberately SWALLOWS an unsupported-RPC failure so the feature degrades gracefully on providers that are not a dev node. The cost is that a user who enables it against a chain that does not support it gets no signal at all, only an unknown-signer error later with nothing saying impersonation was attempted and unsupported. Given the standing invariant that the unwrapped throw is the primary deferral workflow and the error MESSAGE is the deliverable rather than a summary, the error should say so.
2. **Document the browser and fork route.** The browser runtime deliberately has no text-prompt capability, so the interactive policy degrades to throw there. That is correct, but on a FORK or dev node a browser user has a better option than interactivity: declare the unsignable addresses as NAMED accounts and enable auto-impersonation, which resolves them BEFORE the seam so no policy is consulted at all. Without this written down, "the browser cannot use the interactive policy" reads as "the browser is crippled".

## Acceptance criteria

- [ ] When auto-impersonation was ENABLED for the run but the account still reached the seam as unsignable, the unknown-signer error says so, distinguishing "impersonation was attempted and the node does not support it" from "impersonation was never attempted". Tested for both shapes.
- [ ] When auto-impersonation was OFF, the message is unchanged from today. No new noise on the common path. Tested.
- [ ] The hint does NOT change any control flow: impersonation still fails silently and degrades gracefully, the policy is still consulted only inside the `unsignable` branch, and no account's signability classification changes. Re-pin the classification behaviour, since this task reads impersonation state at a new place.
- [ ] Documentation, in the existing "Handling unknown signers" section, states the browser/fork route with its three real constraints, each of which is load-bearing and none of which may be softened:
  - Declaring the addresses as NAMED accounts is MANDATORY, not merely convenient: only named accounts are impersonation candidates, so an unnamed account or a bare `from` on a call is never impersonated even with auto-impersonation on.
  - It works only against a node implementing the impersonation RPC (a fork or dev node). Against a real chain the account stays unsignable and the run lands on the throw and defer path, which is the correct outcome.
  - Auto-impersonation is RUN-level, not per-transaction. Per-call impersonation is a separate, out-of-scope idea; do not imply a per-call knob exists.
- [ ] The documentation also states plainly that the browser runtime has no text-prompt capability by design, so the interactive policy degrades to throw there, and points at the fork route as the alternative rather than leaving it as a bare limitation.
- [ ] Tests live in `packages/rocketh/test/`, building a real environment locally with a mock provider whose impersonation RPC can be made to succeed or fail, since that switch is exactly what this task branches on.
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- `per-call-ask-override-and-deferral-precedence`: this task edits the same environment module and the same documentation section as the whole interactive chain, so the ordering serialises those edits and lets the documentation land as one coherent section rather than four conflicting ones.

## Prompt

> Goal: stop two silences. Tell a user when impersonation was tried and unsupported, and write down the browser/fork route so the browser's lack of an interactive prompt does not read as a dead end.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the interactive chain landed and that the documentation section exists in the shape the earlier tasks left it. If an earlier task already added the impersonation hint, do not duplicate it: route to needs-attention.
>
> Where to look. Auto-impersonation runs during environment setup in `packages/rocketh/src/environment/index.ts`, BEFORE the seam. Read these before designing, and cite them in the done record:
>
> - the impersonation helper, whose catch deliberately swallows an unsupported-RPC failure with a comment explaining it lets the feature work gracefully with non-hardhat/anvil providers. That silence is the thing you are compensating for, NOT something to remove.
> - the candidate selection, which filters the NAMED accounts by "needs impersonation for this run", meaning the signer is remote AND the node does not already list the address. This is why naming an account is mandatory for it to be impersonated at all.
> - the signability classification, which runs AFTER impersonation and is what turns a successfully impersonated account into a signable one, so it never reaches the seam.
>
> The distinction you must preserve. `autoImpersonate` is a NODE CAPABILITY resolved BEFORE the seam; `onUnknownSigner` is the POLICY afterwards. They are orthogonal, and there is no `impersonate` policy value. This distinction drifted through three documents and bounced an entire task set once; ADR 0006 is the durable record and it is enforced structurally plus pinned by tests. You are adding a message that MENTIONS impersonation state, which is exactly the kind of change that could blur the boundary. Do not move the impersonation attempt, do not consult the policy earlier, and do not let the hint's plumbing pull node-capability state into the policy decision. It is a message detail, nothing more.
>
> Resolution order for the message: prefer saying something true and specific over something reassuring. "Auto-impersonation was enabled but this node does not support it" is useful; "could not sign" is what the user already knew.
>
> For the documentation, the three constraints in the acceptance criteria are each verified facts about the code, not stylistic preferences. Check each against the source before writing it down, and if any turns out false, that is a needs-attention signal rather than a licence to soften the wording.
>
> Done means: a user who enabled impersonation against the wrong kind of node is told so, the common path is unchanged and no quieter, and the browser/fork route is written down with its real constraints in the section the rest of this chain built.
