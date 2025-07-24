// src/TokenSwap/TokenSwapAdminPanel.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
// Импортируем только адреса и функции контрактов
import { tokenSwapAddress, aTokenAddress, bTokenAddress, erc20MinimalAbi } from '../constants/contractABI';
import { getTokenSwapContract, getATokenContract, getBTokenContract } from '../web3'; // <-- ИЗМЕНЕНО

// Принимаем signer и account как пропсы
const TokenSwapAdminPanel = ({ signer, account }) => { // <-- ДОБАВЛЕНО
  const [newRatio, setNewRatio] = useState('');
  const [newFees, setNewFees] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintToken, setMintToken] = useState('A');
  const [status, setStatus] = useState('');

  const handleUpdate = async () => {
    if (!signer) { // <-- ПРОВЕРКА НА SIGNER
      setStatus('❌ No signer available. Please connect wallet.');
      return;
    }
    if (!newRatio && !newFees) {
      setStatus('❌ Please enter a ratio or fees to update.');
      return;
    }

    try {
      setStatus('🔄 Updating...');
      // Контракт инициализируется с переданным signer
      const contract = getTokenSwapContract(signer); 

      if (newRatio) {
        const tx = await contract.setRatio(Number(newRatio));
        await tx.wait();
      }
      if (newFees) {
        const tx = await contract.setFees(Number(newFees));
        await tx.wait();
      }

      setStatus('✅ Updated ratio and fees');
      setNewRatio('');
      setNewFees('');
    } catch (e) {
      console.error(e);
      let errorMessage = '❌ Failed to update';
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    }
  };

  const handleMint = async () => {
    if (!signer) { // <-- ПРОВЕРКА НА SIGNER
      setStatus('❌ No signer available. Please connect wallet.');
      return;
    }
    if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
      setStatus("❌ Please enter a valid amount to mint.");
      return;
    }

    try {
      setStatus('🔄 Minting...');
      // Контракты инициализируются с переданным signer
      const tokenSwapContract = getTokenSwapContract(signer); // Используем TokenSwap для вызова mintATokensToTokenSwap
      
      const parsedAmount = ethers.utils.parseUnits(mintAmount, 18);

      let tx;
      if (mintToken === 'A') {
        tx = await tokenSwapContract.mintATokensToTokenSwap(parsedAmount);
      } else { // mintToken === 'B'
        tx = await tokenSwapContract.mintBTokensToTokenSwap(parsedAmount);
      }

      await tx.wait();
      setStatus(`✅ Minted ${mintAmount} Token${mintToken}`);
      setMintAmount('');
    } catch (e) {
      console.error(e);
      let errorMessage = '❌ Minting failed';
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    }
  };

  return (
    <div className="admin-panel" style={{ marginTop: '1rem' }}>
      <h3>🔐 Admin Panel</h3>
      <h4>Update Ratio & Fees</h4>
      <div className="input-group">
        <input
          type="number"
          value={newRatio}
          placeholder="New Ratio"
          onChange={e => setNewRatio(e.target.value)}
          disabled={!signer}
        />
        <input
          type="number"
          value={newFees}
          placeholder="New Fees %"
          onChange={e => setNewFees(e.target.value)}
          disabled={!signer}
        />
        <button onClick={handleUpdate} disabled={!signer}>Update</button>
      </div>

      <hr />

      <h4>Mint Tokens to TokenSwap</h4>
      <div className="input-group">
        <select value={mintToken} onChange={e => setMintToken(e.target.value)} disabled={!signer}>
          <option value="A">Mint A to Swap</option>
          <option value="B">Mint B to Swap</option>
        </select>
        <input
          type="number"
          value={mintAmount}
          placeholder="Amount to Mint"
          onChange={e => setMintAmount(e.target.value)}
          disabled={!signer}
        />
        <button onClick={handleMint} disabled={!signer}>Mint</button>
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapAdminPanel;