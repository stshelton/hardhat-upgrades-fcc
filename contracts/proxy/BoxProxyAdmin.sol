// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// Proxy admin contract
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract BoxProxyAdmin is ProxyAdmin {
    constructor(address /** owner */) ProxyAdmin() {}
}
