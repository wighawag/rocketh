// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title My contract
/// @notice holds the greeting it was deployed with
contract MyContract {
    /// @notice the greeting given at deployment
    string public greeting;

    constructor(string memory initialGreeting) {
        greeting = initialGreeting;
    }
}
