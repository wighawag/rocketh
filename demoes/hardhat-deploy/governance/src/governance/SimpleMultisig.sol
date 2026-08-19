// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title SimpleMultisig
/// @notice A DEMO STAND-IN for a Gnosis Safe, and nothing more.
/// @dev It exists to give the demo a contract address that CAN be made to send a
///      transaction, which is the only property the unknown-signer flow depends on.
///      It has no threshold, no signature collection, no nonce and no module system:
///      any owner can execute alone. Do not read this demo as a Safe integration, and
///      do not deploy this contract anywhere that matters.
contract SimpleMultisig {
    /// @notice emitted for every call this multisig makes on behalf of its owners
    /// @param sender the owner that triggered the call
    /// @param to the target of the call
    /// @param value the wei forwarded
    /// @param data the calldata forwarded
    event Executed(address indexed sender, address indexed to, uint256 value, bytes data);

    /// @notice whether an address may execute through this multisig
    mapping(address => bool) public isOwner;

    constructor(address[] memory owners) {
        for (uint256 i = 0; i < owners.length; i++) {
            isOwner[owners[i]] = true;
        }
    }

    /// @notice execute a transaction as this contract
    /// @dev This is the operator's side of `catchUnknownSigner`: rocketh prints
    ///      `{from: <this contract>, to, value, data}` and the operator replays it here.
    /// @param to the target of the call
    /// @param value the wei to forward
    /// @param data the calldata to forward
    /// @return result the raw return data of the call
    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable returns (bytes memory result) {
        require(isOwner[msg.sender], "SimpleMultisig: NOT_AN_OWNER");

        bool success;
        (success, result) = to.call{value: value}(data);
        if (!success) {
            // Bubble the target's revert reason up, so a failed governance call is
            //  debuggable instead of an opaque "execution reverted".
            assembly {
                revert(add(result, 32), mload(result))
            }
        }

        emit Executed(msg.sender, to, value, data);
    }

    receive() external payable {}
}
