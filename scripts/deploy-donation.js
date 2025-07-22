const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying DonationEventLog contract with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Деплой DonationEventLog
  console.log("\nDeploying DonationEventLog...");
  const DonationEventLogFactory = await hre.ethers.getContractFactory("DonationEventLog");
  // Конструктор DonationEventLog не принимает аргументов, поэтому deploy() без параметров
  const donationEventLog = await DonationEventLogFactory.deploy(); 
  await donationEventLog.waitForDeployment();
  const donationEventLogAddress = await donationEventLog.target;
  console.log("DonationEventLog deployed to:", donationEventLogAddress);
  console.log("\n--- CONTRACT ADDRESS FOR FRONTEND ---");
  console.log("DonationEventLog Address:", donationEventLogAddress);
  console.log("---------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
