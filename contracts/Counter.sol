// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract Counter {
    uint public count;

    function increment() public {
        count+=1;
    }
    function decrement() public {
        require(count > 0, "count must be > 0");
        count-=1;
    }
    function reset() public {
        count = 0;
    }
}