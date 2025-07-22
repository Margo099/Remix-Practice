import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DONATION_ABI, DONATION_ADDRESS } from './constants/donationlogABI'; // Убедитесь, что путь правильный
import './App.css'; // Базовые стили Vite

function App() {
    // Состояния для подключения кошелька и общих данных
    const [signer, setSigner] = useState(null);
    const [donationContract, setDonationContract] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [walletConnected, setWalletConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [isOwner, setIsOwner] = useState(false); // Для проверки, является ли пользователь владельцем контракта
    const [contractOwnerAddress, setContractOwnerAddress] = useState(''); // Адрес владельца контракта

    // Состояния для донатов
    const [donationMessage, setDonationMessage] = useState('');
    const [donationAmount, setDonationAmount] = useState(''); // Сумма ETH для доната
    const [allDonations, setAllDonations] = useState([]); // Массив для хранения всех донатов

    // Состояние для вывода ETH
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [contractBalance, setContractBalance] = useState('0'); // Баланс контракта

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

                // Инициализация контракта DonationEventLog
                const contractInstance = new ethers.Contract(DONATION_ADDRESS, DONATION_ABI, currentSigner);
                setDonationContract(contractInstance);

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

    // Функция для получения данных контракта и донатов
    const fetchContractData = async () => {
        if (donationContract && userAddress) {
            try {
                setLoading(true);
                setError(null);

                // Получение адреса владельца контракта
                const ownerAddress = await donationContract.owner({ blockTag: 'latest' });
                setContractOwnerAddress(ownerAddress);
                setIsOwner(userAddress.toLowerCase() === ownerAddress.toLowerCase());

                // Получение всех донатов
                const donationsArray = await donationContract.getAllDonations({ blockTag: 'latest' });
                // Форматируем донаты для удобного отображения
                const formattedDonations = donationsArray.map(donation => ({
                    sender: donation.sender,
                    amount: ethers.formatEther(donation.amount), // Преобразуем wei в ETH
                    message: donation.message,
                    timestamp: new Date(Number(donation.timestamp) * 1000).toLocaleString() // Преобразуем timestamp в читаемую дату
                }));
                setAllDonations(formattedDonations);

                // Получение баланса контракта
                const provider = new ethers.BrowserProvider(window.ethereum);
                const balance = await provider.getBalance(DONATION_ADDRESS);
                setContractBalance(ethers.formatEther(balance)); // Баланс контракта в ETH

            } catch (err) {
                console.error("Error fetching contract data:", err);
                setError("Failed to fetch contract data. Is your Hardhat Network running and contract deployed?");
            } finally {
                setLoading(false);
            }
        }
    };

    // Эффект для автоматической загрузки данных при подключении кошелька
    useEffect(() => {
        let interval;
        if (walletConnected && donationContract && userAddress) {
            fetchContractData();
            interval = setInterval(fetchContractData, 5000); // Обновлять каждые 5 секунд
        }
        return () => {
            if (interval) {
                clearInterval(interval); // Очистка при размонтировании компонента
            }
        };
    }, [walletConnected, donationContract, userAddress]);

    // Функция для отправки доната
    const handleDonate = async () => {
        if (donationContract && donationAmount && donationMessage) {
            try {
                setLoading(true);
                setError(null);
                // Преобразуем сумму ETH из пользовательского ввода в WEI
                const amountInWei = ethers.parseEther(donationAmount); 
                
                // Вызываем функцию donate, отправляя ETH
                const tx = await donationContract.donate(donationMessage, { value: amountInWei });
                await tx.wait(); // Ждем подтверждения транзакции
                alert(`Successfully donated ${donationAmount} ETH!`);
                setDonationAmount('');
                setDonationMessage('');
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error("Error donating:", err);
                setError("Failed to send donation. Check console. Ensure you have enough ETH.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter a message and amount to donate.");
        }
    };

    // Функция для вывода ETH (только для владельца)
    const handleWithdraw = async () => {
        if (donationContract && withdrawAmount && isOwner) {
            try {
                setLoading(true);
                setError(null);
                // Преобразуем сумму ETH для вывода в WEI
                const amountInWei = ethers.parseEther(withdrawAmount);
                
                const tx = await donationContract.withdrawAll(amountInWei);
                await tx.wait();
                alert(`Successfully withdrew ${withdrawAmount} ETH!`);
                setWithdrawAmount('');
                fetchContractData(); // Обновить данные
            } catch (err) {
                console.error("Error withdrawing ETH:", err);
                setError("Failed to withdraw ETH. Check console. Only owner can withdraw, and amount must be valid.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please enter an amount to withdraw and ensure you are the owner.");
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Donation DApp</h1>

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
                        <p>Contract Owner: {contractOwnerAddress} {isOwner && "(You are Owner)"}</p>
                        <p>Contract Balance: {contractBalance} ETH</p>

                        <hr />

                        <h3>Make a Donation</h3>
                        <div>
                            <input
                                type="number"
                                placeholder="Amount (ETH)"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Your message"
                                value={donationMessage}
                                onChange={(e) => setDonationMessage(e.target.value)}
                            />
                            <button onClick={handleDonate} disabled={loading}>
                                Donate
                            </button>
                        </div>

                        <hr />

                        {isOwner && ( // Отображаем контролы вывода только если пользователь - владелец
                            <>
                                <h3>Owner Controls (Withdraw)</h3>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Amount to withdraw (ETH)"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                    />
                                    <button onClick={handleWithdraw} disabled={loading}>
                                        Withdraw ETH
                                    </button>
                                </div>
                                <hr />
                            </>
                        )}

                        <h3>All Donations</h3>
                        {allDonations.length === 0 ? (
                            <p>No donations yet.</p>
                        ) : (
                            <ul>
                                {allDonations.map((donation, index) => (
                                    <li key={index}>
                                        <strong>From:</strong> {donation.sender}<br />
                                        <strong>Amount:</strong> {donation.amount} ETH<br />
                                        <strong>Message:</strong> "{donation.message}"<br />
                                        <strong>Date:</strong> {donation.timestamp}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;
