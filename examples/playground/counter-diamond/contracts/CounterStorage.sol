// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title The counter's state, in a slot of its own
/// @notice Facets share the diamond's storage, so the state they share lives at a fixed slot
///         (the diamond storage pattern) rather than in state variables of either facet.
library CounterStorage {
    bytes32 constant STORAGE_POSITION = keccak256("counter-diamond.counter.storage");

    struct Storage {
        uint256 count;
    }

    function get() internal pure returns (Storage storage s) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
