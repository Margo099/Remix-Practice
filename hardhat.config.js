// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage"); 
// Если вы используете dotenv для приватных ключей/RPC URL для Sepolia,
// то вам также понадобится: require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.29", // Ваша версия Solidity
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: { // <-- Добавляем секцию networks
    hardhat: {
      // Это конфигурация для локальной Hardhat Network
      mining: {
        auto: false,     // Отключаем майнинг по требованию
        interval: 1000   // Генерировать новый блок каждые 1000 мс (1 секунда)
      }
      // Если вы также хотите настроить Sepolia (как было в предыдущих примерах),
      // то вам нужно будет добавить и её здесь, а также require("dotenv").config();
      // sepolia: {
      //   url: process.env.SEPOLIA_RPC_URL,
      //   accounts: [process.env.PRIVATE_KEY],
      //   chainId: 11155111,
      // },
    },
    localhost: { // <-- Добавляем localhost, чтобы явно ссылаться на него в скрипте деплоя
      url: "http://127.0.0.1:8545", // Адрес, на котором Hardhat Network слушает
      chainId: 31337, // Chain ID для Hardhat Network
      // accounts: [/* если нужно указать конкретные аккаунты для localhost */]
    }
  },
  coverage: {
    exclude: [
      "contracts/ProxyLibrary.sol", // Точный путь и регистр
      "contracts/ILibraryStorage.sol", // Точный путь и регистр
    ],
  }
  // Если вы используете etherscan для верификации контрактов, добавьте секцию etherscan
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY || "",
  // },
};