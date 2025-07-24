// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import TokenSwapForm from './TokenSwap/TokenSwapForm';
import TokenSwapAdminPanel from './TokenSwap/TokenSwapAdminPanel';
import TokenStatus from './TokenSwap/TokenStatus';
import { getSigner, getProvider, initProvider, requestAccounts } from './web3'; 
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('tokenswap');
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null); // Состояние для объекта ethers.providers.Web3Provider
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusRefreshCounter, setStatusRefreshCounter] = useState(0); // Счетчик для принудительного обновления статуса

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initProvider(); // Инициализируем глобальный провайдер в web3.js
      const accounts = await requestAccounts(); // Запрашиваем аккаунты у MetaMask
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentSigner = getSigner();
        setSigner(currentSigner);
        setWeb3Provider(getProvider()); // Сохраняем экземпляр провайдера
      } else {
        setAccount(null);
        setSigner(null);
        setWeb3Provider(null);
        setError("No accounts found or permission denied.");
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setAccount(null);
      setSigner(null);
      setWeb3Provider(null);
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
        const providerInstance = getProvider(); 
        setWeb3Provider(providerInstance); // Сохраняем экземпляр провайдера
        
        const accounts = await providerInstance.listAccounts(); 
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          const currentSigner = getSigner();
          setSigner(currentSigner);
        } else {
          setAccount(null);
          setSigner(null);
        }
      } catch (err) {
        console.warn("No active MetaMask connection found on load or provider init failed:", err);
        setAccount(null);
        setSigner(null);
        setWeb3Provider(null);
      } finally {
        setLoading(false);
      }
    }

    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(getSigner());
          setError(null);
          setStatusRefreshCounter(prev => prev + 1); // Обновляем счетчик при смене аккаунта
        } else {
          setAccount(null);
          setSigner(null);
          setError("Wallet disconnected. Please connect again.");
          setStatusRefreshCounter(prev => prev + 1); // Обновляем счетчик при отключении
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

  // Функция для обновления счетчика, которую будем передавать дочерним компонентам
  const refreshStatus = useCallback(() => {
    setStatusRefreshCounter(prev => prev + 1);
  }, []);

  // Вспомогательная функция для форматирования адреса
  const formatAddress = (address) => {
    if (!address || typeof address !== 'string' || address.length < 10) {
      return address || 'N/A'; 
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="app-container">
      <div className="app-box">
        <h1 className="app-title">DApp Interface</h1>

        {loading ? (
          <p>⏳ Loading Web3...</p>
        ) : account ? (
          <p>✅ Connected: {formatAddress(account)}</p>
        ) : (
          <div>
            <p>🛑 Not connected</p>
            {error && <p className="status-message error-message">⚠️ {error}</p>}
            <button className="connect-button" onClick={connectWallet} disabled={loading}>
              Connect Wallet
            </button>
          </div>
        )}

        {account && signer && web3Provider && ( // Рендерим вкладки и контент только если все готово
          <>
            <div className="tabs">
              <button
                className={`tab-button ${activeTab === 'tokenswap' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokenswap')}
              >
                🔁 Token Swap
              </button>
              {/* Добавь другие вкладки, если они есть */}
            </div>

            <div className="tab-content">
              {activeTab === 'tokenswap' && (
                <div>
                  {/* Передаем signer, account, web3Provider и refreshStatus */}
                  <TokenSwapForm 
                    signer={signer} 
                    account={account} 
                    web3Provider={web3Provider} 
                    refreshStatus={refreshStatus} 
                  />
                  <TokenStatus 
                    provider={web3Provider} 
                    account={account} 
                    statusRefreshCounter={statusRefreshCounter} 
                  />
                  <TokenSwapAdminPanel 
                    signer={signer} 
                    account={account} 
                    refreshStatus={refreshStatus} 
                  />
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