const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSwap", function(){
    let owner, user1, user2;
    let aToken, bToken, tokenSwap, snapshotId;
    let AToken, BToken, TokenSwap;
beforeEach(async function(){
    [owner, user1, user2] = await ethers.getSigners();

    AToken = await ethers.getContractFactory("AToken");
    BToken = await ethers.getContractFactory("BToken");
   
    const tokenPrice = ethers.parseEther("0.01");
   
   aToken = await AToken.deploy(owner.address, tokenPrice);
   bToken = await BToken.deploy(owner.address, tokenPrice);
   await aToken.waitForDeployment();
   await bToken.waitForDeployment();
   
    TokenSwap = await ethers.getContractFactory("TokenSwap");
    tokenSwap = await TokenSwap.deploy(await aToken.getAddress(), bToken.getAddress());
    await tokenSwap.waitForDeployment();

    //mint tokens for TokenSwap so it will be possible to make a swap operations
    await aToken.connect(owner).mint(ethers.parseEther("1000"), await tokenSwap.getAddress());
    await bToken.connect(owner).mint(ethers.parseEther("1000"), await tokenSwap.getAddress());

    //set ratio&fee
    await tokenSwap.connect(owner).setRatio(2); // 1A==2B
    await tokenSwap.connect(owner).setFees(2); // 2%

    snapshotId = await network.provider.send("evm_snapshot");
});
    afterEach(async function(){
        await network.provider.send("evm_revert", [snapshotId]);
    });
it("should revert if setRatio is done not by admin", async function(){
    await expect(tokenSwap.connect(user1).setRatio(2)
    ).to.be.revertedWith("Only admin");
});
it("should check the ratio", async function(){
    const ratio = await tokenSwap.connect(owner).getRatio();
    expect(ratio).to.equal(2);
});
it("should revert if setFees is done not by admin", async function(){
    await expect(tokenSwap.connect(user1).setFees(2)
    ).to.be.revertedWith("Only admin");
});
it("should check the fees", async function(){
    const fees = await tokenSwap.connect(owner).getFees();
    expect(fees).to.equal(2);
});
it("should swapTKA : A->B token", async function(){
    const fees = await tokenSwap.connect(owner).getFees();
    expect(fees).to.equal(2);

    const ratio = await tokenSwap.connect(owner).getRatio();
    expect(ratio).to.equal(2);

    const amountTKA = ethers.parseEther("10");

    //user1 buys AToken 
    await aToken.connect(owner).mint(amountTKA, user1.address);

    //revert if there is no approve to swap
    await expect(tokenSwap.connect(user1).swapTKA(amountTKA)).to.be.revertedWith("Approve TokenA first");

    //gain approve to TokenSwap to transfer AToken
    await aToken.connect(user1).approve(await tokenSwap.getAddress(), amountTKA);

    //user1 make a swap A->B
    await expect(tokenSwap.connect(user1).swapTKA(ethers.parseEther("0"))
    ).to.be.revertedWith("Not enough TokenA");
    await expect(tokenSwap.connect(user1).swapTKA(ethers.parseEther("15"))
    ).to.be.revertedWith("Insufficient AToken balance");
    await tokenSwap.connect(user1).swapTKA(amountTKA);

    const expectedB = ethers.parseEther("19.6"); //1A=2B, fees 2% => 10A=20B -2% = 19.6

    const user1BalanceB = await bToken.balanceOf(user1.address);
    expect(user1BalanceB).to.equal(expectedB);

});
it("should emit the event TokenSwapped", async function(){
    const fees = await tokenSwap.connect(owner).getFees();
    expect(fees).to.equal(2);

    const ratio = await tokenSwap.connect(owner).getRatio();
    expect(ratio).to.equal(2);

    const amountTKA = ethers.parseEther("10");

    //user1 buys AToken 
    await aToken.connect(owner).mint(amountTKA, user1.address);
    const exchangeAmount = ethers.parseEther("19.6");
    
    //gain approve to TokenSwap to transfer AToken
    await aToken.connect(user1).approve(await tokenSwap.getAddress(), amountTKA);
    
    //emit the event
    await expect(tokenSwap.connect(user1).swapTKA(amountTKA)
    ).to.emit(tokenSwap, "TokenSwapped").withArgs(user1.address, "A->B", amountTKA, exchangeAmount, fees);
});

});