// src/TokenSwap/TokenSwapAdminPanel.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getTokenSwapContract } from '../web3'; 

// Принимаем signer, account и refreshStatus
const TokenSwapAdminPanel = ({ signer, account, refreshStatus }) => {
  const [newRatio, setNewRatio] = useState('');
  const [newFees, setNewFees] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintToken, setMintToken] = useState('A');
  const [status, setStatus] = useState('');

  const handleUpdate = async () => {
    if (!signer) {
      setStatus('❌ No signer available. Please connect wallet.');
      return;
    }
    if (!newRatio && !newFees) {
      setStatus('❌ Please enter a ratio or fees to update.');
      return;
    }

    try {
      setStatus('🔄 Updating...');
      const contract = getTokenSwapContract(signer); 

      if (newRatio) {
        // Убедись, что setRatio принимает uint, а не BigNumber, если ты передаешь просто число.
        // Если контракту нужен BigNumber, используй ethers.BigNumber.from(newRatio)
        const tx = await contract.setRatio(Number(newRatio)); 
        await tx.wait();
      }
      if (newFees) {
        const tx = await contract.setFees(Number(newFees)); // Аналогично для setFees
        await tx.wait();
      }

      setStatus('✅ Updated ratio and fees');
      setNewRatio('');
      setNewFees('');
      refreshStatus(); // Обновление счетчика для TokenStatus
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
    if (!signer) {
      setStatus('❌ No signer available. Please connect wallet.');
      return;
    }
    if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
      setStatus("❌ Please enter a valid amount to mint.");
      return;
    }

    try {
      setStatus('🔄 Minting...');
      const tokenSwapContract = getTokenSwapContract(signer); 
      
      const parsedAmount = ethers.utils.parseUnits(mintAmount, 18); // Минтим с 18 десятичными знаками

      let tx;
      if (mintToken === 'A') {
        tx = await tokenSwapContract.mintATokensToTokenSwap(parsedAmount);
      } else { 
        tx = await tokenSwapContract.mintBTokensToTokenSwap(parsedAmount);
      }

      await tx.wait();
      setStatus(`✅ Minted ${mintAmount} Token${mintToken}`);
      setMintAmount('');
      refreshStatus(); // Обновление счетчика для TokenStatus
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
          onChange={e => setMintAmount(e.target.value)}
          placeholder="Amount to Mint"
          disabled={!signer}
        />
        <button onClick={handleMint} disabled={!signer}>Mint</button>
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapAdminPanel;