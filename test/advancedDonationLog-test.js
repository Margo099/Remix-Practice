const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AdvancedDonationLog", function(){
    let owner, user, totalSent, advanceddonationlog, snapshotId, donationAmount;
    
beforeEach(async function(){

    [owner, user] = await ethers.getSigners();
    const AdvancedDonationLog = await ethers.getContractFactory("AdvancedDonationLog");
    donationAmount = ethers.parseEther("10");
    advanceddonationlog = await AdvancedDonationLog.deploy();

    snapshotId = await network.provider.send("evm_snapshot");
});
this.afterEach(async function(){
    await network.provider.send("evm_revert", [snapshotId]);
});
it("should check if donation is processed right", async function(){
    const _message = "Thank you";
    
    //check if value 0
    await expect(advanceddonationlog.connect(user).donate(_message, {value: ethers.parseEther("0")})
    ).to.be.revertedWith("u need to have some ETH");

    //make donation 
    
    await advanceddonationlog.connect(user).donate(_message, {value: donationAmount});
    const donations = await advanceddonationlog.getAllDonation();
    expect(donations.length).to.equal(1);

    //check the struct
    expect(donations[0].sender).to.equal(user.address);
    expect(donations[0].amount).to.equal(donationAmount);
    expect(donations[0].message).to.equal("Thank you");
    expect(donations[0].timestamp).to.be.a("bigint");

    //check total send
    const totalSent = await advanceddonationlog.connect(user).getMyDonation();
    expect(totalSent).to.equal(donationAmount);

    //check if event is emited
    await expect(advanceddonationlog.connect(user).donate(_message, {value: donationAmount})
    ).to.emit(advanceddonationlog, "NewDonation").withArgs(
    user.address, donationAmount, _message, anyValue);
});
// should push several donations into donations[]", async function (){
it("should push several donations into donations[] ", async function (){
    const _message = "Test";
    await advanceddonationlog.connect(user).donate(_message, { value: donationAmount});
    await advanceddonationlog.connect(user).donate(_message, { value: donationAmount});

    const donations = await advanceddonationlog.getAllDonation();
    expect(donations.length).to.equal(2);

});
it("should withdraw correctly", async function (){
    const _message = "Withdraw test";
    const amountToWithdraw = await ethers.parseEther("10");
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    //donate to be able to withdraw
    await advanceddonationlog.connect(user).donate(_message, {value : donationAmount});
    let contractBalance = await ethers.provider.getBalance(advanceddonationlog.target);
    expect(contractBalance).to.be.equal(donationAmount);

    //user try to withdraw
    await expect(advanceddonationlog.connect(user).withdrawAll(amountToWithdraw)
).to.be.revertedWith("U must be an owner!");
    await expect(advanceddonationlog.connect(owner).withdrawAll(ethers.parseEther("0"))
).to.be.revertedWith("need ETH");
    await expect(advanceddonationlog.connect(owner).withdrawAll(ethers.parseEther("20"))
).to.be.revertedWith("wrong amount");
    
    await advanceddonationlog.connect(owner).withdrawAll(amountToWithdraw);
    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    
});
});
