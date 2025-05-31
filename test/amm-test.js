const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("AMM", function () {
    let Token, tokenA, tokenB, AMM, amm, owner, user;


    beforeEach(async function () {
        [owner,user] = await ethers.getSigners();

        //deploy ERC20 tokens
        const Token = await ethers.getContractFactory("ERC20Base");
        tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("1000"), owner.address);
        tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("1000"), owner.address);
        
        await tokenA.waitForDeployment();
        await tokenB.waitForDeployment();

        //Deploy AMM
        AMM = await ethers.getContractFactory("AMM");
        amm = await AMM.deploy(await tokenA.getAddress(), await tokenB.getAddress());
        await amm.waitForDeployment();

        //transfer tokens to user and approve AMM
        await tokenA.transfer(user.address, ethers.parseEther("100"));
        await tokenB.transfer(user.address, ethers.parseEther("100"));

        await tokenA.connect(user).approve(await amm.getAddress(), ethers.parseEther("100"));
        await tokenB.connect(user).approve(await amm.getAddress(), etherse.parseEther("100"));
    });
it("add liquididty create LP tokens", async function () {
    const amountA = ethers.parseEther("10");
    const amountB = ethers.parseEther("10");

    const tx = await amm.connect(user).addLiquidity(amountA, amountB);
    await tx.wait();

    const lpBalance = await amm.balanceOf(user.address);
    expect(lpBalance).to.be.gt(0);

    const reserveA = await amm.tokenAreserve();
    const reserveB = await amm.tokenBreserve();
    expect(reserveA).to.equal(amountA);
    expect(reserveB).to.equal(amountB);
});
it("swap token works correctly", async function () {
    const amountA = ethers.parseEther("10");
    const amountB = ethers.parseEther("10");

    await amm.connect(user).addLiquidity(amountA, amountB);
    
});
});