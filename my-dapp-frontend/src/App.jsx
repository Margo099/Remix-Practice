import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
    TOKEN_SWAP_ABI, TOKEN_SWAP_ADDRESS,
    A_TOKEN_ABI, A_TOKEN_ADDRESS,
    B_TOKEN_ABI, B_TOKEN_ADDRESS
} from './constants/contractABI'; 
import './App.css'; // Базовые стили Vite

function App() {
    // Состояния для подключения кошелька и общих данных
    const [signer, setSigner] = useState(null);
    const [tokenSwapContract, setTokenSwapContract] = useState(null);
    const [aTokenContract, setATokenContract] = useState(null);
    const [bTokenContract, setBTokenContract] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [walletConnected, setWalletConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [isAdmin, setIsAdmin] = useState(false); // Новое состояние для проверки администратора
    const [contractAdminAddress, setContractAdminAddress] = useState(''); // Адрес администратора контракта

    // Состояния для данных контракта TokenSwap
    const [ratio, setRatio] = useState('0'); // Инициализируем строкой, чтобы избежать проблем с BigInt/Number
    const [fees, setFees] = useState('0'); 
    const [newRatioInput, setNewRatioInput] = useState('');
    const [newFeesInput, setNewFeesInput] = useState('');

    // Состояния для обмена токенов
    const [amountToSwapA, setAmountToSwapA] = useState('');
    const [amountToSwapB, setAmountToSwapB] = useState('');
    const [userBalanceA, setUserBalanceA] = useState('0');
    const [userBalanceB, setUserBalanceB] = useState('0');
    const [aTokenAllowance, setATokenAllowance] = useState('0');
    const [bTokenAllowance, setBTokenAllowance] = useState('0');

    // Состояния для покупки токенов
    const [amountToBuyA, setAmountToBuyA] = useState('');
    const [amountToBuyB, setAmountToBuyB] = useState('');
    const [aTokenPrice, setATokenPrice] = useState('0');
    const [bTokenPrice, setBTokenPrice] = useState('0');


    // Функция для подключения MetaMask
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                setLoading(true);
                setError(null);
                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []); // Запрос на подключение аккаунта
                const currentSigner = await provider.getSigner();
                setSigner(currentSigner);
                const address = await currentSigner.getAddress();
                setUserAddress(address);

                // Инициализация контракта TokenSwap
                const tokenSwapInstance = new ethers.Contract(TOKEN_SWAP_ADDRESS, TOKEN_SWAP_ABI, currentSigner);
                setTokenSwapContract(tokenSwapInstance);

                // Инициализация контрактов токенов A и B (для approve и balanceOf)
                const aTokenInstance = new ethers.Contract(A_TOKEN_ADDRESS, A_TOKEN_ABI, currentSigner);
                setATokenContract(aTokenInstance);
                const bTokenInstance = new ethers.Contract(B_TOKEN_ADDRESS, B_TOKEN_ABI, currentSigner);
                setBTokenContract(bTokenInstance);

                setWalletConnected(true);
                console.log("Wallet connected:", address);
            } catch (err) {
                console.error("Error connecting wallet:", err);
                setError("Failed to connect wallet. Please ensure MetaMask is installed, unlocked, and connected to 'Hardhat Localhost' network.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("MetaMask is not installed. Please install it to use this DApp.");
        }
    };

    // Функция для получения данных о соотношении и комиссиях
    const fetchContractData = async () => {
        if (tokenSwapContract && userAddress && aTokenContract && bTokenContract) {
            try {
                setLoading(true);
                setError(null);

                // Получение адреса администратора контракта
                const adminAddress = await tokenSwapContract.admin({ blockTag: 'latest' }); 
                setContractAdminAddress(adminAddress);
                setIsAdmin(userAddress.toLowerCase() === adminAddress.toLowerCase()); // Проверяем, является ли текущий пользователь админом

                // Получение Ratio и Fees из TokenSwap
                try {
                    const currentRatio = await tokenSwapContract.getRatio({ blockTag: 'latest' }); 
                    setRatio(currentRatio.toString());
                } catch (err) {
                    console.warn("Could not fetch ratio (might be admin-only or other error):", err.message);
                    setRatio('N/A (Error)');
                }
                
                try {
                    const currentFees = await tokenSwapContract.getFees({ blockTag: 'latest' }); 
                    setFees(currentFees.toString());
                } catch (err) {
                    console.warn("Could not fetch fees (might be admin-only or other error):", err.message);
                    setFees('N/A (Error)');
                }

                // Получение балансов токенов пользователя
                const balanceA = await aTokenContract.balanceOf(userAddress, { blockTag: 'latest' }); 
                setUserBalanceA(ethers.formatUnits(balanceA, await aTokenContract.decimals())); // Форматируем для отображения
                const balanceB = await bTokenContract.balanceOf(userAddress, { blockTag: 'latest' }); 
                setUserBalanceB(ethers.formatUnits(balanceB, await bTokenContract.decimals()));

                // Получение одобрений (allowance) для TokenSwap
                const allowanceA = await aTokenContract.allowance(userAddress, TOKEN_SWAP_ADDRESS, { blockTag: 'latest' }); 
                setATokenAllowance(ethers.formatUnits(allowanceA, await aTokenContract.decimals()));
                const allowanceB = await bTokenContract.allowance(userAddress, TOKEN_SWAP_ADDRESS, { blockTag: 'latest' }); 
                setBTokenAllowance(ethers.formatUnits(allowanceB, await bTokenContract.decimals()));

                // Получение цен токенов (для buyTokens)
                const priceA = await aTokenContract.tokenPrice({ blockTag: 'latest' }); 
                setATokenPrice(ethers.formatUnits(priceA, 'wei')); // Цена в wei
                const priceB = await bTokenContract.tokenPrice({ blockTag: 'latest' }); 
                setBTokenPrice(ethers.formatUnits(priceB, 'wei'));

            } catch (err) {
                console.error("Error fetching contract data:", err);
                setError("Failed to fetch contract data. Is your Hardhat Network running and contracts deployed?");
            } finally {
                setLoading(false);
            }
        }
    };

    // Эффект для автоматической загрузки данных при подключении кошелька
    useEffect(() => {
        let interval;
        if (walletConnected && tokenSwapContract && userAddress && aTokenContract && bTokenContract) {
            fetchContractData();
            interval = setInterval(fetchContractData, 5000); // Обновлять каждые 5 секунд
        }
        return () => {
            if (interval) {
                clearInterval(interval); // Очистка при размонтировании компонента
            }
        };
    }, [walletConnected, tokenSwapContract, userAddress, aTokenContract, bTokenContract]);


    // Функции для TokenSwap 

    const handleSetRatio = async () => {
        if (tokenSwapContract && newRatioInput) {
            try {
                setLoading(true);
                setError(null);
                const tx = await tokenSwapContract.setRatio(newRatioInput);
                await tx.wait();
                alert(`Ratio set to ${newRatioInput} successfully!`);
                setNewRatioInput('');
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error("Error setting ratio:", err);
                setError("Failed to set ratio. Check console. Only admin can set ratio.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter a new ratio.");
        }
    };

    const handleSetFees = async () => {
        if (tokenSwapContract && newFeesInput) {
            try {
                setLoading(true);
                setError(null);
                const tx = await tokenSwapContract.setFees(newFeesInput);
                await tx.wait();
                alert(`Fees set to ${newFeesInput}% successfully!`);
                setNewFeesInput('');
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error("Error setting fees:", err);
                setError("Failed to set fees. Check console. Only admin can set fees.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter new fees.");
        }
    };

    // Функция для одобрения (approve) токена
    const handleApprove = async (tokenContract, amount, spenderAddress, tokenName) => {
        if (tokenContract && amount && spenderAddress) {
            try {
                setLoading(true);
                setError(null);
                // Используем ethers.parseUnits для преобразования из десятичного в базовые единицы
                const amountInUnits = ethers.parseUnits(amount, await tokenContract.decimals());
                const tx = await tokenContract.approve(spenderAddress, amountInUnits);
                await tx.wait();
                alert(`${tokenName} approved successfully for ${amount} units!`);
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error(`Error approving ${tokenName}:`, err);
                setError(`Failed to approve ${tokenName}. Check console.`);
            } finally {
                setLoading(false);
            }
        } else {
            setError(`Please enter an amount to approve for ${tokenName}.`);
        }
    };

    // Функция для обмена TokenA на TokenB
    const handleSwapTKA = async () => {
        if (tokenSwapContract && amountToSwapA) {
            try {
                setLoading(true);
                setError(null);
                // Amount to swap should be in token's smallest unit (e.g., 10^18 for 1 token)
                const amountInUnits = ethers.parseUnits(amountToSwapA, await aTokenContract.decimals());
                const tx = await tokenSwapContract.swapTKA(amountInUnits);
                await tx.wait();
                alert(`Swapped ${amountToSwapA} AToken for BToken successfully!`);
                setAmountToSwapA('');
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error("Error swapping A->B:", err);
                setError("Failed to swap A->B. Check console. Did you approve enough AToken?");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter amount of AToken to swap.");
        }
    };

    // Функция для обмена TokenB на TokenA
    const handleSwapTKB = async () => {
        if (tokenSwapContract && amountToSwapB) {
            try {
                setLoading(true);
                setError(null);
                const amountInUnits = ethers.parseUnits(amountToSwapB, await bTokenContract.decimals());
                const tx = await tokenSwapContract.swapTKB(amountInUnits);
                await tx.wait();
                alert(`Swapped ${amountToSwapB} BToken for AToken successfully!`);
                setAmountToSwapB('');
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error("Error swapping B->A:", err);
                setError("Failed to swap B->A. Check console. Did you approve enough BToken?");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter amount of BToken to swap.");
        }
    };

    // Функция для покупки AToken
    const handleBuyTokensA = async () => {
        if (aTokenContract && amountToBuyA && aTokenPrice !== '0') {
            try {
                setLoading(true);
                setError(null);
                const amountInUnits = ethers.parseUnits(amountToBuyA, await aTokenContract.decimals());
                const ethRequired = ethers.parseUnits(amountToBuyA, 'wei') * BigInt(aTokenPrice); // Total ETH in wei
                
                const tx = await aTokenContract.buyTokens(amountInUnits, { value: ethRequired });
                await tx.wait();
                alert(`Successfully bought ${amountToBuyA} AToken!`);
                setAmountToBuyA('');
                fetchContractData();
            } catch (err) {
                console.error("Error buying AToken:", err);
                setError("Failed to buy AToken. Check console. Ensure you have enough ETH.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter amount of AToken to buy and ensure token price is loaded.");
        }
    };

    // Функция для покупки BToken
    const handleBuyTokensB = async () => {
        if (bTokenContract && amountToBuyB && bTokenPrice !== '0') {
            try {
                setLoading(true);
                setError(null);
                const amountInUnits = ethers.parseUnits(amountToBuyB, await bTokenContract.decimals());
                const ethRequired = ethers.parseUnits(amountToBuyB, 'wei') * BigInt(bTokenPrice); // Total ETH in wei

                const tx = await bTokenContract.buyTokens(amountInUnits, { value: ethRequired });
                await tx.wait();
                alert(`Successfully bought ${amountToBuyB} BToken!`);
                setAmountToBuyB('');
                fetchContractData();
            } catch (err) {
                console.error("Error buying BToken:", err);
                setError("Failed to buy BToken. Check console. Ensure you have enough ETH.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter amount of BToken to buy and ensure token price is loaded.");
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>TokenSwap DApp</h1>

                {!walletConnected ? (
                    <button onClick={connectWallet} disabled={loading}>
                        {loading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                ) : (
                    <div>
                        <p>Wallet Connected: {userAddress}</p>
                        {loading && <p>Loading...</p>}
                        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                        <h2>Contract Info</h2>
                        <p>Contract Admin: {contractAdminAddress} {isAdmin && "(You are Admin)"}</p>
                        <p>Current Ratio (A to B): {ratio}</p>
                        <p>Current Fees: {fees}%</p>
                        <p>Your AToken Balance: {userBalanceA}</p>
                        <p>Your BToken Balance: {userBalanceB}</p>
                        <p>AToken Allowance for Swap: {aTokenAllowance}</p>
                        <p>BToken Allowance for Swap: {bTokenAllowance}</p>
                        <p>AToken Price (per token in wei): {aTokenPrice}</p>
                        <p>BToken Price (per token in wei): {bTokenPrice}</p>


                        <hr />

                        {isAdmin && ( // Отображаем админ-контролы только если пользователь - админ
                            <>
                                <h3>Admin Controls</h3>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Set New Ratio"
                                        value={newRatioInput}
                                        onChange={(e) => setNewRatioInput(e.target.value)}
                                    />
                                    <button onClick={handleSetRatio} disabled={loading}>
                                        Set Ratio
                                    </button>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Set New Fees (%)"
                                        value={newFeesInput}
                                        onChange={(e) => setNewFeesInput(e.target.value)}
                                    />
                                    <button onClick={handleSetFees} disabled={loading}>
                                        Set Fees
                                    </button>
                                </div>
                                <hr />
                            </>
                        )}

                        <h3>Buy Tokens</h3>
                        <div>
                            <input
                                type="number"
                                placeholder="Amount of AToken to buy"
                                value={amountToBuyA}
                                onChange={(e) => setAmountToBuyA(e.target.value)}
                            />
                            <button onClick={handleBuyTokensA} disabled={loading}>
                                Buy AToken
                            </button>
                        </div>
                        <div>
                            <input
                                type="number"
                                placeholder="Amount of BToken to buy"
                                value={amountToBuyB}
                                onChange={(e) => setAmountToBuyB(e.target.value)}
                            />
                            <button onClick={handleBuyTokensB} disabled={loading}>
                                Buy BToken
                            </button>
                        </div>

                        <hr />

                        <h3>Swap Tokens</h3>
                        <div>
                            <h4>Swap AToken for BToken</h4>
                            <input
                                type="number"
                                placeholder="Amount of AToken"
                                value={amountToSwapA}
                                onChange={(e) => setAmountToSwapA(e.target.value)}
                            />
                            <button onClick={() => handleApprove(aTokenContract, amountToSwapA, TOKEN_SWAP_ADDRESS, "AToken")} disabled={loading}>
                                Approve AToken
                            </button>
                            <button onClick={handleSwapTKA} disabled={loading}>
                                Swap A &#8594; B
                            </button>
                        </div>
                        <div>
                            <h4>Swap BToken for AToken</h4>
                            <input
                                type="number"
                                placeholder="Amount of BToken"
                                value={amountToSwapB}
                                onChange={(e) => setAmountToSwapB(e.target.value)}
                            />
                            <button onClick={() => handleApprove(bTokenContract, amountToSwapB, TOKEN_SWAP_ADDRESS, "BToken")} disabled={loading}>
                                Approve BToken
                            </button>
                            <button onClick={handleSwapTKB} disabled={loading}>
                                Swap B &#8594; A
                            </button>
                        </div>
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;
