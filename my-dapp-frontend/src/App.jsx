// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import TokenSwapForm from './TokenSwap/TokenSwapForm';
import TokenSwapAdminPanel from './TokenSwap/TokenSwapAdminPanel';
import TokenStatus from './TokenSwap/TokenStatus';
// Импортируем getSigner и getProvider, но не initProvider и requestAccounts
import { getSigner, getProvider, initProvider, requestAccounts } from './web3'; // Убедись, что все импортировано
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('tokenswap');
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null); // <-- НОВОЕ СОСТОЯНИЕ ДЛЯ SIGNER
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initProvider(); // Инициализируем провайдера
      const accounts = await requestAccounts(); // Запрашиваем аккаунты
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentSigner = getSigner(); // <-- ПОЛУЧАЕМ SIGNER ПОСЛЕ ПОДКЛЮЧЕНИЯ
        setSigner(currentSigner);         // <-- СОХРАНЯЕМ SIGNER В СОСТОЯНИИ
      } else {
        setAccount(null);
        setSigner(null); // Сбрасываем signer, если аккаунты не найдены
        setError("No accounts found or permission denied.");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setAccount(null);
      setSigner(null); // Сбрасываем signer при ошибке
      if (err.code === 4001) {
        setError("Connection rejected by user.");
      } else if (err.message.includes("already pending") || err.code === -32002) {
        setError("MetaMask request already pending. Please check your MetaMask window.");
      } else {
        setError("Error connecting to wallet: " + (err.message || err.toString()));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkConnection() {
      setLoading(true);
      setError(null);
      try {
        await initProvider();
        const providerInstance = getProvider(); // Использовать getProvider()
        const accounts = await providerInstance.listAccounts(); 
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          const currentSigner = getSigner(); // <-- ПОЛУЧАЕМ SIGNER
          setSigner(currentSigner);         // <-- СОХРАНЯЕМ SIGNER
        } else {
          setAccount(null);
          setSigner(null); // Сбрасываем signer
        }
      } catch (err) {
        console.warn("No active MetaMask connection found on load:", err);
        setAccount(null);
        setSigner(null); // Сбрасываем signer при ошибке
      } finally {
        setLoading(false);
      }
    }

    checkConnection();

    // Слушатели для изменения аккаунтов и сети
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(getSigner()); // Обновляем signer при смене аккаунта
          setError(null);
        } else {
          setAccount(null);
          setSigner(null); // Сбрасываем signer
          setError("Wallet disconnected. Please connect again.");
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Chain changed to:", chainId);
        window.location.reload(); 
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <div className="app-container">
      <div className="app-box">
        <h1 className="app-title">DApp Interface</h1>

        {loading ? (
          <p>⏳ Loading Web3...</p>
        ) : account ? (
          <p>✅ Connected: {account}</p>
        ) : (
          <div>
            <p>🛑 Not connected</p>
            {error && <p className="error-message">⚠️ {error}</p>}
            <button className="connect-button" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        )}

        {account && signer && ( // Показываем вкладки и контент только если подключен аккаунт И есть signer
          <>
            <div className="tabs">
              <button
                className={`tab-button ${activeTab === 'tokenswap' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokenswap')}
              >
                🔁 Token Swap
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'tokenswap' && (
                <div>
                  {/* ПЕРЕДАЕМ SIGNER И ACCOUNT КАК ПРОПСЫ */}
                  <TokenSwapForm signer={signer} account={account} />
                  <TokenStatus signer={signer} account={account} />
                  <TokenSwapAdminPanel signer={signer} account={account} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;