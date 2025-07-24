import { ethers } from 'ethers';
import {
  tokenSwapAddress,
  aTokenAddress,
  bTokenAddress,
  tokenSwapAbi,
  erc20MinimalAbi // Используем erc20MinimalAbi для базовых ERC20 функций
} from './constants/contractABI'; // Убедись, что эти импорты верны

let provider;
let _signer; // Переименовал глобальный signer, чтобы избежать путаницы с локальными переменными

// Инициализация провайдера и получение глобального signer
export async function initProvider() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    // НЕ ВЫЗЫВАЕМ eth_requestAccounts ЗДЕСЬ!
    // Его будет вызывать App.jsx через requestAccounts()
    _signer = provider.getSigner(); // Получаем signer, но его аккаунт может быть не подключен
  } else {
    // Вместо alert, лучше выбросить ошибку или вернуть false, чтобы App.jsx мог обработать
    throw new Error('MetaMask is not installed or not available.');
  }
}

// Возвращает провайдер
export function getProvider() {
  if (!provider) {
    console.warn("Provider not initialized. Call initProvider() first.");
    // Лучше выбросить ошибку, если провайдер не инициализирован,
    // чтобы компоненты могли поймать это.
    throw new Error("Provider not initialized.");
  }
  return provider;
}

// Возвращает глобальный signer
export function getSigner() {
  if (!_signer) {
    console.warn("Signer not available. Ensure initProvider() was called and a wallet is connected.");
    // Лучше выбросить ошибку, если signer не инициализирован.
    throw new Error("Signer not available.");
  }
  return _signer;
}

// НОВАЯ ФУНКЦИЯ: Запрашивает аккаунты у MetaMask
export async function requestAccounts() {
    if (!provider) {
        throw new Error("Web3 provider not initialized. Call initProvider() first.");
    }
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        // После успешного подключения, обновим глобальный signer
        _signer = provider.getSigner();
        return accounts;
    } catch (error) {
        console.error("Error requesting accounts from MetaMask:", error);
        throw error; // Перебросить ошибку для обработки в App.jsx
    }
}


// Функции для получения контрактов. Теперь они ПРИНИМАЮТ signer как аргумент,
// что дает гибкость и гарантирует, что контракт использует нужный signer.
// Если signer не передан, они попытаются использовать глобальный _signer.
export function getTokenSwapContract(customSigner = _signer) {
  if (!customSigner) {
    throw new Error("No signer provided or global signer not available for TokenSwap contract.");
  }
  return new ethers.Contract(tokenSwapAddress, tokenSwapAbi, customSigner);
}

export function getATokenContract(customSigner = _signer) {
  if (!customSigner) {
    throw new Error("No signer provided or global signer not available for AToken contract.");
  }
  // Используем erc20MinimalAbi, если в `constants/contractABI` у тебя нет полного AToken/BToken ABI
  // Если у тебя есть полные ABI, импортируй их и используй.
  return new ethers.Contract(aTokenAddress, erc20MinimalAbi, customSigner);
}

export function getBTokenContract(customSigner = _signer) {
  if (!customSigner) {
    throw new Error("No signer provided or global signer not available for BToken contract.");
  }
  // Аналогично для BToken
  return new ethers.Contract(bTokenAddress, erc20MinimalAbi, customSigner);
}

// Важно: erc20MinimalAbi должен быть доступен в constants/contractABI.js
// Если нет, то добавь его туда или импортируй здесь.