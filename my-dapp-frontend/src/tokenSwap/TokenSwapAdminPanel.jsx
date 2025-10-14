import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getTokenSwapContract } from '../web3'; 
import { aTokenAddress, bTokenAddress } from '../constants/contractABI'; 


// Принимаем signer, account и refreshStatus, а также setGlobalLoading/setGlobalStatusMessage
const TokenSwapAdminPanel = ({ signer, account, refreshStatus, setGlobalLoading, setGlobalStatusMessage }) => {
  const [newRatio, setNewRatio] = useState('');
  const [newFees, setNewFees] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintToken, setMintToken] = useState('A');
  const [withdrawTokenAmount, setWithdrawTokenAmount] = useState('');
  const [withdrawTokenType, setWithdrawTokenType] = useState('A');
  const [status, setStatus] = useState('');

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ ЛОКАЛЬНОЙ ЗАГРУЗКИ ОПЕРАЦИЙ
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false); // Инициализировано как false
  const [isLoadingMint, setIsLoadingMint] = useState(false);     // Инициализировано как false
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false); // Инициализировано как false


  const handleUpdate = async () => {
    if (!signer) {
      setStatus('❌ Нет signer. Подключите кошелек.');
      return;
    }
    if (!newRatio && !newFees) {
      setStatus('❌ Введите соотношение или комиссии для обновления.');
      return;
    }

    setIsLoadingUpdate(true); // Начало загрузки
    setStatus('🔄 Обновление...');
    try {
      const contract = getTokenSwapContract(signer); 

      if (newRatio) {
        const tx = await contract.setRatio(Number(newRatio)); 
        await tx.wait();
      }
      if (newFees) {
        const tx = await contract.setFees(Number(newFees)); 
        await tx.wait();
      }

      setStatus('✅ Соотношение и комиссии обновлены');
      setNewRatio('');
      setNewFees('');
      refreshStatus(); 
    } catch (e) {
      console.error(e);
      let errorMessage = '❌ Не удалось обновить';
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    } finally {
      setIsLoadingUpdate(false); // Конец загрузки
    }
  };

  const handleMint = async () => {
    if (!signer) {
      setStatus('❌ Нет signer. Подключите кошелек.');
      return;
    }
    if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
      setStatus("❌ Введите действительное количество для выпуска.");
      return;
    }

    setIsLoadingMint(true); // Начало загрузки
    setStatus('🔄 Выпуск токенов...');
    try {
      const tokenSwapContract = getTokenSwapContract(signer); 
      
      const parsedAmount = ethers.utils.parseUnits(mintAmount, 18); 

      let tx;
      if (mintToken === 'A') {
        tx = await tokenSwapContract.mintATokensToTokenSwap(parsedAmount);
      } else { 
        tx = await tokenSwapContract.mintBTokensToTokenSwap(parsedAmount);
      }

      await tx.wait();
      setStatus(`✅ Выпущено ${mintAmount} Токен${mintToken}`);
      setMintAmount('');
      refreshStatus(); 
    } catch (e) {
      console.error(e);
      let errorMessage = '❌ Выпуск не удался';
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    } finally {
      setIsLoadingMint(false); // Конец загрузки
    }
  };

  const handleWithdrawTokens = async () => {
    if (!signer) {
      setStatus('❌ Нет signer. Подключите кошелек.');
      return;
    }
    if (!withdrawTokenAmount || isNaN(withdrawTokenAmount) || parseFloat(withdrawTokenAmount) <= 0) {
      setStatus("❌ Введите действительное количество токенов для вывода.");
      return;
    }

    setIsLoadingWithdraw(true); // Начало загрузки
    setStatus(`🔄 Вывод Токена ${withdrawTokenType}...`);
    try {
      const tokenSwapContract = getTokenSwapContract(signer);
      
      const amountParsed = ethers.utils.parseUnits(withdrawTokenAmount, 18); 

      let tokenAddressToWithdraw;
      if (withdrawTokenType === 'A') {
        tokenAddressToWithdraw = aTokenAddress;
      } else { // 'B'
        tokenAddressToWithdraw = bTokenAddress;
      }

      const tx = await tokenSwapContract.withdrawTokens(tokenAddressToWithdraw, amountParsed);
      await tx.wait();
      
      setStatus(`✅ Успешно выведено ${withdrawTokenAmount} Токен ${withdrawTokenType}.`);
      setWithdrawTokenAmount('');
      refreshStatus(); 
    } catch (e) {
      console.error(`Вывод Токена ${withdrawTokenType} не удался:`, e);
      let errorMessage = `❌ Не удалось вывести Токен ${withdrawTokenType}`;
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    } finally {
      setIsLoadingWithdraw(false); // Конец загрузки
    }
  };


  return (
    <div className="admin-panel" style={{ marginTop: '1rem' }}>
      <h3>⚙️ Панель Администратора</h3>

      {/* Update Ratio & Fees */}
      <h4>Обновить Коэффициент & Комиссии</h4>
      <div className="input-group">
        <input
          type="number"
          value={newRatio}
          placeholder="Новое Соотношение"
          onChange={e => setNewRatio(e.target.value)}
          disabled={!signer || isLoadingUpdate} /* Отключаем поле во время загрузки */
        />
        <input
          type="number"
          value={newFees}
          placeholder="Новые Комиссии (%)"
          onChange={e => setNewFees(e.target.value)}
          disabled={!signer || isLoadingUpdate} /* Отключаем поле во время загрузки */
        />
        <button 
          onClick={handleUpdate} 
          disabled={!signer || isLoadingUpdate} /* Отключаем кнопку во время загрузки */
          className={isLoadingUpdate ? 'loading' : ''} /* Добавляем класс 'loading' */
        >
          <span className={isLoadingUpdate ? 'hidden' : ''}>Обновить</span>
          <div className="loader"></div> {/* Спиннер */}
        </button>
      </div>

      <hr />

      {/* Mint Tokens to TokenSwap */}
      <h4>Выпустить Токены </h4>
      <div className="input-group">
        <select value={mintToken} onChange={e => setMintToken(e.target.value)} disabled={!signer || isLoadingMint}>
          <option value="A">Выпустить Токен A</option>
          <option value="B">Выпустить Токен B</option>
        </select>
        <input
          type="number"
          value={mintAmount}
          onChange={e => setMintAmount(e.target.value)}
          placeholder="Количество для выпуска"
          disabled={!signer || isLoadingMint} /* Отключаем поле во время загрузки */
        />
        <button 
          onClick={handleMint} 
          disabled={!signer || isLoadingMint} /* Отключаем кнопку во время загрузки */
          className={isLoadingMint ? 'loading' : ''} /* Добавляем класс 'loading' */
        >
          <span className={isLoadingMint ? 'hidden' : ''}>Выпустить</span>
          <div className="loader"></div> {/* Спиннер */}
        </button>
      </div>

      <hr />

      {/* Withdraw Tokens from TokenSwap */}
      <h4>Вывести Токены из контракта</h4>
      <div className="input-group">
        <select value={withdrawTokenType} onChange={e => setWithdrawTokenType(e.target.value)} disabled={!signer || isLoadingWithdraw}>
          <option value="A">Вывести Токен A</option>
          <option value="B">Вывести Токен B</option>
        </select>
        <input
          type="number"
          value={withdrawTokenAmount}
          onChange={e => setWithdrawTokenAmount(e.target.value)}
          placeholder="Количество для вывода"
          disabled={!signer || isLoadingWithdraw} /* Отключаем поле во время загрузки */
        />
        <button 
          onClick={handleWithdrawTokens} 
          disabled={!signer || isLoadingWithdraw} /* Отключаем кнопку во время загрузки */
          className={isLoadingWithdraw ? 'loading' : ''} /* Добавляем класс 'loading' */
        >
          <span className={isLoadingWithdraw ? 'hidden' : ''}>Вывести Токены</span>
          <div className="loader"></div> {/* Спиннер */}
        </button>
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapAdminPanel;

