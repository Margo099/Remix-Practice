// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./IERC20.sol";

contract ERC20Base is IERC20 {
    address public owner;
    uint public totalTokens;
    mapping(address => uint) public balances;
    mapping(address => mapping(address => uint)) public allowances;

    string private _name;
    string private _symbol;

    modifier enoughBalance(address _from, uint _amount) {
        require(balanceOf(_from) >= _amount, "Not enough tokens!");
        _;
    }
    modifier onlyOwner() {
        require(owner == msg.sender, "Not an ownder!");
        _;
    }
    constructor(string memory name_, string memory symbol_, uint initialSupply, address exchanger) {
        _name = name_;
        _symbol = symbol_;
        owner = msg.sender;
        _mint(initialSupply, exchanger);
    }
    function name() external view override returns(string memory) {
        return _name;
    }
    function symbol() external view override returns(string memory){
        return _symbol;
    }
    function decimals() external pure override returns(uint) {
        return 18;
    }
    function totalSupply() public view override returns(uint) {
        return totalTokens;
    }
    function balanceOf(address account) public view override returns(uint) {
        return balances[account];
    }
    function transfer(address to, uint amount) external override enoughBalance(msg.sender, amount) returns(bool){
        _beforeTokenTransfer(msg.sender, to, amount);
        balances[msg.sender]-=amount;
        balances[to]+=amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    function transferFrom(address sender, address recipient, uint amount) public override returns (bool) {
        require(allowances[sender][msg.sender] >= amount, "Allowance too low");
        _beforeTokenTransfer(sender, recipient, amount);
        allowances[sender][msg.sender] -= amount;
        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }
    function mint(uint amount, address to) public onlyOwner {
        _mint(amount, to);
    }
    function _mint(uint amount, address to) internal {
        _beforeTokenTransfer(address(0), to, amount);
        totalTokens += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    function _burn(address from, uint amount) internal {
        _beforeTokenTransfer(from, address(0), amount);
        require(balances[from] >= amount, "Not enough tokens to burn");
        balances[from] -= amount;
        totalTokens -= amount;
        emit Transfer(from, address(0), amount);
    }
    function allowance(address _owner, address spender) public view override returns(uint){
        return allowances[_owner][spender];
    }
    function approve(address spender, uint amount) public override returns(bool){
        _approve(msg.sender, spender, amount);
        return true;
    }
    function _approve(address sender, address spender, uint amount) internal virtual {
        allowances[sender][spender] = amount;
        emit Approval(sender, spender, amount);
    }
    function _beforeTokenTransfer(
        address from,
        address to,
        uint amount
    ) internal virtual {}
}