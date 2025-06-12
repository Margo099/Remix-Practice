// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./ERC20Base.sol";

contract AToken is ERC20Base {
    uint public tokenPrice;
    uint public tokensSold;
    address public tokenSwap;
    event Received(address sender, uint amount);
    constructor(address exchanger, uint _tokenPrice) ERC20Base("AToken", "A", 0, exchanger) {
        tokenPrice = _tokenPrice;
        tokenSwap = exchanger;
        _grantRole(MINTER_ROLE, tokenSwap);
    }
     function _beforeTokenTransfer(
        address from,
        address to,
        uint amount
    ) internal override {
            if(from != address(0)) {
                require(amount >0, "not enough tokens");
            }
        require(to != address(0), "invalid address");
    }
     function buyTokens(uint numberOfTokens) external payable {
        // keep track of number of tokens sold
        // require that a contract have enough tokens
        // require tha value sent is equal to token price
        // trigger sell event
         uint scaledAmount = numberOfTokens * (10 ** decimals());
        require(msg.value == tokenPrice * numberOfTokens, "Incorrect ETH amount sent");
        require(this.balanceOf(address(this)) >= scaledAmount, "Not enough tokens");
        _transfer(address(this), msg.sender, scaledAmount);
        tokensSold += scaledAmount;
}
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}