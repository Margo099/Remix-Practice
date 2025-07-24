import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { tokenSwapAddress, erc20MinimalAbi } from '../constants/contractABI'; 
import { getTokenSwapContract, getATokenContract, getBTokenContract } from '../web3';


// Принимаем signer, account, web3Provider и refreshStatus, а также setGlobalLoading/setGlobalStatusMessage
const TokenSwapForm = ({ signer, account, web3Provider, refreshStatus, setGlobalLoading, setGlobalStatusMessage }) => {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('AtoB');
  const [status, setStatus] = useState('');
  const [tokenPriceA, setTokenPriceA] = useState(null); 
  const [tokenPriceB, setTokenPriceB] = useState(null); 
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false); // Инициализировано как false


  useEffect(() => {
    async function loadTokenData() {
        if (!web3Provider) {
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
            console.error("Не удалось загрузить данные токенов (цены):", error);
            setStatus(`❌ Не удалось загрузить цены токенов. Проверьте контракт: ${error.reason || error.message}`);
            setTokenPriceA(null); 
            setTokenPriceB(null);
        } finally {
            setLoadingPrices(false);
        }
    }
    loadTokenData();
  }, [web3Provider]);

  const handleSwap = async () => {
    if (!signer || !account) {
      setStatus("❌ Пожалуйста, сначала подключите свой кошелек.");
      return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus("❌ Пожалуйста, введите действительное количество.");
      return;
    }

    setIsLoadingOperation(true); // Начало загрузки операции
    setStatus('🔄 Выполняется обмен...');
    try {
      const tokenSwap = getTokenSwapContract(signer);
      const fromToken = direction === 'AtoB' ? getATokenContract(signer) : getBTokenContract(signer);

      const amountParsed = ethers.utils.parseUnits(amount, 18); // Используем 18 decimals для ERC20

      // Проверяем и одобряем, если нужно
      const allowance = await fromToken.allowance(account, tokenSwapAddress);
      if (allowance.lt(amountParsed)) {
        setStatus(`🔄 Одобрение ${direction === 'AtoB' ? 'AToken' : 'BToken'} для обмена...`);
        const approveTx = await fromToken.approve(tokenSwapAddress, ethers.constants.MaxUint256); 
        await approveTx.wait();
      }

      setStatus(`🔄 Выполнение обмена ${direction}...`);
      const tx = direction === 'AtoB'
        ? await tokenSwap.swapTKA(amountParsed)
        : await tokenSwap.swapTKB(amountParsed);

      await tx.wait();
      setStatus('✅ Обмен завершен!');
      setAmount(''); 
      refreshStatus(); 
    } catch (err) {
      console.error('Обмен не удался:', err);
      let errorMessage = 'Обмен не удался';
      if (err.reason) {
          errorMessage += `: ${err.reason}`;
      } else if (err.data && err.data.message) {
          errorMessage += `: ${err.data.message}`;
      } else if (err.message) {
          errorMessage += `: ${err.message}`;
      }
      setStatus(`❌ ${errorMessage}`);
    } finally {
      setIsLoadingOperation(false); // Конец загрузки операции
    }
  };

  return (
    <div className="swap-form">
      <h3>💱 Обмен Токенов</h3> 
      
      <div className="input-group">
        <label>
          Направление обмена:
          <select value={direction} onChange={e => setDirection(e.target.value)} disabled={!signer || isLoadingOperation}>
            <option value="AtoB">Токен A → Токен B</option>
            <option value="BtoA">Токен B → Токен A</option>
          </select>
        </label>
      </div>

      <div className="input-group">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Введите количество"
          disabled={!signer || isLoadingOperation} /* Отключаем поле во время загрузки */
        />
      </div>

      <div className="button-group">
        <button 
          onClick={handleSwap} 
          disabled={!signer || isLoadingOperation} /* Отключаем кнопку во время загрузки */
          className={isLoadingOperation ? 'loading' : ''} /* Добавляем класс 'loading' */
        >
          <span className={isLoadingOperation ? 'hidden' : ''}>Обменять</span>
          <div className="loader"></div> {/* Спиннер */}
        </button>
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapForm;
