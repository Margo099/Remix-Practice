// src/TokenSwap/TokenSwapForm.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Импортируем только адреса и ABI, функции контрактов получаем из web3
import { tokenSwapAddress, aTokenAddress, bTokenAddress, erc20MinimalAbi } from '../constants/contractABI';
// Импортируем функции для получения контрактов, которые теперь принимают signer
import { getTokenSwapContract, getATokenContract, getBTokenContract } from '../web3';


// Принимаем signer и account как пропсы
const TokenSwapForm = ({ signer, account }) => { // <-- ДОБАВЛЕНО
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('AtoB');
  const [status, setStatus] = useState('');
  const [tokenPriceA, setTokenPriceA] = useState(null); // Для функции покупки
  const [tokenPriceB, setTokenPriceB] = useState(null); // Для функции покупки

  // useEffect для получения цен токенов (нужны для buyTokens) и, возможно, текущего соотношения
  useEffect(() => {
    async function loadTokenData() {
        if (!signer) { // Убедиться, что signer доступен
            return;
        }
        try {
            const aTokenContract = getATokenContract(signer);
            const bTokenContract = getBTokenContract(signer);
            const swapContract = getTokenSwapContract(signer);

            const priceA = await aTokenContract.tokenPrice(); // Предполагается, что tokenPrice есть в ABI
            const priceB = await bTokenContract.tokenPrice(); // Предполагается, что tokenPrice есть в ABI
            setTokenPriceA(priceA);
            setTokenPriceB(priceB);

            // Если ты хочешь показывать Ratio здесь, раскомментируй:
            // const ratio = await swapContract.getRatio();
            // console.log("Current Ratio:", ratio.toString());
        } catch (error) {
            console.error("Failed to load token data:", error);
            // setStatus("Failed to load token prices.");
        }
    }
    loadTokenData();
  }, [signer]); // Зависимость от signer

  const handleSwap = async () => {
    if (!signer || !account) { // <-- ПРОВЕРКА НА SIGNER И ACCOUNT
      setStatus("❌ Please connect your wallet first.");
      return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus("❌ Please enter a valid amount.");
      return;
    }

    try {
      setStatus('🔄 Swapping...');
      // Теперь контракты инициализируются с переданным signer
      const tokenSwap = getTokenSwapContract(signer);
      const fromToken = direction === 'AtoB' ? getATokenContract(signer) : getBTokenContract(signer);

      const amountParsed = ethers.utils.parseUnits(amount, 18); // Используем 18 decimals

      const allowance = await fromToken.allowance(account, tokenSwapAddress); // Используем account
      if (allowance.lt(amountParsed)) {
        setStatus(`🔄 Approving ${direction === 'AtoB' ? 'AToken' : 'BToken'} for swap...`);
        const approveTx = await fromToken.approve(tokenSwapAddress, amountParsed);
        await approveTx.wait();
      }

      setStatus(`🔄 Executing swap ${direction}...`);
      const tx = direction === 'AtoB'
        ? await tokenSwap.swapTKA(amountParsed)
        : await tokenSwap.swapTKB(amountParsed);

      await tx.wait();
      setStatus('✅ Swap completed!');
      setAmount(''); // Очистить поле ввода
    } catch (err) {
      console.error('Swap failed:', err);
      // Более подробные сообщения об ошибках
      let errorMessage = 'Swap failed';
      if (err.reason) {
          errorMessage += `: ${err.reason}`; // Ошибка из контракта
      } else if (err.data && err.data.message) {
          errorMessage += `: ${err.data.message}`; // Другие ошибки RPC
      } else if (err.message) {
          errorMessage += `: ${err.message}`; // Общее сообщение
      }
      setStatus(`❌ ${errorMessage}`);
    }
  };

  const handleBuyTokens = async (tokenType) => {
    if (!signer || !account) {
        setStatus("❌ Please connect your wallet first.");
        return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        setStatus("❌ Please enter a valid amount.");
        return;
    }

    setStatus(`🔄 Buying Token ${tokenType} with ETH...`);
    try {
        const tokenSwapContract = getTokenSwapContract(signer);
        const numberOfTokens = ethers.BigNumber.from(amount); // Количество токенов без учета decimals

        let ethRequired;
        if (tokenType === 'A') {
            if (!tokenPriceA) {
                setStatus("❌ Token A price not loaded.");
                return;
            }
            ethRequired = tokenPriceA.mul(numberOfTokens);
            await tokenSwapContract.buyTokensAForUser(numberOfTokens, { value: ethRequired });
        } else { // tokenType === 'B'
            if (!tokenPriceB) {
                setStatus("❌ Token B price not loaded.");
                return;
            }
            ethRequired = tokenPriceB.mul(numberOfTokens);
            await tokenSwapContract.buyTokensBForUser(numberOfTokens, { value: ethRequired });
        }

        setStatus(`✅ Successfully bought ${amount} Token ${tokenType}!`);
        setAmount('');
    } catch (error) {
        console.error(`Buy Token ${tokenType} failed:`, error);
        let errorMessage = `Buy Token ${tokenType} failed`;
        if (error.reason) {
            errorMessage += `: ${error.reason}`;
        } else if (error.data && error.data.message) {
            errorMessage += `: ${error.data.message}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        setStatus(`❌ ${errorMessage}`);
    }
};

  return (
    <div className="swap-form">
      <h3>🔁 Swap Tokens / Buy with ETH</h3>
      
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
        <button onClick={() => handleBuyTokens('A')} disabled={!signer}>Buy A with ETH</button>
        <button onClick={() => handleBuyTokens('B')} disabled={!signer}>Buy B with ETH</button>
      </div>

      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default TokenSwapForm;