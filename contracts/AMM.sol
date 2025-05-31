// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

//import "@thirdweb-dev/contracts/base/ERC20Base.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./ERC20Base.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AMM is ERC20Base, ReentrancyGuard {
    ERC20Base public tokenA;
    ERC20Base public tokenB;
    uint public tokenAreserve;
    uint public tokenBreserve;
    mapping(address => uint) public balanceOfaccount;
    event LiquidityAdded(address indexed provider, uint amountA, uint amountB, uint shares);
    event TokenSwaped(address recipient, uint amount);

    constructor(address _tokenA, address _tokenB) ERC20Base("LP Token", "LPT", 0, msg.sender) {
    tokenA = ERC20Base(_tokenA);
    tokenB = ERC20Base(_tokenB); 
    }
    function _update(uint256 _tokenAreserve, uint256 _tokenBreserve) private {
        tokenAreserve = _tokenAreserve;
        tokenBreserve = _tokenBreserve;
    }
    function addLiquidity(uint _amountA, uint _amountB) external payable nonReentrant returns(uint shares) {
        
        tokenA.transferFrom(msg.sender, address(this), _amountA);
        tokenB.transferFrom(msg.sender, address(this), _amountB);
        if(tokenAreserve > 0 || tokenBreserve > 0 ) {
            require(tokenAreserve * _amountA == tokenBreserve * _amountB, "x * y != dx * dy");
        }
        if(totalSupply() == 0) {
            shares=Math.sqrt(_amountA * _amountB);
        } else {
            shares= Math.min((_amountA*totalSupply())/tokenAreserve,
            (_amountB *totalSupply())/tokenBreserve);
        }
        require(shares > 0, "shares =0");
        _mint(shares, msg.sender);
        _update(tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)));
        emit LiquidityAdded(msg.sender, _amountA, _amountB, shares);
    }
    function swap(address _tokenIn, uint _amountIn) external returns(uint _amountOut) {
        require(_tokenIn==address(tokenA) || _tokenIn== address(tokenB), "invalid token!");
        require(_amountIn>0, "amount must be >0!");
        bool isTokenA= _tokenIn == address(tokenA);
        (IERC20 tokenIn, IERC20 tokenOut, uint reserveIn, uint reserveOut) = isTokenA 
        ? (tokenA, tokenB, tokenAreserve, tokenBreserve) 
        : (tokenB, tokenA, tokenBreserve, tokenAreserve);
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);
        uint amountWithFee= (_amountIn *995)/ 1000;
        _amountOut= (reserveOut*amountWithFee)/(reserveIn+amountWithFee);
        
        tokenOut.transfer(msg.sender, _amountOut);
        _update(tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)));
        emit TokenSwaped(msg.sender, _amountOut);
    }
    function removeLiquidity(uint _shares) external returns(uint amountA, uint amountB) {
        uint balA = tokenA.balanceOf(address(this));
        uint balB = tokenB.balanceOf(address(this));

        uint amountA = (_shares * balA) / totalSupply();
        uint amountB = (_shares * balB) / totalSupply();
        require(amountA > 0 && amountB > 0, "invalid balance");

        _burn(msg.sender, _shares);
        _update(balA - amountA, balB - amountB);

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
    }
}