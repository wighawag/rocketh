// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// The playground compiles contracts/ with no import callback, so this is a copy of
// @rocketh/proxy/solc_0_8/ERC1967/Proxied.sol, the file a project imports from the package.
import {Proxied} from "./Proxied.sol";

/// @title Greetings Registry
/// @notice let user set a greeting, deployed behind a proxy
contract GreetingsRegistry is Proxied {
    /// @notice emitted whenever a user update its greeting
    /// @param user the account whose greeting was updated
    /// @param message the new greeting
    event MessageChanged(address indexed user, string message);

    string internal _prefix;

    /// @notice the greeting for each account
    mapping(address => string) public messages;

    constructor(string memory prefix) {
        _init(prefix);
    }

    /// @notice sets the prefix in the proxy's storage, called through the proxy by deployViaProxy's `execute`
    /// @param prefix the prefix applied to new greetings
    function postUpgrade(string memory prefix) external asProxyInitialiser {
        _init(prefix);
    }

    function _init(string memory prefix) internal {
        _prefix = prefix;
    }

    /// @notice called to set your own greeting
    /// @param message the new greeting
    function setMessage(string calldata message) external {
        string memory actualMessage = string(abi.encodePacked(_prefix, message));
        messages[msg.sender] = actualMessage;
        emit MessageChanged(msg.sender, actualMessage);
    }
}
