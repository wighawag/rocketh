// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Example Library
/// @notice an external library: a contract calling it is deployed with its address linked in
library ExampleLibrary {
    /// @notice the length of a string, in bytes
    function length(string memory value) external pure returns (uint256) {
        return bytes(value).length;
    }
}
