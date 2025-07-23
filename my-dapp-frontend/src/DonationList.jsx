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
    const contractOwner = await contract.owner(); // ✅ вызываем как функцию
    setAccount(signerAddress);
    setOwner(contractOwner);
  };

  useEffect(() => {
    // 👇 сначала подключаем кошелёк
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

  return (
    <div>
      <h2>📋 История пожертвований</h2>
      <p><strong>Общая сумма:</strong> {total} ETH</p>

      {account && owner && account.toLowerCase() === owner.toLowerCase() && (
        <div style={{ margin: "1rem 0" }}>
          <h3>💼 Вывод средств (только для владельца)</h3>
          <input
            type="number"
            placeholder="Сумма в ETH"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button onClick={handleWithdraw}>Вывести</button>
        </div>
      )}

      <ul>
        {donations.map((d, i) => (
          <li key={i}>
            <strong>{d.sender}</strong> отправил {ethers.utils.formatEther(d.amount)} ETH<br />
            💬 {d.message} <br />
            🕒 {new Date(d.timestamp * 1000).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}