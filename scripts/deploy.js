const { ethers } = require("hardhat");

async function main() {
 const [deployer] = await ethers.getSigners();
console.log("Deploying contracts with account:", deployer.address);

// --- Параметры для токенов ---
  const initialTokenPriceA = ethers.utils.parseEther("0.001");
  const initialTokenPriceB = ethers.utils.parseEther("0.002");
  const initialSupplyForTokenContract = ethers.utils.parseEther("1000000"); // Этот запас будет у самих AToken/BToken для продажи
    const initialSupplyForDeployer = ethers.utils.parseEther("100000"); // Или сколько deployer должен получить изначально

  // --- Деплой AToken ---
    // Здесь _initialMinterAndAdmin - это TokenSwap.address, чтобы он мог минтить,
    // а _initialSupply будет у самого AToken для buyTokens
  const ATokenFactory = await ethers.getContractFactory("AToken");
  const aToken = await ATokenFactory.deploy(ethers.constants.AddressZero, initialTokenPriceA, initialSupplyForTokenContract); // Передаем 0-адрес, так как MINTER_ROLE получит TokenSwap позднее
  await aToken.deployed();
  console.log("AToken deployed to:", aToken.address);

  // --- Деплой BToken ---
  const BTokenFactory = await ethers.getContractFactory("BToken");
  const bToken = await BTokenFactory.deploy(ethers.constants.AddressZero, initialTokenPriceB, initialSupplyForTokenContract); // Передаем 0-адрес, так как MINTER_ROLE получит TokenSwap позднее
  await bToken.deployed();
  console.log("BToken deployed to:", bToken.address);

  // --- Деплой TokenSwap ---
  const TokenSwapFactory = await ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwapFactory.deploy(aToken.address, bToken.address);
  await tokenSwap.deployed();
  console.log("TokenSwap deployed to:", tokenSwap.address);

  // --- Установка адреса TokenSwap в AToken и BToken и предоставление MINTER_ROLE ---
    // Это теперь делает TokenSwap минтером для этих токенов.
    // Если ты изначально минтил supply на сам токен-контракт,
    // то buyTokens будет работать.
    // Если ты изначально минтил supply на TokenSwap, то эти токены будут для ликвидности.
    // Определись с моделью. Моя текущая рекомендация: `initialSupplyForTokenContract`
    // для баланса токена, а для ликвидности свапа — отдельные минтинги или трансферы.
    
  await aToken.setTokenSwapAddress(tokenSwap.address);
  console.log("Set TokenSwap address in AToken (granted MINTER_ROLE to TokenSwap)");
  await bToken.setTokenSwapAddress(tokenSwap.address);
  console.log("Set TokenSwap address in BToken (granted MINTER_ROLE to TokenSwap)");

  // --- Покупка токенов через buyTokens для deployer (теперь это должно работать,
  // т.к. токены будут на балансе AToken/BToken после развертывания) ---
  const tokensToBuyCount = 500000;

  // Покупка AToken
  const costA = initialTokenPriceA.mul(tokensToBuyCount);
  await aToken.buyTokens(tokensToBuyCount, { value: costA });
  console.log(`Bought ${tokensToBuyCount} AToken for deployer`);

  // Покупка BToken
  const costB = initialTokenPriceB.mul(tokensToBuyCount);
  await bToken.buyTokens(tokensToBuyCount, { value: costB });
  console.log(`Bought ${tokensToBuyCount} BToken for deployer`);

  // --- Перевод токенов от deployer'а в TokenSwap для ликвидности ---
  const tokensToTransferForLiquidity = ethers.utils.parseEther((tokensToBuyCount / 2).toString()); // Переведем половину купленных токенов

    // Одобрение токенов для TokenSwap перед переводом
    await aToken.approve(tokenSwap.address, tokensToTransferForLiquidity);
    console.log(`Approved ${ethers.utils.formatEther(tokensToTransferForLiquidity)} AToken for TokenSwap`);
  await aToken.transfer(tokenSwap.address, tokensToTransferForLiquidity);
  console.log(`Transferred ${ethers.utils.formatEther(tokensToTransferForLiquidity)} AToken to TokenSwap for liquidity`);

    await bToken.approve(tokenSwap.address, tokensToTransferForLiquidity);
    console.log(`Approved ${ethers.utils.formatEther(tokensToTransferForLiquidity)} BToken for TokenSwap`);
  await bToken.transfer(tokenSwap.address, tokensToTransferForLiquidity);
  console.log(`Transferred ${ethers.utils.formatEther(tokensToTransferForLiquidity)} BToken to TokenSwap for liquidity`);

  // --- Установка ratio и fees ---
  await tokenSwap.setRatio(2); // 1 A = 2 B
  await tokenSwap.setFees(1);  // 1% комиссия
  console.log("Set ratio and fees in TokenSwap");

  // --- Вывод адресов ---
  console.log("\n--- Update tokenSwapABIs.js with these addresses ---");
  console.log(`export const tokenSwapAddress = "${tokenSwap.address}";`);
  console.log(`export const aTokenAddress = "${aToken.address}";`);
  console.log(`export const bTokenAddress = "${bToken.address}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
