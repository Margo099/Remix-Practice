// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract LibraryStorage {
    mapping(uint => address[]) reservations;
    mapping(address => uint) public bookOwner;
    struct Book{
        string bookName;
        address owner;
    }
    Book [] public books;
    event newBookTaken(string indexed bookName, address owner);
    event newBookAdded(string indexed bookName);

    function addBook(string memory _bookName) external {
        books.push(Book({
            bookName: _bookName,
            owner: address(0)
        }));
    
        emit newBookAdded(_bookName);
    }
    function borrowBook(uint bookId) external {
        require(bookId < books.length, "Wrong ID");
        require(books[bookId].owner == address(0), "Book already taken!");
        require(bookOwner[msg.sender] != 1, "U've already taken a book!");
        books[bookId].owner=msg.sender;
        bookOwner[msg.sender]= bookId + 1;
        emit newBookTaken(books[bookId].bookName, msg.sender);
    }
   function returnBook(uint bookId) external {
    require(msg.sender ==books[bookId].owner,"Only owner can return!");
    books[bookId].owner = address(0);
    bookOwner[msg.sender]=0;
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
    function allReservedBooks() external view returns(Book[] memory) {
    uint count = 0;
    for (uint i =0; i < books.length; i++) {
        if(books[i].owner != address(0)){
            count++;
        }
    }
    Book[] memory reservedBooks = new Book[] (count);
    uint index = 0;
    for(uint i = 0; i < books.length; i++){
        reservedBooks[index] = books[i];
        index++;
    }
    return reservedBooks;
    }
    function reserv(uint bookId) external {
        require(books[bookId].owner != address(0), "Book is free to be taken");
        reservations[bookId].push(msg.sender);
    }
    function getMyReservations(uint bookId) external view returns(address[] memory) {
    return reservations[bookId];
    } 
    function cancelReservation(uint bookId) external {
        address[] storage list = reservations[bookId];
        uint length = list.length;
        require(length > 0, "No reservations found!");

        bool found = false;
        for(uint i=0; i < length; i++) {
            if(list[i]== msg.sender){
                for(uint j=i; j<length; j++){
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