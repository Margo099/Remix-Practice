// src/TokenSwap/TokenStatus.jsx
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { tokenSwapAddress, tokenSwapAbi } from '../constants/contractABI';
import { getTokenSwapContract, getProvider } from '../web3'; // <-- ИЗМЕНЕНО

// Этот компонент может принимать provider напрямую, или получать его через getProvider()
// Если ты передаешь signer/account из App.jsx, можешь передать и provider.
// Но если он только для чтения, достаточно getProvider()
const TokenStatus = ({ signer, account }) => { // Принимаем signer/account, чтобы можно было зависеть от них
  const [ratio, setRatio] = useState(null);
  const [fees, setFees] = useState(null);
  const [statusMessage, setStatusMessage] = useState(''); // Для сообщений о загрузке/ошибке

  useEffect(() => {
    async function loadStatus() {
      setStatusMessage('Loading token status...');
      try {
        const provider = getProvider(); // Получаем провайдер
        if (!provider) {
          setStatusMessage('Error: Web3 provider not available.');
          return;
        }
        
        // Для чтения данных контракта можно использовать провайдер
        const contract = getTokenSwapContract(provider); // Инициализируем контракт с provider
        
        const fetchedRatio = await contract.getRatio();
        const fetchedFees = await contract.getFees();

        setRatio(fetchedRatio.toString());
        setFees(fetchedFees.toString());
        setStatusMessage(''); // Очищаем сообщение при успехе
      } catch (e) {
        console.error('Failed to load token status:', e);
        setStatusMessage('Error loading token status. Please connect wallet.');
        setRatio(null);
        setFees(null);
      }
    }
    loadStatus();

    // Опционально: можно обновлять статус при подключении/отключении кошелька
    // или при смене сети, если это имеет значение для отображения.
    // Если `account` меняется, то `signer` тоже меняется, и можно было бы триггернуть `loadStatus`.
  }, [account]); // Зависимость от account. Когда аккаунт подключается, пробуем загрузить статус.

  return (
    <div className="token-status">
      <h3>🔁 Token Swap Status</h3>
      {statusMessage && <p className="status-message">{statusMessage}</p>}
      <p>💱 Ratio (A → B): {ratio ?? 'N/A'}</p>
      <p>💸 Fee: {fees ?? 'N/A'}%</p>
    </div>
  );
};

export default TokenStatus;