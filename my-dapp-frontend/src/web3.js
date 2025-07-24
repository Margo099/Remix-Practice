// src/web3.js
import { ethers } from 'ethers';
import {
  tokenSwapAddress,
  aTokenAddress,
  bTokenAddress,
  tokenSwapAbi,
  erc20MinimalAbi 
} from './constants/contractABI'; 

let provider;
let _signer; 

export async function initProvider() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    // _signer будет получен через getSigner() после запроса аккаунтов.
    // НЕ ВЫЗЫВАЕМ eth_requestAccounts ЗДЕСЬ!
  } else {
    throw new Error('MetaMask is not installed or not available.');
  }
}

export function getProvider() {
  // Возвращаем провайдер, если он инициализирован.
  // Если нет, это указывает на то, что initProvider не был вызван или провалился.
  if (!provider) {
    console.warn("Provider not initialized. Call initProvider() first in App.jsx's useEffect.");
    return undefined; // Возвращаем undefined, чтобы компоненты могли обработать это состояние
  }
  return provider;
}

export function getSigner() {
  // _signer устанавливается после успешного requestAccounts
  if (!_signer) {
    console.warn("Signer not available. Ensure initProvider() was called and a wallet is connected and accounts requested.");
    // Для операций, требующих подписи, лучше выбросить ошибку
    throw new Error("Signer not available."); 
  }
  return _signer;
}

export async function requestAccounts() {
    if (!provider) {
        throw new Error("Web3 provider not initialized. Call initProvider() first.");
    }
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        // После успешного запроса аккаунтов, устанавливаем _signer
        _signer = provider.getSigner();
        return accounts;
    } catch (error) {
        console.error("Error requesting accounts from MetaMask:", error);
        throw error; 
    }
}

// Функции для получения контрактов. Принимают signer ИЛИ provider.
// Это позволяет использовать их как для чтения (provider), так и для записи (signer).
// Если signerOrProvider не передан, пытаемся использовать глобальные _signer или provider.
export function getTokenSwapContract(signerOrProvider) { 
  const currentSignerOrProvider = signerOrProvider || _signer || provider;
  if (!currentSignerOrProvider) {
    throw new Error("No signer/provider provided or global not available for TokenSwap contract.");
  }
  return new ethers.Contract(tokenSwapAddress, tokenSwapAbi, currentSignerOrProvider);
}

export function getATokenContract(signerOrProvider) { 
  const currentSignerOrProvider = signerOrProvider || _signer || provider;
  if (!currentSignerOrProvider) {
    throw new Error("No signer/provider provided or global not available for AToken contract.");
  }
  return new ethers.Contract(aTokenAddress, erc20MinimalAbi, currentSignerOrProvider);
}

export function getBTokenContract(signerOrProvider) { 
  const currentSignerOrProvider = signerOrProvider || _signer || provider;
  if (!currentSignerOrProvider) {
    throw new Error("No signer/provider provided or global not available for BToken contract.");
  }
  return new ethers.Contract(bTokenAddress, erc20MinimalAbi, currentSignerOrProvider);
}