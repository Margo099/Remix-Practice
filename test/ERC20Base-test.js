const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Base", function() {
    let owner, user1, user2;
    let ERC20Base, token;
    const initialSupply = ethers.parseEther("1000");
beforeEach(async function(){
    [owner, user1, user2] = await ethers.getSigners(); 
    ERC20Base = await ethers.getContractFactory("ERC20Base");
    token = await ERC20Base.deploy("TestToken", "TTK", initialSupply, owner.address);
    await token.waitForDeployment();
});
describe("deployment", function(){
    it("should set correct name and symbol", async function(){
        expect(await token.name()).to.equal("TestToken");
        expect(await token.symbol()).to.equal("TTK");
    });
    it("should assign total supply to exchanger", async function(){
        expect(await token.totalSupply()).to.equal(initialSupply);
        expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });
});
describe("transfer", function(){
    it("should transfer tokens from user1 to user2", async function(){
        await token.transfer(user1.address, ethers.parseEther("100"));
        expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });
    it("should fail if there is no tokens on user account", async function(){
        await expect(token.connect(user1).transfer(user2.address, ethers.parseEther("1"))
        ).to.be.revertedWith("You have too low amount of tokens");
    });
});
describe("approve and transferFrom", function(){
    it("should approve allowence correctly", async function(){
        await token.approve(user1.address, ethers.parseEther("50"));
        expect(await token.allowance(owner.address, user1.address)).to.equal(ethers.parseEther("50"));
    });
    it("should transferFrom with allowence correctly", async function(){
        await token.approve(user1.address, ethers.parseEther("50"));
        await token.connect(user1).transferFrom(owner.address, user2.address, ethers.parseEther("30"));
        expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("30"));
        expect(await token.allowance(owner.address, user1.address)).to.equal(ethers.parseEther("20"));
    });
    it("should fail transferFrom if allowance too low", async function(){
        await expect(token.connect(user1).transferFrom(owner.address, user2.address, ethers.parseEther("1")
        )).to.be.revertedWith("Allowance too low");
    });
});
describe("mint", function(){
    it("should mint tokens to address with MINTER_ROLE", async function(){
        const amount = ethers.parseEther("100");
        await token.mint(amount, user1.address);
        expect(await token.balanceOf(user1.address)).to.equal(amount);
        expect(await token.totalSupply()).to.equal(initialSupply + amount);
    });
     it("Should fail mint if no MINTER_ROLE", async () => {
      const amount = ethers.parseEther("100");
      await expect(token.connect(user1).mint(amount, user1.address)
        ).to.be.reverted;
});
});
describe("burn tokens", function(){
    it("should burn tokens", async function(){
        const amount = ethers.parseEther("100");
        await token.burn(amount);
        expect(await token.balanceOf(owner.address)).to.equal(initialSupply - amount);
    });
    it("should fail burn if amount is too low", async function(){
        await token.transfer(user1.address, ethers.parseEther("10"));
        await expect(token.connect(user1).burn(ethers.parseEther("20"))
        ).to.be.revertedWith("Not enough tokens to burn");
    });
});
describe("events", function () {
    it("Should emit Transfer event on transfer", async () => {
      await expect(
        token.transfer(user1.address, ethers.parseEther("50"))
      ).to.emit(token, "Transfer").withArgs(owner.address, user1.address, ethers.parseEther("50"));
    });
    it("Should emit Approval event on approve", async () => {
      await expect(token.approve(user1.address, ethers.parseEther("50"))
      ).to.emit(token, "Approval").withArgs(owner.address, user1.address, ethers.parseEther("50"));
    });
  });
});

