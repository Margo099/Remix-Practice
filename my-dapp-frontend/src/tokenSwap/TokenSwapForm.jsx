// src/TokenSwap/TokenSwapForm.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { tokenSwapAddress, erc20MinimalAbi } from '../constants/contractABI'; 
import { getTokenSwapContract, getATokenContract, getBTokenContract } from '../web3';


// Принимаем signer, account, web3Provider и refreshStatus
const TokenSwapForm = ({ signer, account, web3Provider, refreshStatus }) => {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('AtoB');
  const [status, setStatus] = useState('');
  // Оставляем эти состояния, так как useEffect все равно будет пытаться их загрузить
  const [tokenPriceA, setTokenPriceA] = useState(null); 
  const [tokenPriceB, setTokenPriceB] = useState(null); 
  const [loadingPrices, setLoadingPrices] = useState(false);


  useEffect(() => {
    async function loadTokenData() {
        if (!web3Provider) { // Используем web3Provider для чтения
            setLoadingPrices(false);
            return;
        }
        setLoadingPrices(true);
        try {
            const aTokenContract = getATokenContract(web3Provider); 
            const bTokenContract = getBTokenContract(web3Provider); 
            
            const priceA = await aTokenContract.tokenPrice(); 
            const priceB = await bTokenContract.tokenPrice(); 

            setTokenPriceA(priceA);
            setTokenPriceB(priceB);
            setStatus(''); 
        } catch (error) {
            console.error("Failed to load token data (prices):", error);
            setStatus(`❌ Failed to load token prices. Check contract: ${error.reason || error.message}`);
            setTokenPriceA(null); 
            setTokenPriceB(null);
        } finally {
            setLoadingPrices(false);
        }
    }
    loadTokenData();
  }, [web3Provider]); // Зависимость от web3Provider

  const handleSwap = async () => {
    if (!signer || !account) {
      setStatus("❌ Please connect your wallet first.");
      return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus("❌ Please enter a valid amount.");
      return;
    }

    try {
      setStatus('🔄 Swapping...');
      const tokenSwap = getTokenSwapContract(signer);
      const fromToken = direction === 'AtoB' ? getATokenContract(signer) : getBTokenContract(signer);

      const amountParsed = ethers.utils.parseUnits(amount, 18); // Используем 18 decimals для ERC20

      // Проверяем и одобряем, если нужно
      const allowance = await fromToken.allowance(account, tokenSwapAddress);
      if (allowance.lt(amountParsed)) {
        setStatus(`🔄 Approving ${direction === 'AtoB' ? 'AToken' : 'BToken'} for swap...`);
        const approveTx = await fromToken.approve(tokenSwapAddress, ethers.constants.MaxUint256); // Одобряем максимальное значение для удобства
        await approveTx.wait();
      }

      setStatus(`🔄 Executing swap ${direction}...`);
      const tx = direction === 'AtoB'
        ? await tokenSwap.swapTKA(amountParsed)
        : await tokenSwap.swapTKB(amountParsed);

      await tx.wait();
      setStatus('✅ Swap completed!');
      setAmount(''); // Очистить поле ввода
      refreshStatus(); // Обновление счетчика для TokenStatus и других компонентов
    } catch (err) {
      console.error('Swap failed:', err);
      let errorMessage = 'Swap failed';
      if (err.reason) {
          errorMessage += `: ${err.reason}`;
      } else if (err.data && err.data.message) {
          errorMessage += `: ${err.data.message}`;
      } else if (err.message) {
          errorMessage += `: ${err.message}`;
      }
      setStatus(`❌ ${errorMessage}`);
    }
  };

  // Функция handleBuyTokens 

  return (
    <div className="swap-form">
      <h3>🔁 Swap Tokens</h3> {/* Buy with ETH" из заголовка */}
      
      <div className="input-group">
        <label>
          Swap Direction:
          <select value={direction} onChange={e => setDirection(e.target.value)} disabled={!signer}>
            <option value="AtoB">A → B</option>
            <option value="BtoA">B → A</option>
          </select>
        </label>
      </div>

      <div className="input-group">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
          disabled={!signer}
        />
      </div>

      <div className="button-group">
        <button onClick={handleSwap} disabled={!signer}>Swap</button>
        {/* Кнопки "Buy A with ETH" и "Buy B with ETH"  */}
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapForm;