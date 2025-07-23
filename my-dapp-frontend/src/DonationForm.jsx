import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "./constants/contract";

export default function DonationForm({ onDonation }) {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");

  const handleDonate = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Введите корректную сумму");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const contract = getContract();

      const tx = await contract.donate(message, {
      value: ethers.utils.parseEther(amount),
      });

      await tx.wait();

      // Если хочешь как-то обработать message — это нужно сделать в контракте!
      setMessage("");
      setAmount("");
      onDonation(); // Обновить список
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Ошибка: " + (err?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>💸 Сделать пожертвование</h2>
      <input
        type="text"
        placeholder="Сообщение (не сохраняется)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        type="number"
        placeholder="Сумма в ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleDonate}>Пожертвовать</button>
    </div>
  );
}
