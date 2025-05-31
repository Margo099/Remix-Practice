// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

interface IERC20 {
    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function decimals() external pure returns(uint);
    
    function totalSupply() external view returns(uint);  //сколько всего монет есть в обороте
    function transfer(address to, uint amount) external returns(bool); // перевести куда и сколько с кошелька инициатора транзакции на др адрес
    function balanceOf(address account) external view returns(uint); // глянуть сколько на аккаунте монет
    function allowance(address _owner, address spender) external view returns(uint); // Смотрим если владелец кошелька дал разрешение контракту передать его деньги 3му лицу. Возвращает логическое значение, указывающее, была ли операция успешной. 
    function approve(address spender, uint amount) external returns(bool); //здесь разрешение для spender тратить amount от имени вызывающего msg.sender.
    function transferFrom(address sender, address recipient, uint amount) external returns(bool); //выполняет сам перевод

    event Transfer(address indexed from, address indexed to, uint amount);
    event Approval(address indexed owner, address indexed spender, uint amount);
}