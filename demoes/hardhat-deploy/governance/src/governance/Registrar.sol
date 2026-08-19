// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Registrar
/// @notice A governance-owned pointer to the current registry, used by the demo to make
///         an ORDERING CONSTRAINT real rather than described.
/// @dev `setRegistry` refuses a version that is not exactly the next one, so a pair of
///      deferred transactions executed out of order REVERTS instead of quietly producing
///      a wrong state. That is the property scenario 003 demonstrates: when a run defers
///      an upgrade and a follow-up call from the same owner, the operator receives an
///      ORDERED list and the order is load-bearing.
contract Registrar {
    /// @notice emitted when governance points the registrar at a new registry
    /// @param registry the new registry address
    /// @param version the new version number
    event RegistryUpdated(address indexed registry, uint256 version);

    /// @notice emitted when ownership moves (deployer to governance, typically)
    /// @param previousOwner the outgoing owner
    /// @param newOwner the incoming owner
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice who may call the setters
    address public owner;

    /// @notice the registry currently pointed at
    address public registry;

    /// @notice monotonically increasing, one per accepted `setRegistry`
    uint256 public version;

    constructor(address owner_) {
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Registrar: NOT_OWNER");
        _;
    }

    /// @notice hand the registrar to a new owner (the deployer-to-governance handoff)
    /// @param newOwner the incoming owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Registrar: ZERO_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice point at a new registry
    /// @dev Reverts unless `version_` is exactly `version + 1`, which is what makes an
    ///      out-of-order execution fail loudly.
    /// @param registry_ the new registry address
    /// @param version_ must equal `version() + 1`
    function setRegistry(address registry_, uint256 version_) external onlyOwner {
        require(version_ == version + 1, "Registrar: OUT_OF_ORDER");
        registry = registry_;
        version = version_;
        emit RegistryUpdated(registry_, version_);
    }
}
