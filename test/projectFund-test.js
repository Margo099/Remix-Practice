const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("ProjectFund", function(){
    let projectfund, owner, user, snapshotId, donationAmount;
beforeEach(async function(){
    [owner, user] = await ethers.getSigners();

    const ProjectFund = await ethers.getContractFactory("ProjectFund");
    donationAmount = ethers.parseEther("10");
    projectfund = await ProjectFund.deploy();

    snapshotId = await network.provider.send("evm_snapshot");
});
afterEach(async function(){
    await network.provider.send("evm_revert", [snapshotId]);
});
it("should be possible to donate to project", async function(){
    const _projectName = "coffee fund";
    const _message = "Hey";
    
    //check if value is 0
    await expect(projectfund.connect(user).donateToProject(_projectName, _message, {value: ethers.parseEther("0")})
    ).to.be.revertedWith("u need to have ETH");

    //make donation to project
    await expect(projectfund.connect(user).donateToProject(_projectName, _message, {value: donationAmount})
    ).to.emit(projectfund, "newDonation").withArgs(_projectName, donationAmount, user.address, _message, anyValue);

    //chec the struct
    const donations = await projectfund.connect(owner).getProjectDonations(_projectName);
    expect(donations.length).to.equal(1);
    expect(donations[0].projectName).to.equal("coffee fund");
    expect(donations[0].amount).to.equal(donationAmount);
    expect(donations[0].sender).to.equal(user.address);
    expect(donations[0].message).to.equal("Hey");
    expect(donations[0].timestamp).to.be.a("bigint");

    //check project total
    const projectTotal = await projectfund.connect(owner).getProjectTotal(_projectName);
    expect(projectTotal).to.equal(donationAmount);
});
it("should make donation to several projects", async function() {
    const _projectName = "Test project";
    const _message = "Message";
    const _projectName1 = "Test project1";
    const _message1 = "Message1";
    const donationAmount1 = ethers.parseEther("30");

    //make donation to project 1
    await projectfund.connect(user).donateToProject(_projectName, _message, {value: donationAmount});

    //make donation to project 2
    await projectfund.connect(owner).donateToProject(_projectName1, _message1, {value: donationAmount1});

    //check the balance on projects
    const projectTotal = await projectfund.connect(owner).getProjectTotal(_projectName);
    expect(projectTotal).to.equal(donationAmount);

    const projectTotal1 = await projectfund.connect(owner).getProjectTotal(_projectName1);
    expect(projectTotal1).to.equal(donationAmount1);

    //donate to project again
    await projectfund.connect(user).donateToProject(_projectName, _message, {value: donationAmount});

    //check that total balance is greater now
    const projectTotalAfter2Donation = await projectfund.connect(user).getProjectTotal(_projectName);
    expect(projectTotalAfter2Donation).to.equal(donationAmount+donationAmount);

    //check the length of project Donations
    const projectDonations = await projectfund.connect(owner).getProjectDonations(_projectName);
    expect(projectDonations.length).to.equal(2);
});
it("should withdraw funds to owner", async function(){
    const _projectName = "Presents";
    const _message = "Test";
    const amountToWithdraw = await ethers.parseEther("5");
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    //donate to withdraw after
    await projectfund.connect(user).donateToProject(_projectName, _message, {value: donationAmount});
    const contractBalanceBefore = await ethers.provider.getBalance(projectfund.target);
    expect(contractBalanceBefore).to.equal(donationAmount);

    //user try to withdraw, try to withdraw 0 and try to withdraw more then it is on contract
    await expect(projectfund.connect(user).withdraw(amountToWithdraw)
    ).to.be.revertedWith("u need to be an owner!");
    await expect(projectfund.connect(owner).withdraw(ethers.parseEther("0"))
    ).to.be.revertedWith("need ETH");
    await expect(projectfund.connect(owner).withdraw(ethers.parseEther("50"))
    ).to.be.revertedWith("low amount on contract to withdraw");

    //successful withdraw
    await projectfund.connect(owner).withdraw(amountToWithdraw);

    //check balances
    const contractBalanceAfter = await ethers.provider.getBalance(projectfund.target);
    expect(contractBalanceBefore).to.be.gt(contractBalanceAfter);

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
});
});