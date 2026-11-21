// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title B
/// @notice knows A's address, given at construction, before A exists
contract B {
    address public immutable a;

    constructor(address a_) {
        a = a_;
    }
}
