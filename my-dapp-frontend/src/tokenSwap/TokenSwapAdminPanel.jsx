// src/TokenSwap/TokenSwapAdminPanel.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
// Импортируем адреса токенов A и B, чтобы использовать их для withdrawTokens
import { getTokenSwapContract } from '../web3'; 
import { aTokenAddress, bTokenAddress } from '../constants/contractABI'; // Добавлено


// Принимаем signer, account и refreshStatus
const TokenSwapAdminPanel = ({ signer, account, refreshStatus }) => {
  const [newRatio, setNewRatio] = useState('');
  const [newFees, setNewFees] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintToken, setMintToken] = useState('A');
  // const [withdrawEthAmount, setWithdrawEthAmount] = useState(''); // УДАЛЕНО: Состояние для вывода ETH
  const [withdrawTokenAmount, setWithdrawTokenAmount] = useState(''); // Состояние для вывода токенов
  const [withdrawTokenType, setWithdrawTokenType] = useState('A'); // Состояние для типа токена для вывода
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
      refreshStatus(); 
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
      
      const parsedAmount = ethers.utils.parseUnits(mintAmount, 18); 

      let tx;
      if (mintToken === 'A') {
        tx = await tokenSwapContract.mintATokensToTokenSwap(parsedAmount);
      } else { 
        tx = await tokenSwapContract.mintBTokensToTokenSwap(parsedAmount);
      }

      await tx.wait();
      setStatus(`✅ Minted ${mintAmount} Token${mintToken}`);
      setMintAmount('');
      refreshStatus(); 
    } catch (e) {
      console.error(e);
      let errorMessage = '❌ Minting failed';
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    }
  };

  // УДАЛЕНО: Функция handleWithdrawETH
  /*
  const handleWithdrawETH = async () => {
    if (!signer) {
      setStatus('❌ No signer available. Please connect wallet.');
      return;
    }
    if (!withdrawEthAmount || isNaN(withdrawEthAmount) || parseFloat(withdrawEthAmount) <= 0) {
      setStatus("❌ Please enter a valid amount of ETH to withdraw.");
      return;
    }

    try {
      setStatus('🔄 Withdrawing ETH...');
      const tokenSwapContract = getTokenSwapContract(signer);
      
      const amountWei = ethers.utils.parseEther(withdrawEthAmount);

      const tx = await tokenSwapContract.withdrawETH(amountWei);
      await tx.wait();
      
      setStatus(`✅ Successfully withdrew ${withdrawEthAmount} ETH.`);
      setWithdrawEthAmount('');
      refreshStatus(); 
    } catch (e) {
      console.error('Withdraw ETH failed:', e);
      let errorMessage = '❌ Failed to withdraw ETH';
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    }
  };
  */

  const handleWithdrawTokens = async () => {
    if (!signer) {
      setStatus('❌ No signer available. Please connect wallet.');
      return;
    }
    if (!withdrawTokenAmount || isNaN(withdrawTokenAmount) || parseFloat(withdrawTokenAmount) <= 0) {
      setStatus("❌ Please enter a valid amount of tokens to withdraw.");
      return;
    }

    try {
      setStatus(`🔄 Withdrawing Token ${withdrawTokenType}...`);
      const tokenSwapContract = getTokenSwapContract(signer);
      
      const amountParsed = ethers.utils.parseUnits(withdrawTokenAmount, 18); // Токены с 18 десятичными знаками

      let tokenAddressToWithdraw;
      if (withdrawTokenType === 'A') {
        tokenAddressToWithdraw = aTokenAddress;
      } else { // 'B'
        tokenAddressToWithdraw = bTokenAddress;
      }

      const tx = await tokenSwapContract.withdrawTokens(tokenAddressToWithdraw, amountParsed);
      await tx.wait();
      
      setStatus(`✅ Successfully withdrew ${withdrawTokenAmount} Token ${withdrawTokenType}.`);
      setWithdrawTokenAmount('');
      refreshStatus(); 
    } catch (e) {
      console.error(`Withdraw Token ${withdrawTokenType} failed:`, e);
      let errorMessage = `❌ Failed to withdraw Token ${withdrawTokenType}`;
      if (e.reason) { errorMessage += `: ${e.reason}`; }
      else if (e.data && e.data.message) { errorMessage += `: ${e.data.message}`; }
      else if (e.message) { errorMessage += `: ${e.message}`; }
      setStatus(errorMessage);
    }
  };


  return (
    <div className="admin-panel" style={{ marginTop: '1rem' }}>
      <h3>🔐 Admin Panel</h3>

      {/* Update Ratio & Fees */}
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

      {/* Mint Tokens to TokenSwap */}
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

      <hr />

      {/* УДАЛЕНО: Секция для Withdraw ETH from TokenSwap */}
      {/*
      <h4>Withdraw ETH from TokenSwap</h4>
      <div className="input-group">
        <input
          type="number"
          value={withdrawEthAmount}
          onChange={e => setWithdrawEthAmount(e.target.value)}
          placeholder="Amount ETH to Withdraw"
          disabled={!signer}
        />
        <button onClick={handleWithdrawETH} disabled={!signer}>Withdraw ETH</button>
      </div>

      <hr />
      */}

      {/* Withdraw Tokens from TokenSwap */}
      <h4>Withdraw Tokens from TokenSwap</h4>
      <div className="input-group">
        <select value={withdrawTokenType} onChange={e => setWithdrawTokenType(e.target.value)} disabled={!signer}>
          <option value="A">Withdraw A</option>
          <option value="B">Withdraw B</option>
        </select>
        <input
          type="number"
          value={withdrawTokenAmount}
          onChange={e => setWithdrawTokenAmount(e.target.value)}
          placeholder="Amount Tokens to Withdraw"
          disabled={!signer}
        />
        <button onClick={handleWithdrawTokens} disabled={!signer}>Withdraw Tokens</button>
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapAdminPanel;