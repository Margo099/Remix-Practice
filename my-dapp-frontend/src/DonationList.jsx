import { useEffect, useState } from "react";
import { getContract } from "./constants/contract";
import { ethers } from "ethers";

export default function DonationList() {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState("0");
  const [account, setAccount] = useState("");
  const [owner, setOwner] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Кошелёк подключен");
      } catch (err) {
        console.error("Ошибка при подключении кошелька:", err);
      }
    } else {
      alert("Пожалуйста, установите MetaMask!");
    }
  };

  const loadDonations = async () => {
    const contract = getContract();
    const list = await contract.getAllDonations();
    setDonations(list);
    const totalEth = await contract.totalDonations();
    setTotal(ethers.utils.formatEther(totalEth));

    const signerAddress = await contract.signer.getAddress();
    const contractOwner = await contract.owner();
    setAccount(signerAddress);
    setOwner(contractOwner);
  };

  useEffect(() => {
    connectWallet().then(loadDonations);
  }, []);

  const handleWithdraw = async () => {
    try {
      if (!withdrawAmount || isNaN(withdrawAmount)) {
        alert("Введите корректную сумму");
        return;
      }
      const contract = getContract();
      const tx = await contract.withdrawAll(ethers.utils.parseEther(withdrawAmount));
      await tx.wait();
      setWithdrawAmount("");
      await loadDonations();
      alert("Вывод выполнен");
    } catch (err) {
      console.error("Ошибка при выводе средств:", err);
      alert("Ошибка: " + (err?.data?.message || err.message));
    }
  };

  //Стили
  const styles = {
    container: {
      maxWidth: "700px",
      margin: "2rem auto",
      padding: "2rem",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 0 15px rgba(0,0,0,0.1)",
      fontFamily: "'Segoe UI', sans-serif",
    },
    heading: {
      fontSize: "1.8rem",
      marginBottom: "1rem",
      textAlign: "center",
    },
    total: {
      fontSize: "1.2rem",
      marginBottom: "2rem",
      textAlign: "center",
    },
    withdrawBox: {
      marginBottom: "2rem",
      padding: "1rem",
      backgroundColor: "#f0f8ff",
      border: "1px solid #d0e6ff",
      borderRadius: "8px",
    },
    input: {
      padding: "0.5rem",
      borderRadius: "6px",
      border: "1px solid #ccc",
      marginRight: "0.5rem",
      width: "160px",
    },
    button: {
      padding: "0.5rem 1.2rem",
      backgroundColor: "#4caf50",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
    donationList: {
      listStyle: "none",
      padding: 0,
    },
    donationItem: {
      padding: "1rem",
      marginBottom: "1rem",
      backgroundColor: "#f9f9f9",
      borderRadius: "6px",
      border: "1px solid #ddd",
    },
    sender: {
      fontWeight: "bold",
      marginBottom: "0.3rem",
    },
    message: {
      margin: "0.3rem 0",
      color: "#555",
    },
    timestamp: {
      fontSize: "0.9rem",
      color: "#999",
    },
  };

  return (
  <div style={styles.container}>
    <h2 style={styles.heading}>📋 История пожертвований</h2>
    <p style={styles.total}>
      Общая сумма: <strong>{total} ETH</strong>
    </p>

    {account && owner && account.toLowerCase() === owner.toLowerCase() && (
      <>
        <h2 style={styles.heading}>💼 Вывод средств (только для владельца)</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="number"
            placeholder="Сумма в ETH"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleWithdraw} style={styles.button}>
            Вывести
          </button>
        </div>
      </>
    )}

    <ul style={styles.donationList}>
      {donations.map((d, i) => (
        <li key={i} style={styles.donationItem}>
          <div style={styles.sender}>{d.sender}</div>
          <div style={styles.message}>💬 {d.message}</div>
          <div style={styles.message}>💰 {ethers.utils.formatEther(d.amount)} ETH</div>
          <div style={styles.timestamp}>
            🕒 {new Date(d.timestamp * 1000).toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
}