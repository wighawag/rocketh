// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ExampleLibrary} from "./ExampleLibrary.sol";

/// @title Example
/// @notice a contract that calls an external library, so its bytecode links the library's address
contract Example {
    string public value;

    constructor(string memory initialValue) {
        value = initialValue;
    }

    /// @notice the length of `value`, computed by the linked library
    function valueLength() external view returns (uint256) {
        return ExampleLibrary.length(value);
    }
}
