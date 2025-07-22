const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log(
    "Deploying DonationEventLog contract with the account:",
    deployer.address
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log("Deploying DonationEventLog...");
  const DonationEventLogFactory = await hre.ethers.getContractFactory("DonationEventLog");

  // Запускаем деплой.
  const donationEventLog = await DonationEventLogFactory.deploy();

  // --- ВАЖНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ---
  // Дожидаемся, пока контракт будет полностью развернут и доступен.
  // Это метод для Ethers.js v5.
  await donationEventLog.deployed(); 

  // Теперь .address будет доступен после await donationEventLog.deployed()
  const contractAddress = donationEventLog.address; 
  // --- КОНЕЦ ВАЖНОГО ИЗМЕНЕНИЯ ---

  if (contractAddress) {
    console.log("DonationEventLog deployed to:", contractAddress);
    console.log("\n--- CONTRACT ADDRESS FOR FRONTEND ---");
    console.log("DonationEventLog Address:", contractAddress);
    console.log("---------------------------------------");
  } else {
    console.error("Failed to retrieve contract address after deployment.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });