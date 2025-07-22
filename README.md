# 🚀 Remix-Practice: Портфолио Смарт-Контрактов на Solidity

## Обо мне

Привет! Я **Маргарита**, целеустремлённый Solidity-разработчик, глубоко увлечённый созданием надёжных и безопасных децентрализованных приложений.  
Этот репозиторий служит комплексным портфолио моих проектов в области разработки смарт-контрактов.

Мой опыт охватывает полный жизненный цикл разработки:
- от концепции и написания кода с нуля
- до тщательного юнит-тестирования, деплоя и базовой интеграции с фронтендом.

Я успешно реализую проекты как в рамках личных инициатив, так и на фрилансе, демонстрируя способность адаптироваться к различным требованиям.

🛠️ Использую инструменты:
- **Hardhat**, **Remix IDE**
- **OpenZeppelin** (ERC-20, Ownable, ReentrancyGuard, SafeMath)

🎯 Моя цель — стать ценным участником команды, где смогу продолжать расти, развиваться и вносить вклад в инновационные Web3-решения.

---

## 🔧 Технический стек

### 🧱 Блокчейн и Смарт-контракты
- **Solidity**: 0.8.x, Hardhat, Remix IDE, VS Code
- **Фреймворки и Библиотеки**: OpenZeppelin (ERC-20, Ownable, ReentrancyGuard, SafeMath), Vite  
- **Тестирование**: Mocha, Chai, Solidity-coverage (высокое покрытие кода)  
- **Инструменты**: Ethers.js (базово), MetaMask  
- **Безопасность**: `require()`, `modifier`, `ReentrancyGuard`, `view/pure`, `calldata`  
- **Типы контрактов**: ERC-20, AMM, системы пожертвований, логика бронирования, Events, Interfaces

### 💻 Другие языки и инструменты
- **JavaScript**: базовый уровень (тесты, фронт)    
- **Java**: Java 17, ООП, Maven  
- **Общие инструменты**: Git, GitHub, npm, Node.js, VS Code, IntelliJ IDEA

---

## 📦 Проекты

### 1. 💰 AMM (Automated Market Maker)

**Описание:**  
Реализация базовой модели автоматизированного маркет-мейкера (аналог Uniswap v1) для обмена двух ERC-20 токенов (CoinA и CoinB) на основе пулов ликвидности.

**Основные функции:**
- `addLiquidity(uint amountA, uint amountB)`
- `removeLiquidity()`
- `swap(address from, address to, uint amount)`
- `getReserves()`
- `getPrice()`

**Безопасность и Тестирование:**  
Использован `ReentrancyGuard`, внутренние `require()`-проверки, логика без внешнего `transfer` до конца транзакции. Покрытие юнит-тестами — высокое.

🔗 **Ссылка на проект:**  
[ERC20/AMM.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/AMM.sol)

---

### 2. 🪙 ERC-20 Токены (CoinA и CoinB)

**Описание:**  
Кастомные ERC-20 токены с логикой выпуска, сжигания, передачи прав и лимитов.

**Основные функции:**
- `constructor()`
- `mint()`, `burn()`
- `approve()`, `transferFrom()`
- `balanceOf()`

**Безопасность и Тестирование:**  
Наследование `Ownable`, `ERC20Burnable`. Используются `require()` и `SafeMath`. Юнит-тесты с высоким покрытием.

🔗 **Ссылка на проект:**  
[ERC20/TokenSwap.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/TokenSwap.sol)

---

### 3. 📚 Смарт-контракт "Библиотека бронирования книг"

**Описание:**  
Децентрализованная система для управления бронированием книг. Добавление, бронирование, возврат и отмена.

**Основные функции:**
- `addBook(string memory title)`
- `book(uint bookId)`
- `cancelBooking(uint bookId)`
- `returnBook(uint bookId)`
- `getAvailableBooks()`
- `getBookedBooks()`

**Безопасность и Тестирование:**  
Контроль владельца (`Ownable`), `require()` для валидации действий. Юнит-тесты — высокое покрытие.

🔗 **Ссылка на проект:**  
[LibraryStorage.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/LibraryStorage.sol)

---

### 4. 🎁 Система Пожертвований (AdvancedDonationLog)

**Описание:**  
Контракт для приёма пожертвований с логированием и учётом суммы от каждого пользователя.

**Основные функции:**
- `donate(string memory _message)`
- `getMyDonation()`, `getAllDonation()`
- `withdrawAll(uint _amount)`

**Безопасность и Тестирование:**  
`onlyOwner`, `require()`-проверки, высокое покрытие юнит-тестами.

🔗 **Ссылка на проект:**  
[AdvancedDonationLog.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/AdvancedDonationLog.sol)

---

### 5. 💰 Фонд Проектов (ProjectFund)

**Описание:**  
Контракт для сбора ETH на именованные проекты, с учётом индивидуальных пожертвований и итогов по каждому проекту.

**Основные функции:**
- `donateToProject(string memory _projectName, string memory _message)`
- `getProjectDonations(string memory _projectName)`
- `getProjectTotal(string memory _projectName)`
- `withdraw(uint _amount)`

**Безопасность и Тестирование:**  
`onlyOwner`, `receive()`, `fallback()`, `require()`, высокое покрытие тестами.

🔗 **Ссылка на проект:**  
[ProjectFund.sol](https://github.com/Margo099/Remix-Practice/blob/main/contracts/ProjectFund.sol)

---

## 📊 Отчет о покрытии кода

Я уделяю большое внимание качеству и надёжности кода. Смарт-контракты тщательно протестированы, с **высоким процентом покрытия**:

👉 [Смотреть Coverage](https://github.com/Margo099/Remix-Practice/blob/main/Coverage)

---

## 📬 Контакты

- **Email:** [gooyeontime.gg@gmail.com](mailto:gooyeontime.gg@gmail.com)  
- **Telegram:** [@Margarita_1F](https://t.me/Margarita_1F)  
- **LinkedIn:** [LinkedIn](https://www.linkedin.com/in/margarita-khrenova-blockchain-developer/)

---

© 2025 Маргарита Хренова
