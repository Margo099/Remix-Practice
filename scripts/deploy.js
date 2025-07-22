const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // --- 1. Деплой AToken ---
  console.log("\nDeploying AToken...");
  const ATokenFactory = await hre.ethers.getContractFactory("AToken");

  const initialMinterAndAdmin = deployer.address;
  
  // *** ИЗМЕНЕНИЕ ЗДЕСЬ: Используем BigInt для _tokenPrice ***
  // Если _tokenPrice в контракте - это просто uint, а не WEI,
  // то можно задать его как BigInt или Number, если оно не слишком большое
  // Например, если 1 AToken стоит 1000 единиц чего-то:
  const tokenAPrice = 1000n; // Используем BigInt (n на конце) для больших целых чисел

  // Если вы все же хотите использовать 0.000001 ETH как цену, то это будет 10^12 WEI.
  // Возможно, проблема была в том, что parseEther пытался "разрешить" адрес, а не число.
  // Давайте попробуем явное преобразование в BigInt, если Hardhat не справляется с parseEther.
  // const tokenAPrice = 1_000_000_000_000n; // 10^12 WEI (0.000001 ETH)

  const aToken = await ATokenFactory.deploy(initialMinterAndAdmin, tokenAPrice);
  await aToken.waitForDeployment();
  const aTokenAddress = await aToken.target;
  console.log("AToken deployed to:", aTokenAddress);

  // --- 2. Деплой BToken ---
  console.log("\nDeploying BToken...");
  const BTokenFactory = await hre.ethers.getContractFactory("BToken");
  
  // Аналогично для BToken, если у него такой же конструктор
  const initialBTokenMinterAndAdmin = deployer.address;
  const tokenBPrice = 2000n; // Пример цены для BToken

  const bToken = await BTokenFactory.deploy(initialBTokenMinterAndAdmin, tokenBPrice);
  await bToken.waitForDeployment();
  const bTokenAddress = await bToken.target;
  console.log("BToken deployed to:", bTokenAddress);


  // --- 3. Деплой TokenSwap, используя адреса AToken и BToken ---
  console.log("\nDeploying TokenSwap...");
  const TokenSwapFactory = await hre.ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwapFactory.deploy(aTokenAddress, bTokenAddress);
  await tokenSwap.waitForDeployment();
  const tokenSwapAddress = await tokenSwap.target;
  console.log("TokenSwap deployed to:", tokenSwapAddress);

  // --- Дополнительные настройки для TokenSwap ---
  const initialRatio = 100;
  const initialFees = 2; // 2%

  console.log(`\nSetting initial ratio to ${initialRatio} and fees to ${initialFees}% for TokenSwap...`);
  await tokenSwap.setRatio(initialRatio);
  await tokenSwap.setFees(initialFees);
  console.log("Initial settings applied.");

  // --- Важно: Запишите эти адреса для фронтенда ---
  console.log("\n--- CONTRACT ADDRESSES FOR FRONTEND ---");
  console.log("AToken Address:", aTokenAddress);
  console.log("BToken Address:", bTokenAddress);
  console.log("TokenSwap Address:", tokenSwapAddress);
  console.log("---------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
