# "Updating smart contracts"

There are three main ways to "Update" your smart contract

1) Parameterize Method - esstenially creaing setter functions that will change something within the contract. Like if there is a reward of some type you could update what the reward is with a setter function.
    - **disadvantages**
        -  cant add new storage
        -  cant add new logic
        - whos the admin to update contract? if its one person then ur contract is techniqually centralized
            - u could add a governace contract to be admin of contract to make it de-centralized

    - **advatages** 
        - Simple but not flexible

2) Socail Migration Method - deploy a new contract and tell everyone socially to use new contract
    - **advatages**
        - this keeps it immutable thru its entirety
            - many people argue that if a smart contract is mutable then it truely isnt decentralized
        - Easies to audit
    - **disadvatages**
        - lot of work to convince users to move to new contract
        - different address
        - alot of work to build new contract

3) Proxies Method - is esstenially creating a parent contract that delegates there calls to a different contract, then when admin wants to update contract the parent contract is updated to delegate work to new contract. this way the original contract always stays the same.
    - **disavatages**
        - Storage Clashes
            - functions actually point to storage spots in solidity, not to the value names.
        - Function selector clashes
            - function selector: A 4 byte hash of a function name and function signature that define a function.
            - its possible for the impleentation contract and proxy contact to have the same function selector for different functions.
    - **addvatages**
        - allows you to actaully fully change a contracts logic
        - always points to same address because the proxy contact never changes, its the implementation contracts taht proxy talks to which are changed
            

## Proxy
------ 
**Proxy Terminology:**
1) The implementation Contract
    - whic has all our code of our protocol, when we upgrade, we launch a brand new implementation contract
2) The Proxy contract.
    - which points to which implementation is the "correct" one, and routes everyone's function calls to the contract
3) The User
    - They make calls to the proxy
4) The Admin
    - this is the user (or group of users/voters) to upgrade to new implementation contracts
5) Data stays in proxy contact 
    - so it doesnt get lost when updating the implementation contracts
    
## 3 Ways to implement proxy contact 

1) Transparanet proxy pattern
    - admins cant call implementation contract functions
    - Users still powerless on admin functions

2) Universal Upgradeable Proxies
    - admin only upgrade funcitons are in implementation contracts instead of the proxy
    - this will aactually make solidy comppiler see that there is a function selector clash without deploying it
    - saves on gas fees cz the proxy contract is alot smaller
    - **Issue**: if you deploy and implementation contract without any upgradeable functionality then ur stuck

3) Diamond pattern
    - allows for multiple implementation contracts
    - having multiple implementation contracts allows for smaller more granular updates

`EIP - 1967` - Standard Proxy Storage Slots
    - and eth improvemnet proposal on how to store the address of implementation contracts


# DelegateCall

[Solidty By Example](https://solidity-by-example.org/delegatecall/)

`delegatecall`: is a low level function similar to call.

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// NOTE: Deploy this contract first
contract B {
    // NOTE: storage layout must be the same as contract A
    uint public num;
    address public sender;
    uint public value;

    function setVars(uint _num) public payable {
        num = _num;
        sender = msg.sender;
        value = msg.value;
    }
}

contract A {
    uint public num;
    address public sender;
    uint public value;

    function setVars(address _contract, uint _num) public payable {
        // A's storage is set, B is not modified.
        (bool success, bytes memory data) = _contract.delegatecall(
            abi.encodeWithSignature("setVars(uint256)", _num)
        );
    }
}
```
so by callling delegateCall we are using contracts b serVars function but within contract a not in contract b. Its almost borrowing it to use once then "deletes" it.
- one major thing is it doesnt set these values based on the name of the storage variables it does it based off the storage slots.
    - for example the names on contract `A` doesnt matter because the borrowed function will update storage slots 
    - example: storageSlot[0] = (num). num could be named anything cz num is storageSlot[0]
    - another interesting fact is lets say you dont have any variables it will still save these values in storageSlot[0], storageSlot[1], and storageSlot[2]
- this can get very tricky tho, so lets say we change num to an address or boolean, using the delegateCall will still update storage slot `0` with nums value, but if its a boolean solidty will convert number into true or false value. Or if its address it will be updated with whatever number u entered in


# Example Proxy

```
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/proxy/Proxy.sol";

contract SmallProxy is Proxy {
    // This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1
    bytes32 private constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    //changes where the delegate calls are being sent
    function setImplementation(address newImplementation) public {
        assembly {
            sstore(_IMPLEMENTATION_SLOT, newImplementation)
        }
    }

    //read where the implementation are
    function _implementation() internal view override returns (address implementationAddress) {
        assembly {
            implementationAddress := sload(_IMPLEMENTATION_SLOT)
        }
    }

    // helper function
    function getDataToTransact(uint256 numberToUpdate) public pure returns (bytes memory) {
        return abi.encodeWithSignature("setValue(uint256)", numberToUpdate);
    }

    function readStorage() public view returns (uint256 valueAtStorageSlotZero) {
        assembly {
            valueAtStorageSlotZero := sload(0)
        }
    }
}

//small proxy -> implementationA
contract ImplementationA {
    uint256 public value;

    function setValue(uint256 newValue) public {
        value = newValue;
    }
}

contract ImplementationB {
    uint256 public value;

    function setValue(uint256 newValue) public {
        value = newValue + 2;
    }
}

// function setImplementation(){}
// Transparent Proxy -> Ok, only admins can call functions on the proxy
// anyone else ALWAYS gets sent to the fallback contract.

// UUPS -> Where all upgrade logic is in the implementation contract, and
// you can't have 2 functions with the same function selector.

```


# Example Contract Update with Hardhat
1) updrage box -> BoxV2
2) point proxy from box to boxv2

How can we build this proxy

1) deploy a proxy manually
2) use hardhat-deploys built in proxies
3) Openzepplin upgrades plugin

In this example we will be using hardhat-deploys to build proxy

##  Deploy script

```
const box = await deploy("Box", {
        from: deployer,
        args: [],
        waitConfirmations: network.config.blockConfirmations,
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            // the proxy contract is owned by a contract
            viaAdminContract: {
                name: "BoxProxyAdmin",
                artifact: "BocProxyAdmin",
            },
        },
    })
```

here we tell hardhat that the proxy contract is the one from openZeppelin and the admin to that contract is the contract we create called BoxProxyAdmin.
- its best practice to use a contract as the admin to the proxy instead on a single account


## Lets update contract manually

```
async function main() {
    // 1)
    const BoxProxyAdmin = await ethers.getContract("BoxProxyAdmin")
    const transparentProxy = await ethers.getContract("Box_Proxy")
    const boxV2 = await ethers.getContract("BoxV2")

   // 2)
    const upgradeTx = await BoxProxyAdmin.upgrade(transparentProxy.address, boxV2.address)

    //3)
    const proxyBoxV2 = await ethers.getContractAt("BoxV2", transparentProxy.address)
    const version = await proxyBoxV2.Version()
    console.log(version)
}
```
1) Get the proxy contract, the admin contract to that proxy and the new implementation contract
2) next call upgrade on the admin contract. Which calls it on the transparentProxy, which will change the implemenation from boxv1 to boxv2
3) Now get boxv2 contract by asking for boxV2 on the transparentProxy address 
    - this is done because we updated transparentProxy with the abi of boxV2 so when it calls functions it  calls them on boxV2

4) hard hat can do this thru there API [docs](https://docs.openzeppelin.com/upgrades-plugins/1.x/) [tutorial](https://forum.openzeppelin.com/t/openzeppelin-upgrades-step-by-step-tutorial-for-hardhat/3580)