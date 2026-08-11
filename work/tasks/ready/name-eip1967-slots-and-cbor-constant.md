---
promotedFrom: observation:magic-storage-slots-and-cbor-constants
---

## What to build

Replace bare hex/magic-number literals with named, documented constants in two files, citing the relevant EIP where applicable. Purely a readability change — no behavioural difference.

### 1. `packages/rocketh-proxy/src/index.ts`

At (approximately) lines 444 and 467 there are two bare 32-byte hex literals used as `eth_getStorageAt` slots:

- `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` — EIP-1967 **implementation** slot (`bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`).
- `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103` — EIP-1967 **admin** slot (`bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)`).

Extract them to module-top named constants, e.g.:

```ts
// EIP-1967: Standard Proxy Storage Slots
// See https://eips.ethereum.org/EIPS/eip-1967
// bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;
// bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
const EIP1967_ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103' as const;
```

and reference those at the two call sites. Names are illustrative — match the file's existing style.

### 2. `packages/rocketh-deploy/src/index.ts`

There is a CBOR length-handling magic number used when stripping/parsing the Solidity metadata trailer. Locate it, extract it to a named constant with a short comment explaining what it is (the CBOR length suffix is the last 2 bytes of the deployed bytecode encoding the length of the CBOR-encoded metadata block), and reference the constant at the use site.

### Acceptance

- No bare `0x360894…` / `0xb53127…` literals remain in `packages/rocketh-proxy/src/index.ts`; both call sites use the named constants; a comment near the constants cites EIP-1967 with the derivation formula.
- The CBOR magic number in `packages/rocketh-deploy/src/index.ts` is a named constant with an explanatory comment; call site uses the constant.
- `pnpm typecheck` and `pnpm test` pass. No runtime behaviour change.

### Out of scope

- Any refactor of the proxy detection logic itself.
- Any change to how CBOR metadata is parsed beyond naming the constant.
- Verifying the EIP-1967 slot values against the spec as a separate `finding` — the source observation flagged that as an option, but is not part of this task.

## Prompt

> Rename magic literals to documented constants in two files; no behaviour change.
>
> 1. In `packages/rocketh-proxy/src/index.ts`, find the two bare hex literals `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` and `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103` (around lines 444 and 467). Extract them to module-top named constants — e.g. `EIP1967_IMPLEMENTATION_SLOT` and `EIP1967_ADMIN_SLOT` — with a comment citing EIP-1967 (https://eips.ethereum.org/EIPS/eip-1967) and the derivation `bytes32(uint256(keccak256('eip1967.proxy.<name>')) - 1)`. Update both call sites to use the constants.
> 2. In `packages/rocketh-deploy/src/index.ts`, find the CBOR length-handling magic number used when parsing the Solidity metadata trailer, extract it to a named constant with a short comment explaining that the last 2 bytes of the deployed bytecode encode the CBOR metadata block length, and update the call site.
> 3. Match existing code style in each file (naming, `as const`, import ordering). Do not change any runtime behaviour, control flow, or types beyond introducing the constants.
> 4. Run `pnpm typecheck` and `pnpm test` and ensure both pass. Run `pnpm format` on the touched files.
>
> Do not touch anything else. Do not attempt to verify the EIP-1967 slot values against the spec as a `finding` — that is out of scope for this task.
