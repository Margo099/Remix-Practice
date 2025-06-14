const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokenConfigs = [
    { name: "AToken", symbol: "A", contractName: "AToken" },
    { name: "BToken", symbol: "B", contractName: "BToken" }
];

for (const config of tokenConfigs) {
    describe(`${config.name}`, function () {
        let owner, tokenPrice, user1, user2, token, snapshotId;

        beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory(config.contractName);
    tokenPrice = ethers.parseEther("0.01");
    token = await Token.deploy(owner.address, tokenPrice);

    await token.waitForDeployment();
    tokenAddress = await token.getAddress();

    // mint tokens to contract
    const totalSupply = ethers.parseEther("1000");
    await token.connect(owner).mint(totalSupply, tokenAddress);

    // check contract balance
    const contractBalance = await token.balanceOf(tokenAddress);
    expect(contractBalance).to.equal(totalSupply);

    snapshotId = await network.provider.send("evm_snapshot");
    });

        afterEach(async function () {
        await network.provider.send("evm_revert", [snapshotId]);
        });

    it("should have correct name and symbol", async function () {
        expect(await token.name()).to.equal(config.name);
        expect(await token.symbol()).to.equal(config.symbol);
        });

    it("check token price", async function () {
        expect(await token.tokenPrice()).to.equal(tokenPrice);
        });

    it("buy correct value", async function () {
    const numberOfTokens = 10n;
    const scaledAmount = ethers.parseEther("10"); // 10 tokens with 18 symbols

    // check that the price is correct
    expect(tokenPrice).to.equal(ethers.parseEther("0.01"));

    // If ETH value is wrong
    const wrongValue = ethers.parseEther("0.05");
    await expect(
        token.connect(user1).buyTokens(numberOfTokens, { value: wrongValue })
    ).to.be.revertedWith("Incorrect ETH amount sent");

    // if ETH value is correct
    const correctValue = tokenPrice * numberOfTokens;
    await token.connect(user1).buyTokens(numberOfTokens, { value: correctValue });

    // check user balance
    const userBalance = await token.balanceOf(user1.address);
    expect(userBalance).to.equal(scaledAmount);

    // check tokensSold
    const tokensSold = await token.tokensSold();
    expect(tokensSold).to.equal(scaledAmount);

    // check contract balance now
    const contractBalance = await token.balanceOf(tokenAddress);
    expect(contractBalance).to.equal(ethers.parseEther("990"));
    });
    it("transfer tokens", async function () {
        const amount = ethers.parseEther("10");

         //mint tokens to user1
        await token.connect(owner).mint(ethers.parseEther("100"), user1.address);

        //check if balance of user1 is greater then amount
        const amountToSend = await token.balanceOf(user1.address);
        expect(amountToSend).to.be.at.least(amount);

        //transfer from user1 to user2
        await token.connect(user1).transfer(user2.address, amount);

        //check user2 balance 
        const user2Balance = await token.balanceOf(user2.address);
        expect(user2Balance).to.equal(amount);

        //check user1 balance
        const user1Balance = await token.balanceOf(user1.address);
        expect(user1Balance).to.equal(ethers.parseEther("90"));

        await expect(token.connect(user1).transfer(user2.address, amount)).to.emit(token, "Transfer").withArgs(user1.address, user2.address, amount);
        });

    it("should revert transfer to zero address", async function () {
            const zeroAddress = "0x0000000000000000000000000000000000000000";
            await token.connect(owner).mint(ethers.parseEther("100"), user1.address);

            await expect(
                token.connect(user1).transfer(ethers.ZeroAddress, ethers.parseEther("10"))
            ).to.be.revertedWith("invalid address");
        });

    it("should revert transfer with zero amount", async function () {
            await token.connect(owner).mint(ethers.parseEther("10"), user1.address);
            await expect(token.connect(user1).transfer(user2.address, 0)).to.be.revertedWith("not enough tokens");
        });
    });
}