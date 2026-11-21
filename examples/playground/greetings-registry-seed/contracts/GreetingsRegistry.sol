// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Greetings Registry
/// @notice let user set a greeting
contract GreetingsRegistry {
    /// @notice emitted whenever a user update its greeting
    /// @param user the account whose greeting was updated
    /// @param message the new greeting
    event MessageChanged(address indexed user, string message);

    /// @notice emitted when the registry is seeded
    /// @param value the value it was seeded with
    event Seeded(uint256 value);

    string internal _prefix;

    // the sum of every seed, kept internal: nothing can be read back to tell whether a seed happened
    uint256 internal _seed;

    /// @notice the greeting for each account
    mapping(address => string) public messages;

    constructor(string memory prefix) {
        _prefix = prefix;
    }

    /// @notice called to set your own greeting
    /// @param message the new greeting
    function setMessage(string calldata message) external {
        string memory actualMessage = string(abi.encodePacked(_prefix, message));
        messages[msg.sender] = actualMessage;
        emit MessageChanged(msg.sender, actualMessage);
    }

    /// @notice a one-off: adds `value` to the registry's seed, on every call
    /// @param value the value to seed it with
    function seed(uint256 value) external {
        _seed += value;
        emit Seeded(value);
    }
}
