// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage"); 


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.29", // версия Solidity
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: { 
    hardhat: {
      mining: {
        auto: false,     // Отключаем майнинг по требованию
        interval: 1000   // Генерировать новый блок каждые 1000 мс (1 секунда)
      }
    },
    localhost: { //localhost, чтобы явно ссылаться на него в скрипте деплоя
      url: "http://127.0.0.1:8545", // Адрес, на котором Hardhat Network слушает
      chainId: 31337, // Chain ID для Hardhat Network
      // accounts: [/* если нужно указать конкретные аккаунты для localhost */]
    }
  },
  coverage: {
    exclude: [
      "contracts/ProxyLibrary.sol", 
      "contracts/ILibraryStorage.sol",
    ],
  }
};