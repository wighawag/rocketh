// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title GovernanceTimelock
/// @notice OpenZeppelin's `TimelockController`, unmodified, given a name and an artifact
///         so the demo can deploy the real thing rather than a bespoke imitation.
/// @dev This is the contract that makes the "the owner is not an address that can send"
///      problem concrete. When a ProxyAdmin is owned by one of these, rocketh computes
///      `from = <this timelock>` for the upgrade, and no operator can send a transaction
///      from a timelock. The transactions they can actually send are:
///
///        1. `schedule(target, value, data, predecessor, salt, delay)` from a PROPOSER
///        2. after `minDelay` has elapsed, `execute(target, value, data, predecessor, salt)`
///           from an EXECUTOR
///
///      Deriving those two from the deferred transaction is the subject of
///      `work/specs/proposed/deferred-tx-call-through-routing.md`. Until it lands, the
///      demo writes them by hand: see `deploy/004_timelock_owned_admin.ts`.
contract GovernanceTimelock is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
