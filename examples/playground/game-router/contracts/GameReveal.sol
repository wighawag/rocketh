// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameBase.sol";

// this route is the reveal phase of the game. The contract NatSpec is the same in every route, since
// deployViaRouter merges it into one record and refuses two different notices.
/// @title Game
/// @notice a commit-reveal game, made of several routes behind one router
contract GameReveal is GameBase {
    /// @notice emitted when a player reveals
    event Revealed(address indexed player, uint256 value);

    constructor(Config memory config) GameBase(config) {}

    /// @notice reveal the value committed to in the commit phase
    function reveal(uint256 value, bytes32 salt) external {
        require(!_isCommitPhase(), "NOT_REVEAL_PHASE");
        GameStorage storage s = _storage();
        require(s.commitments[msg.sender] == keccak256(abi.encode(value, salt)), "INVALID_REVEAL");
        delete s.commitments[msg.sender];
        s.revealed[msg.sender] = value;
        emit Revealed(msg.sender, value);
    }
}
