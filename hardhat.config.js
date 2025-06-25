// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage"); 

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.29",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  coverage: {
    exclude: [
      "contracts/ProxyLibrary.sol", // Точный путь и регистр
      "contracts/ILibraryStorage.sol", // Точный путь и регистр
    ],
  }
};