async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const Donation = await ethers.getContractFactory("DonationEventLog");
  const contract = await Donation.deploy();
  await contract.deployed();

  console.log("DonationEventLog deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});