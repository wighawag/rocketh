// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameBase.sol";

// this route is the read-only part of the game. The contract NatSpec is the same in every route, since
// deployViaRouter merges it into one record and refuses two different notices.
/// @title Game
/// @notice a commit-reveal game, made of several routes behind one router
contract GameGetters is GameBase {
    constructor(Config memory config) GameBase(config) {}

    /// @notice the configuration every route was deployed with
    function getConfig() external view returns (Config memory) {
        return Config({commitPhaseDuration: COMMIT_PHASE_DURATION, revealPhaseDuration: REVEAL_PHASE_DURATION});
    }

    /// @notice whether the game is in its commit phase (otherwise it is in its reveal phase)
    function isCommitPhase() external view returns (bool) {
        return _isCommitPhase();
    }

    /// @notice the commitment a player made, if any
    function getCommitment(address player) external view returns (bytes32) {
        return _storage().commitments[player];
    }

    /// @notice the value a player revealed, if any
    function getRevealed(address player) external view returns (uint256) {
        return _storage().revealed[player];
    }
}
