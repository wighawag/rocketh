// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {CounterStorage} from "./CounterStorage.sol";

/// @title Counter facet
/// @notice anyone can read the count and increment it
contract CounterFacet {
    /// @notice emitted whenever the count changes
    /// @param count the new count
    event CountChanged(uint256 count);

    /// @notice the current count
    function count() external view returns (uint256) {
        return CounterStorage.get().count;
    }

    /// @notice adds one to the count
    function increment() external {
        CounterStorage.Storage storage s = CounterStorage.get();
        s.count += 1;
        emit CountChanged(s.count);
    }
}
