# 🚀 Remix-Practice: Solidity Smart Contract Portfolio

## About Me

Hello! I am **Margarita**, a goal-oriented Solidity developer deeply passionate about building reliable and secure decentralized applications. This repository serves as a comprehensive portfolio of my smart contract development projects.

My experience covers the full development lifecycle:

- from concept and writing code from scratch
- to thorough unit testing, deployment, and basic frontend integration.

I successfully implement projects both as personal initiatives and on a freelance basis, demonstrating an ability to adapt to diverse requirements.

🛠️ Tools I use:

- **Hardhat**, **Remix IDE**
- **OpenZeppelin** (ERC-20, Ownable, ReentrancyGuard, SafeMath)

🎯 My goal is to become a valuable team member where I can continue to grow, develop, and contribute to innovative Web3 solutions.

---

## 🔧 Technical Stack

### 🧱 Blockchain & Smart Contracts

- **Solidity**: 0.8.x, Hardhat, Remix IDE, VS Code
- **Frameworks and Libraries**: OpenZeppelin (ERC-20, Ownable, ReentrancyGuard, SafeMath), Vite
- **Testing**: Mocha, Chai, Solidity-coverage (high code coverage)
- **Tools**: Ethers.js (basic), MetaMask
- **Security**: `require()`, `modifier`, `ReentrancyGuard`, `view/pure`, `calldata`
- **Contract Types**: ERC-20, AMM, donation systems, booking logic, Events, Interfaces

### 💻 Other Languages & Tools

- **JavaScript**: tests, frontend, backend for dApp
- **Java**: Java 17, OOP, Maven
- **General Tools**: Git, GitHub, npm, Node.js, VS Code, IntelliJ IDEA, Docker, MongoDB

---

## 📦 Projects

### 1. 💰 AMM (Automated Market Maker)

**Description:**
Implementation of a basic Automated Market Maker model (similar to Uniswap v1) for swapping two ERC-20 tokens (CoinA and CoinB) based on liquidity pools.

**Key Functions:**

- `addLiquidity(uint amountA, uint amountB)`
- `removeLiquidity()`
- `swap(address from, address to, uint amount)`
- `getReserves()`
- `getPrice()`

**Security and Testing:**
Uses `ReentrancyGuard`, internal `require()` checks, and logic without external `transfer` until the end of the transaction. Unit test coverage is high.

🔗 **Project Link:**
[ERC20/AMM.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/AMM.sol)

---

### 2. 🪙 ERC-20 Tokens (CoinA and CoinB)

**Description:**
Custom ERC-20 tokens with logic for minting, burning, transfer delegation rights, and limits.

**Key Functions:**

- `constructor()`
- `mint()`, `burn()`
- `approve()`, `transferFrom()`
- `balanceOf()`

**Security and Testing:**
Inheritance from `Ownable`, `ERC20Burnable`. Uses `require()` and `SafeMath`. Unit tests with high coverage.

🔗 **Project Link:**
[ERC20/TokenSwap.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/TokenSwap.sol)

---

### 3. 📚 "Book Reservation Library" Smart Contract

**Description:**
A decentralized system for managing book reservations, allowing users to add books, reserve, return, and cancel reservations.

**Key Functions:**

- `addBook(string memory title)`
- `book(uint bookId)`
- `cancelBooking(uint bookId)`
- `returnBook(uint bookId)`
- `getAvailableBooks()`
- `getBookedBooks()`

**Security and Testing:**
Owner control (`Ownable`), `require()` for action validation (preventing double reservations, incorrect returns/cancellations). Unit tests — high coverage.

🔗 **Project Link:**
[LibraryStorage.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/LibraryStorage.sol)

---

### 4. 🎁 Donation System (DonationEventLog)

**Description:**
A contract for accepting donations with logging and tracking the amount received from each user.

**Key Functions:**

- `donate(string memory _message)`
- `getMyDonation()`, `getAllDonation()`
- `withdrawAll(uint _amount)`

**Security and Testing:**
`onlyOwner`, `require()` checks, high unit test coverage.

**Frontend Implementation with HardHat**

The frontend for interacting with the [DonationEventLog](https://github.com/Margo099/Remix-Practice/blob/main/my-dapp-frontend/src/DonationApp.jsx) contract is implemented using **React + Vite** with **ethers.js**.

### 🔧 Core Functionality:

- 🔗 MetaMask connection
- 💸 Sending donations with a message (in ETH)
- 📜 Viewing the history of all donations (address, amount, message, time)
- 🧮 Displaying the contract balance
- 🔐 Owner withdrawal functionality

### 🛠️ Technologies Used:

- `React` (hooks, component state)
- `ethers.js` — for contract interaction
- `MetaMask` — user account provider
- `Vite` — for fast project startup
- `CSS` — basic styling

### 🚀 Running the Project Locally:

1. Ensure a local network is running (e.g., Hardhat)
2. Ensure MetaMask is connected to the correct network
3. Install dependencies and start the frontend:


`npm install`
`npm run dev `

Open http://localhost:5173 in your browser

🔗 **Project Link:**
[DonationEventLog.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/DonationEventLog.sol)

-----

### 5\. 💰 Project Fund (ProjectFund)

**Description:**
A contract for collecting ETH for named projects, tracking individual donations and totals for each project.

**Key Functions:**

  - `donateToProject(string memory _projectName, string memory _message)`
  - `getProjectDonations(string memory _projectName)`
  - `getProjectTotal(string memory _projectName)`
  - `withdraw(uint _amount)`

**Security and Testing:**
`onlyOwner`, `receive()`, `fallback()`, `require()`, high test coverage.

🔗 **Project Link:**
[ProjectFund.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/ProjectFund.sol)

-----

## 📊 Code Coverage Report

I pay close attention to code quality and reliability. Smart contracts are thoroughly tested, with a **high percentage of coverage**:

👉 [View Coverage](https://github.com/Margo099/Remix-Practice/blob/main/Coverage)

-----

## 📬 Contacts

  - **Email:** [gooyeontime.gg@gmail.com](mailto:gooyeontime.gg@gmail.com)
  - **Telegram:** [@Margarita\_1F](https://t.me/Margarita_1F)
  - **LinkedIn:** [LinkedIn](https://www.linkedin.com/in/margarita-khrenova-blockchain-developer/)

-----

© 2025 Margarita Khrenova
