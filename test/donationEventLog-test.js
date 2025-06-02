const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("DonationEventLog", function () {
    let owner, donationAmount, user, donationeventlog, snapshotId;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        const DonationEventLog = await ethers.getContractFactory("DonationEventLog");
        donationAmount = ethers.parseEther("10");
        donationeventlog = await DonationEventLog.deploy();

        snapshotId = await network.provider.send("evm_snapshot");
    });
afterEach(async function () {
        await network.provider.send("evm_revert", [snapshotId]);
    });
it("should check if donation goes well", async function() {
    const _message = "Thank you";

    await expect(
  donationeventlog.connect(user).donate(_message, { value: donationAmount })
).to.emit(donationeventlog, "NewDonation").withArgs(
  user.address, donationAmount, _message, anyValue
);

    //check if amount is 0 or less
    await expect(donationeventlog.donate(_message, {value : 0})
).to.be.revertedWith("Need some ETH");
});
it("should push new donation into donations[]", async function(){
    const _message = "Thank you"

    await donationeventlog.connect(user).donate(_message, {value : donationAmount});
    const donations = await donationeventlog.getAllDonations();
    expect(donations.length).to.equal(1);

    //check the struct
    expect(donations[0].sender).to.equal(user.address);
    expect(donations[0].amount).to.equal(donationAmount);
    expect(donations[0].message).to.equal("Thank you");
    expect(donations[0].timestamp).to.be.a("bigint");
});
// should push several donations into donations[]", async function (){
it("should push several donations into donations[] ", async function (){
    const _message = "Test";
    await donationeventlog.connect(user).donate(_message, {value : donationAmount});
    await donationeventlog.connect(user).donate(_message, {value : donationAmount});

    const donations = await donationeventlog.getAllDonations();
    expect(donations.length).to.equal(2);

    for(let i =0; i < donations.length; i++) {
        expect(donations[i].sender).to.be.properAddress;
        expect(donations[i].amount).to.be.gt(0);
    }
});
it("should withdraw to owner", async function() {
    const _message = "Withdrawal Test";
    const amountToWithdraw = await ethers.parseEther("10");
   
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    //sending donation
    await donationeventlog.connect(user).donate(_message, {value : donationAmount});
    let contractBalance = await ethers.provider.getBalance(donationeventlog.target);
    expect(contractBalance).to.equal(donationAmount);
    
    //withdraw
    await expect(donationeventlog.connect(user).withdrawAll(amountToWithdraw)).to.be.revertedWith("You are not the owner!");
    await expect(donationeventlog.connect(owner).withdrawAll(ethers.parseEther("0"))).to.be.revertedWith("need ETH");
    await expect(donationeventlog.connect(owner).withdrawAll(ethers.parseEther("20"))).to.be.revertedWith("wrong amount");
    await donationeventlog.connect(owner).withdrawAll(amountToWithdraw);
    
    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    contractBalance = await ethers.provider.getBalance(donationeventlog.target);
    expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
});
});

