const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("AMM", function () {
    let owner, user1, user2;
    let tokenA, tokenB;
    let AMM, amm, snapshotId;

beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20Base");
    const AMM = await ethers.getContractFactory("AMM");

    // Deploy tokens
    tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("1000"), owner.address);
    tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("1000"), owner.address);
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();

    // Deploy AMM
    amm = await AMM.deploy(tokenA.target, tokenB.target);
    await amm.waitForDeployment();

    // Transfer tokens to users
    await tokenA.transfer(user1.address, ethers.parseEther("100"));
    await tokenB.transfer(user1.address, ethers.parseEther("100"));
    await tokenA.transfer(user2.address, ethers.parseEther("100"));
    await tokenB.transfer(user2.address, ethers.parseEther("100"));

    // Approvals for users
    await tokenA.connect(user1).approve(amm.target, ethers.parseEther("100"));
    await tokenB.connect(user1).approve(amm.target, ethers.parseEther("100"));
    await tokenA.connect(user2).approve(amm.target, ethers.parseEther("100"));
    await tokenB.connect(user2).approve(amm.target, ethers.parseEther("100"));

    // Initial liquidity by owner
    await tokenA.approve(amm.target, ethers.parseEther("50"));
    await tokenB.approve(amm.target, ethers.parseEther("50"));
    await amm.addLiquidity(ethers.parseEther("50"), ethers.parseEther("50"));

    // Create snapshot
    snapshotId = await network.provider.send("evm_snapshot");
});
afterEach(async function(){
    await network.provider.send("evm_revert", [snapshotId]);
});
it("should add liquidity", async function () {
    const amountA = ethers.parseEther("10");
    const amountB = ethers.parseEther("10");
    await expect(amm.connect(user1).addLiquidity(amountA, amountB)
    ).to.emit(amm, "LiquidityAdded");

    const lpBalance = await amm.balanceOf(user1.address);
    expect(lpBalance).to.be.gt(0);

    const reserveA = await amm.tokenAreserve();
    const reserveB = await amm.tokenBreserve();
    expect(reserveA).to.equal(ethers.parseEther("60")); //50+10
    expect(reserveB).to.equal(ethers.parseEther("60")); //50+10
});
it("should swap token A to token B", async function() {
    const amountIn = ethers.parseEther("10");
    
    //balance before swap
    const balanceBBefore = await tokenB.balanceOf(user1.address);

    //Swap A->B
    await expect(amm.connect(user1).swap(tokenA.target, amountIn)
    ).to.emit(amm, "TokenSwaped");

    const balanceBAfter = await tokenB.balanceOf(user1.address);
    expect(balanceBAfter).to.be.gt(balanceBBefore);

    //check contract recieved A token
    const ammAtoken = await tokenA.balanceOf(amm.target);
    expect(ammAtoken).to.equal(ethers.parseEther("60")); //50 from beginning and +10 

    //check that token B was correctly transfered to user1
    const ammBalanceB = await tokenB.balanceOf(amm.target);
    expect(ammBalanceB).to.be.lt(ethers.parseEther("50"));
});
it("should fail if invalid token is provided", async function() {
    await expect(amm.connect(user1).swap(user2.address, ethers.parseEther("10"))
    ).to.be.revertedWith("invalid token!");
});
it("should fail if amount is zero", async function(){
    await expect(amm.connect(user1).swap(tokenA.target, ethers.parseEther("0"))
    ).to.be.revertedWith("amount must be >0!");
});
it("should remove liquidity correctly", async function() {
    const userInitialBalanceA = await tokenA.balanceOf(user1.address);
    const userInitialBalanceB = await tokenB.balanceOf(user2.address);

    //add liquidity from user1
    const amountA = ethers.parseEther("10");
    const amountB = ethers.parseEther("10");
    await amm.connect(user1).addLiquidity(amountA, amountB);

    const lpBalance = await amm.balanceOf(user1.address);
    expect(lpBalance).to.be.gt(0);

    //remove all liquidity
    await amm.connect(user1).removeLiquidity(lpBalance);

    //balances after
    const userFinalBalanceA = await tokenA.balanceOf(user1.address);
    const userFinalBalanceB = await tokenB.balanceOf(user1.address);
    //check that returned almost all
    expect(userFinalBalanceA).to.be.closeTo(userInitialBalanceA, ethers.parseEther("0.0001"));
    expect(userFinalBalanceB).to.be.closeTo(userInitialBalanceB, ethers.parseEther("0.0001"));

    //check that LP tokens are 0
    const lpBalanceAfter = await amm.balanceOf(user1.address);
    expect(lpBalanceAfter).to.be.equal(0);
});
it("should fail if trying to remove zero liquidity", async function() {
    await expect(amm.connect(user1).removeLiquidity(0)
    ).to.be.revertedWith("invalid balance");
});
});

