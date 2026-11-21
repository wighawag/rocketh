// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Proxied
/// @notice Abstract contract providing proxy-aware initialization and access control utilities
/// @dev This contract is designed to be inherited by implementation contracts used behind ERC1967 proxies.
///      It provides modifiers for proxy-only execution and initialization patterns.
///      Storage slots follow the ERC1967 standard where applicable.
abstract contract Proxied {
	/// @notice Restricts function access to the proxy admin only
	/// @dev Uses the ERC1967 admin slot to determine the admin address
	modifier onlyProxyAdmin() {
		require(msg.sender == _proxyAdmin(), "PROXY_ONLY_ADMIN");
		_;
	}

	/// @notice Modifier for functions that should only be called once during proxy initialization
	/// @dev This modifier ensures the function can only be called once and only through a proxy.
	///
	/// =====================================================================================
	/// ⚠️  CRITICAL SECURITY WARNING ⚠️
	/// =====================================================================================
	/// Functions using this modifier MUST be called during the proxy deployment transaction
	/// (typically via the proxy constructor's initialization calldata).
	///
	/// If the initializer function is NOT called at deployment time, the contract will be
	/// left in an uninitialized state, and ANYONE can call the initializer function to
	/// take control of the contract. This could lead to:
	///   - Unauthorized ownership of the contract
	///   - Theft of funds
	///   - Manipulation of contract state
	///
	/// NEVER deploy a proxy without immediately calling such initializer in the same transaction.
	/// =====================================================================================
	modifier asProxyOneTimeInitialiser() {
		bool initialised = _ensureProxyOnly();

		// only allowed to be called once
		require(!initialised, "PROXY_ALREADY_INITIALISED");

		_markAsInitialised();

		_;
	}

	/// @notice Modifier for functions that can be re-initialized by the proxy admin after first initialization
	/// @dev On first call, marks the contract as initialized. On subsequent calls, requires proxy admin.
	///
	/// =====================================================================================
	/// ⚠️  CRITICAL SECURITY WARNING ⚠️
	/// =====================================================================================
	/// Functions using this modifier MUST be called during the proxy deployment transaction
	/// (typically via the proxy constructor's initialization calldata).
	///
	/// If the initializer function is NOT called at deployment time, the contract will be
	/// left in an uninitialized state, and ANYONE can call the initializer function to
	/// take control of the contract. This could lead to:
	///   - Unauthorized ownership of the contract
	///   - Theft of funds
	///   - Manipulation of contract state
	///
	/// NEVER deploy a proxy without immediately calling such initializer in the same transaction.
	///
	/// After initialization, only the proxy admin can call functions with this modifier,
	/// which is useful for upgrade scenarios where re-initialization may be needed.
	/// =====================================================================================
	modifier asProxyInitialiser() {
		bool initialised = _ensureProxyOnly();

		if (initialised) {
			// if initialised, can be called only by proxy admin
			require(msg.sender == _proxyAdmin(), "PROXY_INIT_ONLY_ADMIN");
		} else {
			_markAsInitialised();
		}

		_;
	}

	/// @notice Ensures the function is being called through a proxy and returns initialization status
	/// @dev Reverts if not called through a proxy (i.e., if implementation address is zero)
	/// @return initialised Whether the proxy has already been initialized
	function _ensureProxyOnly() internal view returns (bool initialised) {
		address implementationAddress = _proxyImplementation();

		// only allowed if proxy
		require(implementationAddress != address(0), "PROXY_ONLY");

		initialised = _proxyInitialised();
	}

	/// @notice Marks the proxy as initialized
	/// @dev Writes `true` to the custom initialization storage slot.
	///      Slot: bytes32(uint256(keccak256('eip1967.proxy.initialised')) - 1)
	function _markAsInitialised() internal {
		// solhint-disable-next-line security/no-inline-assembly
		assembly {
			sstore(0x0037d21023b0b946d199d157363fe66c4e723e916e3bab3dac56c11d3acca3b4, true)
		}
	}

	/// @notice Returns the current proxy admin address
	/// @dev Reads from the ERC1967 admin slot.
	///      Slot: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
	/// @return ownerAddress The address of the proxy admin
	function _proxyAdmin() internal view returns (address ownerAddress) {
		// solhint-disable-next-line security/no-inline-assembly
		assembly {
			ownerAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)
		}
	}

	/// @notice Returns the current implementation address
	/// @dev Reads from the ERC1967 implementation slot.
	///      Slot: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
	/// @return implementationAddress The address of the current implementation contract
	function _proxyImplementation() internal view returns (address implementationAddress) {
		// solhint-disable-next-line security/no-inline-assembly
		assembly {
			implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)
		}
	}

	/// @notice Checks whether the proxy has been initialized
	/// @dev Reads from the custom initialization storage slot.
	///      Slot: bytes32(uint256(keccak256('eip1967.proxy.initialised')) - 1)
	/// @return initialised Whether the proxy has been initialized
	function _proxyInitialised() internal view returns (bool initialised) {
		// solhint-disable-next-line security/no-inline-assembly
		assembly {
			initialised := sload(0x0037d21023b0b946d199d157363fe66c4e723e916e3bab3dac56c11d3acca3b4)
		}
	}
}
