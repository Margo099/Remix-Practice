const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("LibraryStorage", function(){
    let bookId, owner, user, librarystorage, snapshotId;

beforeEach(async function (){
    [owner, user] = await ethers.getSigners();

    const LibraryStorage = await ethers.getContractFactory("LibraryStorage");
    librarystorage = await LibraryStorage.deploy();
    bookId = 0;

    snapshotId = await network.provider.send("evm_snapshot");
});
afterEach(async function(){
await network.provider.send("evm_revert", [snapshotId]);
});
it("should add a book into store", async function (){
    const _bookName = "Test book";

    await librarystorage.connect(user).addBook(_bookName);
    const books = await librarystorage.getAvailableBook();
    expect(books.length).to.equal(1);

    //check the strtuct
    expect(books[0].bookName).to.equal("Test book");
    expect(books[0].owner).to.equal(ethers.ZeroAddress);
    expect(books[0].dueDate).to.be.a("bigint");
});
it("should check the evnt NewBookAdded", async function () {
    const _bookName = "Test book";
    await expect(librarystorage.connect(user).addBook(_bookName)
    ).to.emit(librarystorage, "newBookAdded").withArgs(_bookName, anyValue);
});
it("should check if several books are added into store", async function(){
    await librarystorage.connect(user).addBook("Book 1");
    await librarystorage.connect(user).addBook("Book 2");

    const books = await librarystorage.getAvailableBook();
    expect(books.length).to.equal(2);
});
it("should borrow book", async function(){
    const _bookName = "Test Book";

    //add book firstly
    await librarystorage.connect(user).addBook(_bookName);

    //borrow book
    await  librarystorage.connect(user).borrowBook(bookId);

    //check the requirements
    let books = await librarystorage.getAvailableBook();
    expect(books.length).to.equal(0);
    await expect(librarystorage.connect(owner).borrowBook(bookId)
    ).to.be.revertedWith("Book already taken!");

    const reservedBooks = await librarystorage.getReservedBooks();
    expect(reservedBooks.length).to.equal(1);
    expect(reservedBooks[0].owner).to.equal(user.address);

    const bookIndex = await librarystorage.bookOwner(user.address);
    expect(bookIndex).to.equal(1);
});
it("should check if event newBookTaken is emited", async function() {
    const _bookName = "Test book";
    await librarystorage.connect(user).addBook(_bookName);
    await expect(librarystorage.connect(user).borrowBook(bookId)
    ).to.emit(librarystorage, "newBookTaken").withArgs(_bookName, user.address);
});
it("should auto-assign book to next user in reservation queue", async function() {
    const _bookName = "Test book";
    const [_owner, _user1, _user2, _user3] = await ethers.getSigners();

    //add book firstly
    await librarystorage.connect(_owner).addBook(_bookName);

    //borrow book
    await  librarystorage.connect(_owner).borrowBook(bookId);

    //user1, user2, user3 reserve book
    await librarystorage.connect(_user1).reserveBook(bookId);
    await librarystorage.connect(_user2).reserveBook(bookId);
    await librarystorage.connect(_user3).reserveBook(bookId);

    //owner returns book
    await librarystorage.connect(_owner).returnBook(bookId);

    // check that user1 is new owner of the book
    const book = await librarystorage.books(bookId);
    expect(book.owner).to.equal(_user1.address);

    // check that user1 has the book in bookOwner mapping
    const bookIndex = await librarystorage.bookOwner(_user1.address);
    expect(bookIndex).to.equal(bookId + 1);

    // check that user1 is no longer in reservation list
    const user1Reservations = await librarystorage.getMyReservations(bookId);
    expect(user1Reservations).to.not.include(_user1.address);

    //check that user2 and user3 are still in the reservation line
    const reservationList = await librarystorage.getMyReservations(bookId);
    expect(reservationList).to.include(_user2.address);
    expect(reservationList).to.include(_user3.address);
});
it("should check if newBookReturned is emited", async function() {
    const _bookName = "Test book";
    await librarystorage.connect(user).addBook(_bookName);
    await librarystorage.connect(user).borrowBook(bookId);
    await expect(librarystorage.connect(user).returnBook(bookId)
).to.emit(librarystorage, "newBookReturned").withArgs(_bookName);
});
it("should reserve book", async function() {
    const _bookName = "Test Book";

    //add book firstly
    await librarystorage.connect(owner).addBook(_bookName);

    //borrow book
    await  librarystorage.connect(owner).borrowBook(bookId);

    //reserve book
    let books = await librarystorage.getAvailableBook();
    expect(books.length).to.equal(0);

    await librarystorage.connect(user).reserveBook(bookId);
    //check the requirements
    await expect(librarystorage.connect(user).reserveBook(bookId)
    ).to.be.revertedWith("You have already reserved this book!");

    const reservedBooks = await librarystorage.getReservedBooks();
    expect(reservedBooks.length).to.equal(1);
    expect(reservedBooks[0].owner).to.equal(owner.address);

    const myReservations = await librarystorage.getMyReservations(bookId);
    expect(myReservations.length).to.equal(1);
});
it("should emit the event newReservation", async function() {
    const _bookName = "Test book";
    await librarystorage.connect(owner).addBook(_bookName);

    //borrow book
    await  librarystorage.connect(owner).borrowBook(bookId);

    //reserve book

    await expect(librarystorage.connect(user).reserveBook(bookId)
    ).to.emit(librarystorage, "newReservation").withArgs(_bookName);
    
});
it("should cancel reseravtion", async function (){
    const _bookName = "Test Book";

    //add book firstly
    await librarystorage.connect(owner).addBook(_bookName);

    //borrow book
    await  librarystorage.connect(owner).borrowBook(bookId);

    //reserve book
    let books = await librarystorage.getAvailableBook();
    expect(books.length).to.equal(0);

    await librarystorage.connect(user).reserveBook(bookId);

    const reservedBooks = await librarystorage.getReservedBooks();
    expect(reservedBooks.length).to.equal(1);
    expect(reservedBooks[0].owner).to.equal(owner.address);

    const myReservations = await librarystorage.getMyReservations(bookId);
    expect(myReservations.length).to.equal(1);

    await librarystorage.connect(user).cancelReservation(bookId);
    const updatedReservedBooks = await librarystorage.getReservedBooks();
    await expect(librarystorage.connect(user).cancelReservation(bookId))
    .to.be.revertedWith("No reservations found!");
    const updatedMyReservations = await librarystorage.getMyReservations(bookId);
    expect(updatedReservedBooks.length).to.equal(1);
    expect(updatedMyReservations.length).to.equal(0);
    
});
});