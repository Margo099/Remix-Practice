import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "./constants/contract";

const styles = {
  form: {
    maxWidth: 400,
    margin: "1rem auto",
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#f9f9f9",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  heading: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "1rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  inputDisabled: {
    background: "#eee",
  },
  button: {
    width: "100%",
    padding: "0.7rem",
    fontSize: "1.1rem",
    border: "none",
    borderRadius: 4,
    backgroundColor: "#4caf50",
    color: "white",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonHover: {
    backgroundColor: "#45a049",
  },
  buttonDisabled: {
    backgroundColor: "#888",
    cursor: "not-allowed",
  },
};

export default function DonationForm({ onDonation }) {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Введите корректную сумму");
      return;
    }

    try {
      setLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const contract = getContract();

      const tx = await contract.donate(message, {
        value: ethers.utils.parseEther(amount),
      });

      await tx.wait();

      setMessage("");
      setAmount("");
      onDonation();
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Ошибка: " + (err?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.form}>
      <h2 style={styles.heading}>💸 Сделать пожертвование</h2>
      <input
        type="text"
        placeholder="Сообщение (не обязательно)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
        style={{ ...styles.input, ...(loading ? styles.inputDisabled : {}) }}
      />
      <input
        type="number"
        placeholder="Сумма в ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
        min="0"
        step="0.001"
        style={{ ...styles.input, ...(loading ? styles.inputDisabled : {}) }}
      />
      <button
        onClick={handleDonate}
        disabled={loading}
        style={{
          ...styles.button,
          ...(loading ? styles.buttonDisabled : {}),
        }}
        onMouseEnter={(e) => {
          if (!loading) e.target.style.backgroundColor = styles.buttonHover.backgroundColor;
        }}
        onMouseLeave={(e) => {
          if (!loading) e.target.style.backgroundColor = styles.button.backgroundColor;
        }}
      >
        {loading ? "Отправка..." : "Пожертвовать"}
      </button>
    </div>
  );
}