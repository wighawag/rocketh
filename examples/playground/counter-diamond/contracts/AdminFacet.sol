// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {CounterStorage} from "./CounterStorage.sol";

/// @notice the ownership function the diamond's default ownership facet serves (ERC-173)
interface IERC173 {
    function owner() external view returns (address);
}

/// @title Admin facet
/// @notice the diamond's owner can set the count
contract AdminFacet {
    /// @notice emitted whenever the count changes
    /// @param count the new count
    event CountChanged(uint256 count);

    /// @notice happens when an account other than the diamond's owner calls an admin function
    /// @param account the caller
    error NotOwner(address account);

    /// @notice sets the count, only for the diamond's owner
    /// @param newCount the new count
    function setCount(uint256 newCount) external {
        // The owner is the diamond's: asked of the diamond itself, which delegates owner() to its
        // ownership facet, so this facet needs nothing of that facet's storage layout.
        if (msg.sender != IERC173(address(this)).owner()) revert NotOwner(msg.sender);
        CounterStorage.get().count = newCount;
        emit CountChanged(newCount);
    }
}
