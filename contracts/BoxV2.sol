// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// Implementation (logic)
pragma solidity ^0.8.9;

contract BoxV2 {
    uint256 internal value;

    event ValueChanged(uint256 newValue);

    function store(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }

    function retreive() public view returns (uint256) {
        return value;
    }

    function version() public pure returns (uint256) {
        return 2;
    }

    function incremenet() public {
        value = value + 1;
        emit ValueChanged(value);
    }
}