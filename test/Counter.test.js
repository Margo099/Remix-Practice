const { expect } = require("chai");

describe("Counter", function () {
    let counter;

    beforeEach (async function() {
        const Counter = await ethers.getContractFactory("Counter");
        counter = await Counter.deploy();
        await counter.deployed();
    });
it("должен начинаться с 0", async function() {
    expect(await counter.count()).to.equal(0);
});
it("увеличивает счетчик", async function() {
    await counter.increment();
    expect(await counter.count()).to.equal(1);
});
it("уменьшает на 1", async function(){
    await counter.increment();
    await counter.decrement();
    expect(await counter.count()).to.equal(0);
});
it("не дает уйти в минус", async function(){
    await expect(counter.count()).to.be.revertedWith("count must be > 0");
});
it("обнуляет счетчик", async function() {
    await counter.increment();
    await counter.reset();
    expect(await counter.count()).to.equal(0);
});
});