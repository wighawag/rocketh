// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameBase.sol";

// this route is the commit phase of the game. The contract NatSpec is the same in every route, since
// deployViaRouter merges it into one record and refuses two different notices.
/// @title Game
/// @notice a commit-reveal game, made of several routes behind one router
contract GameCommit is GameBase {
    /// @notice emitted when a player commits
    event Committed(address indexed player, bytes32 commitment);

    constructor(Config memory config) GameBase(config) {}

    /// @notice commit to a value: keccak256(abi.encode(value, salt))
    function commit(bytes32 commitment) external {
        require(_isCommitPhase(), "NOT_COMMIT_PHASE");
        _storage().commitments[msg.sender] = commitment;
        emit Committed(msg.sender, commitment);
    }
}
