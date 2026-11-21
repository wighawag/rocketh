// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title A
/// @notice knows B's address, given at construction
contract A {
    address public immutable b;

    constructor(address b_) {
        b = b_;
    }
}
