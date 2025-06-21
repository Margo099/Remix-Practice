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
    TokenSwap = await ethers.getContractFactory("TokenSwap");
    const tokenPrice = ethers.parseEther("0.01");
   
    aToken = await AToken.deploy(owner.address, tokenPrice);
    bToken = await BToken.deploy(owner.address, tokenPrice);
    await aToken.waitForDeployment();
    await bToken.waitForDeployment();
   
    tokenSwap = await TokenSwap.deploy(await aToken.getAddress(), bToken.getAddress());
    await tokenSwap.waitForDeployment();

    await aToken.connect(owner).setTokenSwapAddress(await tokenSwap.getAddress());
    await bToken.connect(owner).setTokenSwapAddress(await tokenSwap.getAddress());

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
    await expect(tokenSwap.connect(user1).swapTKA(amountTKA)
    ).to.be.revertedWith("Approve TokenA first");

    //gain approve to TokenSwap to transfer AToken
    await aToken.connect(user1).approve(await tokenSwap.getAddress(), amountTKA);

    //user1 makes a swap A->B
    await expect(tokenSwap.connect(user1).swapTKA(ethers.parseEther("0"))
    ).to.be.revertedWith("Not enough TokenA");
    await expect(tokenSwap.connect(user1).swapTKA(ethers.parseEther("15"))
    ).to.be.revertedWith("Insufficient AToken balance");
    
    await tokenSwap.connect(user1).swapTKA(amountTKA);

    const expectedB = ethers.parseEther("19.6"); //1A=2B, fees 2% => 10A=20B -2% = 19.6

    //check the expected balance of user1
    const user1BalanceB = await bToken.balanceOf(user1.address);
    expect(user1BalanceB).to.equal(expectedB);
});
it("should emit the event TokenSwapped A->B", async function(){
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
it("should swapTKB : B->A", async function(){
     const fees = await tokenSwap.connect(owner).getFees();
    expect(fees).to.equal(2);

    const ratio = await tokenSwap.connect(owner).getRatio();
    expect(ratio).to.equal(2);

    const amountTKB = ethers.parseEther("20");

    //user1 buys B token
    await bToken.connect(owner).mint(amountTKB, user1.address);

    //revert if there is no approve for swap
    await expect(tokenSwap.connect(user1).swapTKB(amountTKB)
    ).to.be.revertedWith("Approve TokenB first");

    //gain the approve to swap BToken
    await bToken.connect(user1).approve(await tokenSwap.getAddress(), amountTKB);

    //user1 makes swap B->A
    await expect(tokenSwap.connect(user1).swapTKB(ethers.parseEther("0"))
    ).to.be.revertedWith("Not enough TokenB");
    await expect(tokenSwap.connect(user1).swapTKB(ethers.parseEther("30"))
    ).to.be.revertedWith("Insufficient BToken balance");

    await tokenSwap.connect(user1).swapTKB(amountTKB);

    const expectedA = ethers.parseEther("9.8"); //1A=2B, fees 2% => 20B=10A -2% = 9.8

    //check the expected balance of user1
    const user1BalanceA = await aToken.balanceOf(user1.address);
    expect(user1BalanceA).to.equal(expectedA);
});
it("should emit the event TokenSwapped B->A", async function(){
    const fees = await tokenSwap.connect(owner).getFees();
    expect(fees).to.equal(2);

    const ratio = await tokenSwap.connect(owner).getRatio();
    expect(ratio).to.equal(2);

    const amountTKB = ethers.parseEther("20");

    //user1 buys BToken 
    await bToken.connect(owner).mint(amountTKB, user1.address);
    const exchangeAmount = ethers.parseEther("9.8");
    
    //gain approve to TokenSwap to transfer BToken
    await bToken.connect(user1).approve(await tokenSwap.getAddress(), amountTKB);
    
    //emit the event
    await expect(tokenSwap.connect(user1).swapTKB(amountTKB)
    ).to.emit(tokenSwap, "TokenSwapped").withArgs(user1.address, "B->A", amountTKB, exchangeAmount, fees);
});
it("should check that its possible to buy A tokens", async function(){
    const tokenAmount = 10;
    const scaledAmount = ethers.parseEther(tokenAmount.toString());
    const tokenPrice = await aToken.tokenPrice(); //0.01 ETH per token
    const totalCost = tokenPrice * BigInt(tokenAmount);

    //make a sure that aToken has enough tokens on its balance
    await aToken.connect(owner).mint(scaledAmount, await aToken.getAddress());

    const balanceBefore = await aToken.balanceOf(await tokenSwap.getAddress());

    //Purchase ATokens through TokenSwap contract
    await expect(tokenSwap.connect(user1).buyTokensA(tokenAmount, {value: totalCost})
    ).to.be.revertedWith("Only admin");

    await tokenSwap.connect(owner).buyTokensA(tokenAmount, {value: totalCost});

    //check that tokens are on the balance
    const balanceAfter = await aToken.balanceOf(await tokenSwap.getAddress());
    expect(balanceAfter - balanceBefore).to.equal(scaledAmount);
});
it("should check that its possible to buy B tokens", async function(){
    const tokenBamount = 10;
    const scaledAmount = ethers.parseEther(tokenBamount.toString());
    const tokenPrice = await bToken.tokenPrice(); //0.01 ETH per token
    const totalCost = tokenPrice * BigInt(tokenBamount);

    //make a sure that bToken has enough tokens on its balance
    await bToken.connect(owner).mint(scaledAmount, await bToken.getAddress());

    const tokenBBefore = await bToken.balanceOf(await tokenSwap.getAddress());

    //Purchase BTokens through TokenSwap contract
    await expect(tokenSwap.connect(user1).buyTokensB(tokenBamount, {value: totalCost})
    ).to.be.revertedWith("Only admin");

    await tokenSwap.connect(owner).buyTokensB(tokenBamount, {value : totalCost});

    //check that tokens are on the balance
    const balanceBafter = await bToken.balanceOf(await tokenSwap.getAddress());
    expect(balanceBafter-tokenBBefore).to.equal(scaledAmount);
});
it("should withdraw A tokens", async function(){
    const tokenAmount = 10;
    const scaledAmount = ethers.parseEther(tokenAmount.toString());
    const tokenPrice = await aToken.tokenPrice();
    const totalCost = tokenPrice * BigInt(tokenAmount);

    //mint
    await aToken.connect(owner).mint(ethers.parseEther("100"), await aToken.getAddress());

    //check buy tokens for tokenSwap 
    await tokenSwap.connect(owner).buyTokensA(tokenAmount, {value: totalCost});

    //check owner token balance
    const ownerBalance = await aToken.balanceOf(owner.address);
    
    //withdraw tokens
    await expect(tokenSwap.connect(owner).withdrawTokens(await aToken.getAddress(), ethers.parseEther("10"))
    ).to.emit(tokenSwap, "TokensWithdrawn").withArgs(aToken.getAddress(), ethers.parseEther("10"));

    //again check token balance of the owner and then compare
    const ownerBalance2 = await aToken.balanceOf(owner.address);
    expect(ownerBalance2).to.be.gt(ownerBalance);
});
it("should withdraw B tokens", async function(){
    const tokenAmount = 10;
    const scaledAmount = ethers.parseEther(tokenAmount.toString());
    const tokenPrice = await bToken.tokenPrice();
    const totalCost = tokenPrice * BigInt(tokenAmount);

    await bToken.connect(owner).mint(ethers.parseEther("100"), await bToken.getAddress());

    await tokenSwap.connect(owner).buyTokensB(tokenAmount, {value: totalCost});

    const ownerBalance = await bToken.balanceOf(owner.address);

    await expect(tokenSwap.connect(owner).withdrawTokens(await bToken.getAddress(), ethers.parseEther("10"))
    ).to.emit(tokenSwap, "TokensWithdrawn").withArgs(bToken.getAddress(), ethers.parseEther("10"));

    const ownerBalance2 = await bToken.balanceOf(owner.address);
    expect(ownerBalance2).to.be.gt(ownerBalance);
});
it("should withdraw ETH from A token", async function(){
    const tokenAmount = 10;
    const scaledAmount = ethers.parseEther(tokenAmount.toString());
    const tokenPrice = await aToken.tokenPrice();
    const totalCost = tokenPrice* BigInt(tokenAmount);

    //check owner balance before transaction
    const ownerETHBlalanceBefore = await ethers.provider.getBalance(owner.address);

    //mint
    await aToken.connect(owner).mint(ethers.parseEther("100"), await aToken.getAddress());
    
    //buy tokens
    await tokenSwap.connect(owner).buyTokensA(tokenAmount, {value: totalCost});

    const balanceA = await ethers.provider.getBalance(await aToken.getAddress());
    console.log("ETH на AToken:", ethers.formatEther(balanceA)); 
    const balance = await ethers.provider.getBalance(await tokenSwap.getAddress());
    console.log("ETH on balance:", ethers.formatEther(balance));

    //Step 1: Withdraw ETH from AToken to TokenSwap
    //ETH transfer from AToken to TokeSwap
    // msg.sender for AToken.withdrawETH will be TokenSwap.address
    await expect(tokenSwap.connect(owner).withdrawETHFromAToken(totalCost)
    ).to.emit(tokenSwap, "ETHWithdrawn").withArgs(totalCost);

    //Check balance ETH in AToken after first withdraw (must be 0)
    const balanceAAfterWithdraw = await ethers.provider.getBalance(await aToken.getAddress());
    expect(balanceAAfterWithdraw).to.equal(0);

    //Check balance ETH in TokenSwap after the first withdraw(must be totalCost)
    const balanceTokenSwapAfterFirstWithdraw = await ethers.provider.getBalance(await tokenSwap.getAddress());
    expect(balanceTokenSwapAfterFirstWithdraw).to.equal(totalCost);

    //Step 2: Withdraw ETH from TokenSwap to owner
    //ETH comes from TokenSwap to owner
    //msg.sender for TokenSwap.withdrawETH will be owner.address
    const tx = await tokenSwap.connect(owner).withdrawETH(totalCost); // Reteurn totalCost to owner
    const receipt = await tx.wait(); // Wait for transaction approvement to get gasUsed amount
    expect(receipt.logs.map(log => log.fragment.name)).to.include("ETHWithdrawn");
    const gasUsed = receipt.gasUsed * receipt.gasPrice; //Calculate gas price for this transaction 

    //Get the final owner balance
    const ownerETHBalanceAfter = await ethers.provider.getBalance(owner.address);

    //Check that TokenSwap ETH balance is equal 0 
    const balanceTokenSwapFinal = await ethers.provider.getBalance(await tokenSwap.getAddress());
    expect(balanceTokenSwapFinal).to.equal(0);
});
it("should withdraw ETH from B token", async function(){
    const tokenAmount = 10;
    const scaledAmount = ethers.parseEther(tokenAmount.toString());
    const tokenPrice = await bToken.tokenPrice();
    const totalCost = tokenPrice* BigInt(tokenAmount);

    //check owner balance before transaction
    const ownerETHBlalanceBefore = await ethers.provider.getBalance(owner.address);

    //mint
    await bToken.connect(owner).mint(ethers.parseEther("100"), await bToken.getAddress());
    
    //buy tokens
    await tokenSwap.connect(owner).buyTokensB(tokenAmount, {value: totalCost});

    const balanceB = await ethers.provider.getBalance(await bToken.getAddress());
    console.log("ETH на BToken:", ethers.formatEther(balanceB)); 
    const balance = await ethers.provider.getBalance(await tokenSwap.getAddress());
    console.log("ETH on balance:", ethers.formatEther(balance));

    //Step 1: Withdraw ETH from AToken to TokenSwap
    //ETH transfer from AToken to TokeSwap
    // msg.sender for AToken.withdrawETH will be TokenSwap.address
    await expect(tokenSwap.connect(owner).withdrawETHFromBToken(totalCost)
    ).to.emit(tokenSwap, "ETHWithdrawn").withArgs(totalCost);

    //Check balance ETH in AToken after first withdraw (must be 0)
    const balanceBAfterWithdraw = await ethers.provider.getBalance(await bToken.getAddress());
    expect(balanceBAfterWithdraw).to.equal(0);

    //Check balance ETH in TokenSwap after the first withdraw(must be totalCost)
    const balanceTokenSwapAfterFirstWithdraw = await ethers.provider.getBalance(await tokenSwap.getAddress());
    expect(balanceTokenSwapAfterFirstWithdraw).to.equal(totalCost);

    //Step 2: Withdraw ETH from TokenSwap to owner
    //ETH comes from TokenSwap to owner
    //msg.sender for TokenSwap.withdrawETH will be owner.address
    const tx = await tokenSwap.connect(owner).withdrawETH(totalCost); // Reteurn totalCost to owner
    const receipt = await tx.wait(); // Wait for transaction approvement to get gasUsed amount
    expect(receipt.logs.map(log => log.fragment.name)).to.include("ETHWithdrawn");
    const gasUsed = receipt.gasUsed * receipt.gasPrice; //Calculate gas price for this transaction 

    //Get the final owner balance
    const ownerETHBalanceAfter = await ethers.provider.getBalance(owner.address);

    //Check that TokenSwap ETH balance is equal 0 
    const balanceTokenSwapFinal = await ethers.provider.getBalance(await tokenSwap.getAddress());
    expect(balanceTokenSwapFinal).to.equal(0);
});
it("should check that its possible to change admin",async function(){
    const newOwner = await user1.address;
    const oldAdmin = await tokenSwap.admin();
    expect(oldAdmin).to.equal(owner.address);

    await expect(tokenSwap.connect(owner).changeAdmin(ethers.ZeroAddress)
    ).to.be.revertedWith("cannot be 0 address");
    await expect(tokenSwap.connect(user2).changeAdmin(newOwner)
    ).to.be.revertedWith("Only admin");

    await expect(tokenSwap.connect(owner).changeAdmin(newOwner)
    ).to.emit(tokenSwap, "AdminChanged").withArgs(oldAdmin, newOwner);

    const updatedOwner = await tokenSwap.admin();
    expect(updatedOwner).to.equal(newOwner);
});
});