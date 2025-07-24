const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Параметры для токенов 
  const initialTokenPriceA = ethers.utils.parseEther("0.001"); // Цена 1 AToken = 0.001 ETH (в WEI)
  const initialTokenPriceB = ethers.utils.parseEther("0.002"); // Цена 1 BToken = 0.002 ETH (в WEI)
  // Начальный запас токенов, который будет у самих AToken/BToken для продажи через buyTokens
  const initialSupplyForTokenContract = ethers.utils.parseEther("1000000"); // 1,000,000 токенов (с 18 десятичными знаками)

  // Деплой AToken
  const ATokenFactory = await ethers.getContractFactory("AToken");
  // deployer.address теперь является _initialMinterAndAdmin
  // Он будет иметь DEFAULT_ADMIN_ROLE в AToken и сможет вызвать setTokenSwapAddress.
  const aToken = await ATokenFactory.deploy(deployer.address, initialTokenPriceA, initialSupplyForTokenContract); 
  await aToken.deployed();
  console.log("AToken deployed to:", aToken.address);

  // Деплой BToken
  const BTokenFactory = await ethers.getContractFactory("BToken");
  const bToken = await BTokenFactory.deploy(deployer.address, initialTokenPriceB, initialSupplyForTokenContract); 
  await bToken.deployed();
  console.log("BToken deployed to:", bToken.address);

  // Деплой TokenSwap 
  const TokenSwapFactory = await ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwapFactory.deploy(aToken.address, bToken.address);
  await tokenSwap.deployed();
  console.log("TokenSwap deployed to:", tokenSwap.address);

  // Установка адреса TokenSwap в AToken и BToken и предоставление MINTER_ROLE
  // Теперь, когда deployer является админом AToken/BToken, он может вызвать эти функции.
  // TokenSwap получит MINTER_ROLE в AToken/BToken.
  await aToken.setTokenSwapAddress(tokenSwap.address);
  console.log("Set TokenSwap address in AToken (granted MINTER_ROLE to TokenSwap)");
  await bToken.setTokenSwapAddress(tokenSwap.address);
  console.log("Set TokenSwap address in BToken (granted MINTER_ROLE to TokenSwap)");

  // Здесь мы хотим купить 500 токенов. Контракт `buyTokens` ожидает это число.
  const simpleNumberOfTokensToBuy = 500; 

  // Покупка AToken
  // Стоимость в ETH (в WEI) = цена одного токена (в WEI) * количество токенов (простое число)
  const costA = initialTokenPriceA.mul(simpleNumberOfTokensToBuy); 
  console.log(`Cost to buy ${simpleNumberOfTokensToBuy} AToken: ${ethers.utils.formatEther(costA)} ETH`);
  
  // В buyTokens передаем простое число токенов (например, 500),
  // контракт сам масштабирует его внутри (numberOfTokens * 10^decimals).
  await aToken.buyTokens(simpleNumberOfTokensToBuy, { value: costA }); 
  console.log(`Bought ${simpleNumberOfTokensToBuy} AToken for deployer`);
  console.log(`Deployer AToken balance: ${ethers.utils.formatEther(await aToken.balanceOf(deployer.address))}`);


  // Покупка BToken
  const costB = initialTokenPriceB.mul(simpleNumberOfTokensToBuy);
  console.log(`Cost to buy ${simpleNumberOfTokensToBuy} BToken: ${ethers.utils.formatEther(costB)} ETH`);
  await bToken.buyTokens(simpleNumberOfTokensToBuy, { value: costB });
  console.log(`Bought ${simpleNumberOfTokensToBuy} BToken for deployer`);
  console.log(`Deployer BToken balance: ${ethers.utils.formatEther(await bToken.balanceOf(deployer.address))}`);


  // Перевод токенов от deployer'а в TokenSwap для ликвидности 
  // Переводим часть купленных токенов для начальной ликвидности
  const tokensToTransferForLiquidity = ethers.utils.parseEther("200"); // 200 токенов каждого вида для ликвидности

  // Одобрение токенов для TokenSwap перед переводом
  await aToken.approve(tokenSwap.address, tokensToTransferForLiquidity);
  console.log(`Approved ${ethers.utils.formatEther(tokensToTransferForLiquidity)} AToken for TokenSwap`);
  await aToken.transfer(tokenSwap.address, tokensToTransferForLiquidity);
  console.log(`Transferred ${ethers.utils.formatEther(tokensToTransferForLiquidity)} AToken to TokenSwap for liquidity`);
  console.log(`TokenSwap AToken balance: ${ethers.utils.formatEther(await aToken.balanceOf(tokenSwap.address))}`);

  await bToken.approve(tokenSwap.address, tokensToTransferForLiquidity);
  console.log(`Approved ${ethers.utils.formatEther(tokensToTransferForLiquidity)} BToken for TokenSwap`);
  await bToken.transfer(tokenSwap.address, tokensToTransferForLiquidity);
  console.log(`Transferred ${ethers.utils.formatEther(tokensToTransferForLiquidity)} BToken to TokenSwap for liquidity`);
  console.log(`TokenSwap BToken balance: ${ethers.utils.formatEther(await bToken.balanceOf(tokenSwap.address))}`);

  // --- Установка ratio и fees ---
  await tokenSwap.setRatio(2); // 1 A = 2 B
  await tokenSwap.setFees(1);  // 1% комиссия
  console.log("Set ratio and fees in TokenSwap");

  // Вывод адресов 
  console.log("\n--- Update src/constants/contractABI.js with these addresses ---");
  console.log(`export const tokenSwapAddress = "${tokenSwap.address}";`);
  console.log(`export const aTokenAddress = "${aToken.address}";`);
  console.log(`export const bTokenAddress = "${bToken.address}";`);

  // Получить ABI (для твоих ERC20 токенов и TokenSwap)
  const tokenSwapAbi = (await ethers.getContractFactory("TokenSwap")).interface.format(ethers.utils.FormatTypes.json);
  const aTokenAbi = (await ethers.getContractFactory("AToken")).interface.format(ethers.utils.FormatTypes.json);
  const bTokenAbi = (await ethers.getContractFactory("BToken")).interface.format(ethers.utils.FormatTypes.json);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });