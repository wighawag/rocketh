---
title: Support a user-provided base Diamond artifact
slug: custom-diamond-base-artifact
---

# Idea: let a caller replace the bundled base Diamond

Status: incubating.

## What exists today

`@rocketh/diamond` always deploys ITS OWN bundled `Diamond` artifact (`packages/rocketh-diamond/src/hardhat-deploy-v1-artifacts/Diamond.ts`, compiled from `solc_0.8/diamond/Diamond.sol` with solc 0.8.10) as the proxy/base of every diamond.

Until 2026-08-17, `DiamondDeploymentConstruction` also carried an optional `artifact?: Artifact` and the deploy path had a commented-out `if (options.diamondContract)`. The artifact was accepted by the type and then IGNORED: the deploy call overrides it with the bundled one. A caller could therefore believe they had swapped in an independently audited base while the bundled implementation was what landed on chain. Both the field and the dead comment were removed rather than left promising something that never happened.

## What the feature would need

- accept an artifact for the base diamond and actually deploy it;
- keep the ABI merge working (the base ABI is merged with every facet ABI at the top of `index.ts`);
- decide what happens to the DEFAULT facets and the ERC-165 advertisement when the base is not the bundled one, since a custom base may already embed a cut/loupe/ownership implementation;
- state which constructor shape a custom base must have, which is the point below.

## `diamondContractArgs` is DEAD without this

`diamondContractArgs` supports the placeholders `{owner}`, `{facetCuts}`, `{initializations}`, `{erc165}`, `{init}`, `{initAddress}`, `{initData}`. The bundled diamond's constructor is fixed at:

```
constructor(address _contractOwner, IDiamondCut.FacetCut[] _diamondCut, Diamond.Initialization[] _initializations)
```

so the ONLY template that encodes successfully against it is the default `['{owner}', '{facetCuts}', '{initializations}']`. Every other placeholder describes a DIFFERENT constructor shape (a single init pair, a raw address plus calldata), which no supported base diamond has. Verified by test: `['{owner}', '{facetCuts}']` fails in viem's constructor encoder with `AbiEncodingLengthMismatchError` ("Expected length (params): 3, Given length (values): 2"), and `['{owner}', '{facetCuts}', '{init}']` fails with "not a valid array" because the third parameter is a tuple ARRAY.

So `{erc165}`, `{init}`, `{initAddress}`, `{initData}` are unreachable code today. They become meaningful exactly when a custom base artifact is supported, and are the reason the option exists at all. Two consequences:

- do NOT delete those branches as dead code without deleting `diamondContractArgs` with them; they are the half of the feature that already landed;
- when this idea is built, `diamondContractArgs` should be VALIDATED against the base artifact's constructor and fail with a message naming the mismatch, rather than falling through to viem's encoder error.

## Provenance

A third-party security review (RCK-007) flagged the ignored `artifact?` field. Confirmed by reading `index.ts` (the bundled `artifactDiamond` is passed unconditionally to `_deploy`) and by the constructor-encoding failures above.
