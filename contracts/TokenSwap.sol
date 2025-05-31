// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./ERC20Base.sol";
import "./AToken.sol";
import "./BToken.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenSwap is ReentrancyGuard {
    IERC20 public tokenA;
    IERC20 public tokenB;
    AToken public tokenAInstance;
    BToken public tokenBInstance;

    address payable public admin;
    uint public ratioAB; // how much TokenB one TokenA is worth
    uint public fees;    // Fee percentage (e.g. 2 means 2%)

    event AdminChanged(address oldAdmin, address newAdmin);
    event TokensWithdrawn(address token, uint amount);
    event ETHWithdrawn(uint amount);
    event SetNewFees(uint _fees);
    event TokenSwapped(address indexed user, string direction, uint amountIn, uint amountOut, uint fees);
    event SetNewRatio(uint indexed _ratio);
    constructor(address _tokenA, address _tokenB) {
    admin = payable(msg.sender);

    tokenA = IERC20(_tokenA);
    tokenB = IERC20(_tokenB);
    require(_tokenA != address(0) && _tokenB != address(0), "Token address cannot be 0");
    tokenAInstance = AToken(payable(_tokenA));
    tokenBInstance = BToken(payable(_tokenB));
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function setRatio(uint _ratio) public onlyAdmin {
        ratioAB = _ratio;
        emit SetNewRatio(_ratio);
    }
    function getRatio() public view onlyAdmin returns (uint) {
        return ratioAB;
    }
    function setFees(uint _fees) public onlyAdmin {
        fees = _fees;
        emit SetNewFees(_fees);
    }
    function getFees() public view onlyAdmin returns (uint) {
        return fees;
    }

    function swapTKA(uint amountTKA) public nonReentrant returns (uint) {
        require(amountTKA > 0, "Not enough TokenA");
        require(tokenA.balanceOf(msg.sender) >= amountTKA, "Insufficient AToken balance");
        require(tokenA.allowance(msg.sender, address(this)) >= amountTKA, "Approve TokenA first");
        require(ratioAB > 0, "ratio not set");
        uint rawAmount = amountTKA * ratioAB;
        uint feeAmount= (rawAmount*fees) / 100;
        uint exchangeAmount = rawAmount - feeAmount;

        require(exchangeAmount > 0, "Exchange amount must be greater than zero");
        require(tokenB.balanceOf(address(this)) >= exchangeAmount, "Insufficient BToken liquidity");

        tokenA.transferFrom(msg.sender, address(this), amountTKA);
        tokenB.transfer(msg.sender, exchangeAmount);

        emit TokenSwapped(msg.sender, "A->B", amountTKA, exchangeAmount, fees);
        return exchangeAmount;
    }

    function swapTKB(uint amountTKB) public nonReentrant returns (uint) {
        require(amountTKB > 0, "Not enough TokenB");
        require(tokenB.balanceOf(msg.sender) >= amountTKB, "Insufficient BToken balance");
        require(tokenB.allowance(msg.sender, address(this)) >= amountTKB, "Approve TokenB first");
        require(ratioAB > 0, "ratio not set");
        uint rawAmount = amountTKB / ratioAB;
        uint feeAmount = (rawAmount * fees) / 100;
        uint exchangeAmount = rawAmount - feeAmount;

        require(exchangeAmount > 0, "Exchange amount must be greater than zero");
        require(tokenA.balanceOf(address(this)) >= exchangeAmount, "Insufficient AToken liquidity");

        tokenB.transferFrom(msg.sender, address(this), amountTKB);
        tokenA.transfer(msg.sender, exchangeAmount);

        emit TokenSwapped(msg.sender, "B->A", amountTKB, exchangeAmount, fees);
        return exchangeAmount;
    }
    function buyTokensA(uint amount) public payable onlyAdmin {
        tokenAInstance.buyTokens{value: msg.value}(amount);
    }
    function buyTokensB(uint amount) public payable onlyAdmin {
        tokenBInstance.buyTokens{value: msg.value}(amount);
    }
    
    function withdrawTokens(address token, uint amount) public onlyAdmin {
    IERC20(token).transfer(admin, amount);
    emit TokensWithdrawn(token, amount);
    }

    function withdrawETH(uint amount) public onlyAdmin {
    admin.transfer(amount);
    emit ETHWithdrawn(amount);
    }

    function changeAdmin(address newAdmin) public onlyAdmin {
    require(newAdmin != address(0), "cannot be 0 address");
    emit AdminChanged(admin, newAdmin);
    admin = payable(newAdmin);
    }
    }
