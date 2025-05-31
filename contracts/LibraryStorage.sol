// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract LibraryStorage {
    mapping(uint => address[]) public reservations;
    mapping(address => uint) public bookOwner;
    struct Book{
        string bookName;
        address owner;
        uint dueDate;
    }
    Book [] public books;
    event newBookTaken(string indexed bookName, address owner);
    event newBookAdded(string indexed bookName, uint timestamp);
    event newReservation(string indexed bookName);
    event newBookReturned(string indexed bookName);

    function addBook(string memory _bookName) external {
        books.push(Book({
            bookName: _bookName,
            owner: address(0),
            dueDate: block.timestamp
        }));
    
        emit newBookAdded(_bookName, block.timestamp);
    }
    function borrowBook(uint bookId) external {
        require(bookId < books.length, "Wrong ID");
        require(books[bookId].owner == address(0), "Book already taken!");
        require(bookOwner[msg.sender] ==0, "U've already taken a book!");
        books[bookId].owner=msg.sender;
        bookOwner[msg.sender]= bookId + 1;
        books[bookId].dueDate= block.timestamp + 7 days;

        address[] storage list = reservations[bookId];
    for (uint i = 0; i < list.length; i++) {
        if (list[i] == msg.sender) {
            for (uint j = i; j < list.length - 1; j++) {
                list[j] = list[j + 1];
            }
            list.pop();
            break;
        }
    }
        emit newBookTaken(books[bookId].bookName, msg.sender);
    }
   function returnBook(uint bookId) external {
    require(bookId < books.length, "Wrong ID");
    require(msg.sender ==books[bookId].owner,"Only owner can return!");
    books[bookId].owner = address(0);
    bookOwner[msg.sender]=0;

    address[] storage list = reservations[bookId];
    address nextUser;
    if(list.length>0) {
    nextUser=list[0];
    books[bookId].owner=nextUser;
    bookOwner[nextUser]=bookId+1;
    for(uint i=0; i < list.length-1; i++){
                list[i]=list[i+1];
    }
            list.pop();
        }
        emit newBookReturned(books[bookId].bookName);
   }

    function getAvailableBook() external view returns (Book[] memory) {
        uint count = 0;
        for (uint i = 0; i < books.length; i++) {
            if (books[i].owner == address(0)) {
                count++;
            }
        }
        Book[] memory availableBooks = new Book[](count);
        uint index = 0;
        for (uint i = 0; i < books.length; i++) {
            if (books[i].owner == address(0)) {
                availableBooks[index] = books[i];
                index++;
            }
        }
        return availableBooks;
    }
    function getReservedBooks() external view returns(Book[] memory) {
    uint count = 0;
    for (uint i =0; i < books.length; i++) {
        if(books[i].owner != address(0)){
            count++;
        }
    }
    Book[] memory reservedBooks = new Book[] (count);
    uint index = 0;
    for(uint i = 0; i < books.length; i++){
        if(books[i].owner != address(0)){
        reservedBooks[index] = books[i];
        index++;
    }
    }
    return reservedBooks;
    }
    function reserveBook(uint bookId) external {
        address[] storage list = reservations[bookId];
        require(bookId < books.length, "Wrong ID");
        require(books[bookId].owner != address(0), "Book is free to be taken");
        require(books[bookId].owner != msg.sender);
            for (uint i = 0; i < list.length; i++) {
                if (list[i] == msg.sender) {
                revert("You have already reserved this book!");
                }
            }
        reservations[bookId].push(msg.sender);
        emit newReservation(books[bookId].bookName);
    }

    function getMyReservations(uint bookId) external view returns(address[] memory) {
    return reservations[bookId];
    } 
    function cancelReservation(uint bookId) external {
        address[] storage list = reservations[bookId];
        uint length = list.length;
        require(bookId < books.length, "Wrong ID");
        require(length > 0, "No reservations found!");

        bool found = false;
        for(uint i=0; i < length; i++) {
            if(list[i]== msg.sender){
                for(uint j=i; j<length-1; j++){
                    list[j]= list[j+1];
                }
                list.pop();
                found=true;
                break;
            }
        }
        require(found, "Reservation not found!");
}
}