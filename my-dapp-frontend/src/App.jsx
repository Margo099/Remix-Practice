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
  const [web3Provider, setWeb3Provider] = useState(null); 
  const [loading, setLoading] = useState(true); // Состояние для первоначальной загрузки App
  const [error, setError] = useState(null);
  const [statusRefreshCounter, setStatusRefreshCounter] = useState(0); 

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ ГЛОБАЛЬНОЙ ЗАГРУЗКИ И СООБЩЕНИЙ
  const [globalLoading, setGlobalLoading] = useState(false); // Инициализировано как false
  const [globalStatusMessage, setGlobalStatusMessage] = useState(''); 


  const connectWallet = useCallback(async () => {
    setGlobalLoading(true); // Активируем глобальный оверлей
    setGlobalStatusMessage('Подключение к кошельку...');
    setError(null);
    try {
      await initProvider(); 
      const accounts = await requestAccounts(); 
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentSigner = getSigner();
        setSigner(currentSigner);
        setWeb3Provider(getProvider()); 
        setGlobalStatusMessage('Кошелек успешно подключен!'); 
      } else {
        setAccount(null);
        setSigner(null);
        setWeb3Provider(null);
        setError("Аккаунты не найдены или доступ запрещен.");
        setGlobalStatusMessage(''); 
      }
    } catch (err) {
      console.error("Не удалось подключить кошелек:", err);
      setAccount(null);
      setSigner(null);
      setWeb3Provider(null);
      let errorMessage = "Ошибка подключения кошелька: ";
      if (err.code === 4001) {
        errorMessage += "Пользователь отклонил подключение.";
      } else if (err.message.includes("already pending") || err.code === -32002) {
        errorMessage += "Запрос MetaMask уже в ожидании. Проверьте окно MetaMask.";
      } else {
        errorMessage += (err.message || err.toString());
      }
      setError(errorMessage);
      setGlobalStatusMessage(''); 
    } finally {
      // Задержка перед скрытием оверлея, чтобы пользователь успел прочитать сообщение
      // Если globalLoading был активирован, то здесь он деактивируется.
      // Если же это была только первоначальная загрузка, то она тоже завершается.
      setTimeout(() => {
        setGlobalLoading(false); 
        setLoading(false); 
      }, 1000); 
    }
  }, []);

  useEffect(() => {
    async function checkConnection() {
      setLoading(true);
      setGlobalLoading(true); // Активируем глобальный оверлей при проверке
      setGlobalStatusMessage('Проверка подключения...');
      setError(null);
      try {
        await initProvider();
        const providerInstance = getProvider(); 
        setWeb3Provider(providerInstance); 
        
        const accounts = await providerInstance.listAccounts(); 
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          const currentSigner = getSigner();
          setSigner(currentSigner);
          setGlobalStatusMessage('Подключение найдено.');
        } else {
          setAccount(null);
          setSigner(null);
          setWeb3Provider(null);
          setGlobalStatusMessage('Кошелек не подключен.');
        }
      } catch (err) {
        console.warn("Активное подключение MetaMask не найдено или инициализация провайдера не удалась:", err);
        setAccount(null);
        setSigner(null);
        setWeb3Provider(null);
        setGlobalStatusMessage('Не удалось проверить подключение.');
      } finally {
        // Задержка перед скрытием оверлея, чтобы пользователь успел прочитать сообщение
        setTimeout(() => {
          setGlobalLoading(false); 
          setLoading(false); 
        }, 1000); 
      }
    }

    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(getSigner());
          setError(null);
          setStatusRefreshCounter(prev => prev + 1); 
        } else {
          setAccount(null);
          setSigner(null);
          setError("Кошелек отключен. Подключитесь снова.");
          setStatusRefreshCounter(prev => prev + 1); 
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Сеть изменена на:", chainId);
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

  const refreshStatus = useCallback(() => {
    setStatusRefreshCounter(prev => prev + 1);
  }, []);

  const formatAddress = (address) => {
    if (!address || typeof address !== 'string' || address.length < 10) {
      return address || 'N/A'; 
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="app-container">
      <div className="app-box">
        {/* ГЛОБАЛЬНЫЙ ОВЕРЛЕЙ ЗАГРУЗКИ */}
        {/* Показывается, когда loading (первоначальная загрузка App) или globalLoading (операции) активны */}
        <div className={`loading-overlay ${loading || globalLoading ? 'active' : ''}`}>
          <div className="loader"></div>
          <p>{globalStatusMessage || 'Загрузка...'}</p> 
        </div>

        <h1 className="app-title">DApp Interface</h1>

        {/* Условие для отображения подключения кошелька или статуса */}
        {account ? (
          <p>✅ Подключено: {formatAddress(account)}</p>
        ) : (
          <div>
            <p>🛑 Не подключено</p>
            {error && <p className="status-message error-message">⚠️ {error}</p>}
            <button 
              className={`connect-button ${globalLoading ? 'loading' : ''}`} 
              onClick={connectWallet} 
              disabled={globalLoading}
            >
              <span className={globalLoading ? 'hidden' : ''}>Подключить Кошелек</span>
              <div className="loader"></div> 
            </button>
          </div>
        )}

        {/* Рендерим вкладки и контент только если кошелек подключен и не идет глобальная загрузка */}
        {account && signer && web3Provider && !loading && ( 
          <>
            <div className="tabs">
              <button
                className={`tab-button ${activeTab === 'tokenswap' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokenswap')}
              >
                🔁 Обмен Токенов
              </button>
              {/* Добавить другие вкладки, если они есть (оставила опициональным)  */}
            </div>

            <div className="tab-content">
              {activeTab === 'tokenswap' && (
                <div>
                  <TokenSwapForm 
                    signer={signer} 
                    account={account} 
                    web3Provider={web3Provider} 
                    refreshStatus={refreshStatus} 
                    setGlobalLoading={setGlobalLoading}
                    setGlobalStatusMessage={setGlobalStatusMessage}
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
                    setGlobalLoading={setGlobalLoading}
                    setGlobalStatusMessage={setGlobalStatusMessage}
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
