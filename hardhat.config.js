require("@nomicfoundation/hardhat-toolbox");
require("hardhat-coverage");

module.exports = {
  solidity: "0.8.29",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};