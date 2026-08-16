// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Greetings Registry, version 2
/// @notice The second implementation behind the playground's proxy. It exists to be UPGRADED
///         TO, so the tutorial can show what a proxy upgrade does and does not change.
///
/// @dev Two things about this contract are the whole lesson.
///
/// STORAGE LAYOUT IS APPENDED TO, NEVER REORDERED. `_prefix` and `messages` must stay in
/// exactly the positions v1 gave them (slot 0 and slot 1), because the proxy keeps its storage
/// across the upgrade and the new code reads the old slots. Inserting a variable above
/// `messages`, or swapping the two, would silently reinterpret every greeting anyone had
/// already stored. New state goes at the END, which is what `_prefixInitialized` does.
///
/// THE PREFIX IS SET BY A FUNCTION, NOT A CONSTRUCTOR. That is the fix for the bug v1
/// demonstrates: a constructor runs against the IMPLEMENTATION's storage, so v1's `_prefix` was
/// written somewhere the proxy never reads, and greetings came back with no prefix. Setting it
/// through a call means it is written through the proxy, into the storage the proxy actually
/// uses.
contract GreetingsRegistryV2 {
    /// @notice emitted whenever a user updates their greeting
    /// @param user the account whose greeting was updated
    /// @param message the new greeting
    event MessageChanged(address indexed user, string message);

    /// @notice emitted once, when the prefix is first set through the proxy
    /// @param prefix the prefix now applied to new greetings
    event PrefixSet(string prefix);

    /// @notice happen when trying to set an invalid greeting
    /// @param message the greeting
    error InvalidMessage(string message);

    /// @notice happen when trying to set the prefix a second time
    error AlreadyInitialized();

    // --- v1 layout, must not move ---

    string internal _prefix; // slot 0
    /// @notice the greeting for each account
    mapping(address => string) public messages; // slot 1

    // --- appended by v2 ---

    bool internal _prefixInitialized; // slot 2

    /// @notice set the prefix, once, through the proxy
    /// @dev Passed to `deployViaProxy` as `execute`, so rocketh calls it as part of the deploy
    ///      or the upgrade rather than leaving it to be remembered. The one-shot guard is what
    ///      stops anyone calling it again afterwards; a production contract would usually also
    ///      restrict it to the proxy owner.
    /// @param newPrefix the prefix to prepend to greetings set from now on
    function postUpgrade(string memory newPrefix) external {
        if (_prefixInitialized) {
            revert AlreadyInitialized();
        }
        _prefixInitialized = true;
        _prefix = newPrefix;
        emit PrefixSet(newPrefix);
    }

    /// @notice the prefix currently applied to new greetings
    /// @dev v1 had no way to read this, which is part of why its bug was invisible.
    function prefix() external view returns (string memory) {
        return _prefix;
    }

    /// @notice called to set your own greeting
    /// @param message the new greeting
    function setMessage(string calldata message) external {
        if (bytes(message).length == 0) {
            revert InvalidMessage(message);
        }
        string memory actualMessage = string(
            abi.encodePacked(_prefix, message)
        );
        messages[msg.sender] = actualMessage;
        emit MessageChanged(msg.sender, actualMessage);
    }
}
