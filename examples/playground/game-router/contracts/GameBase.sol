// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Game base
/// @notice what every route of the game shares: its configuration and its storage.
/// The routes run behind one router (and here behind one proxy), so they share the
/// proxy's storage: it is declared once, here, in its own slot.
/// It declares no external function, since two routes declaring the same one are refused.
abstract contract GameBase {
    struct Config {
        uint256 commitPhaseDuration;
        uint256 revealPhaseDuration;
    }

    struct GameStorage {
        mapping(address => bytes32) commitments;
        mapping(address => uint256) revealed;
    }

    bytes32 internal constant GAME_STORAGE_SLOT = keccak256("game.storage");

    uint256 internal immutable COMMIT_PHASE_DURATION;
    uint256 internal immutable REVEAL_PHASE_DURATION;

    constructor(Config memory config) {
        COMMIT_PHASE_DURATION = config.commitPhaseDuration;
        REVEAL_PHASE_DURATION = config.revealPhaseDuration;
    }

    function _storage() internal pure returns (GameStorage storage s) {
        bytes32 slot = GAME_STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }

    function _isCommitPhase() internal view returns (bool) {
        return block.timestamp % (COMMIT_PHASE_DURATION + REVEAL_PHASE_DURATION) < COMMIT_PHASE_DURATION;
    }
}
