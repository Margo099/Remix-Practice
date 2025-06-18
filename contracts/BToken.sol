// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./ERC20Base.sol";

contract BToken is ERC20Base {
    uint public tokenPrice;
    uint public tokensSold;
    address public tokenSwap;
    event Received(address sender, uint amount);
    constructor(address _initialMinterAndAdmin, uint _tokenPrice) ERC20Base("BToken", "B", 0, _initialMinterAndAdmin) {
         tokenPrice = _tokenPrice;
         tokenSwap = _initialMinterAndAdmin;
         _grantRole(MINTER_ROLE, tokenSwap);
    }
    function setTokenSwapAddress(address _tokenSwapAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_tokenSwapAddress != address(0), "TokenSwap address cannot be zero");
        tokenSwap = _tokenSwapAddress;
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
    function withdrawETH(uint amount) public {
        require(msg.sender == tokenSwap, "Only TokenSwap can withdraw");
        payable(tokenSwap).transfer(amount);
}
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}