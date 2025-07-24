// src/TokenSwap/TokenStatus.jsx
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getTokenSwapContract } from '../web3'; // Убрали getProvider отсюда

// Принимаем provider и statusRefreshCounter
const TokenStatus = ({ provider, statusRefreshCounter }) => {
  const [ratio, setRatio] = useState(null);
  const [fees, setFees] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function loadStatus() {
      if (!provider) { // Проверяем, что provider передан
        setStatusMessage('Waiting for Web3 provider...');
        setRatio(null);
        setFees(null);
        return;
      }
      
      setStatusMessage('Loading token status...');
      try {
        const contract = getTokenSwapContract(provider); 
        
        const fetchedRatio = await contract.getRatio();
        const fetchedFees = await contract.getFees();

        setRatio(fetchedRatio.toString()); // BigNumber в строку
        setFees(fetchedFees.toString());   // BigNumber в строку
        setStatusMessage(''); 
      } catch (e) {
        console.error('Failed to load token status:', e);
        setStatusMessage('Error loading token status. Please connect wallet.');
        setRatio(null);
        setFees(null);
      }
    }
    loadStatus();

    // Зависимость от provider И statusRefreshCounter.
    // Это гарантирует, что статус обновится, когда provider станет доступен,
    // или когда изменится статус через refreshStatus().
  }, [provider, statusRefreshCounter]); 

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