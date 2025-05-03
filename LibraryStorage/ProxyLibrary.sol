// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ILibraryStorage.sol";
contract ProxyLibrary {
    ILibraryStorage libraryStorage;
    constructor(address _libraryStorage) {
        libraryStorage = ILibraryStorage(_libraryStorage);
    }
    function borrowBook(uint bookId) external {
        libraryStorage.borrowBook(bookId);
    }
    function returnBook(uint bookId) external {
        libraryStorage.returnBook(bookId);
    }
    function reserveBook(uint bookId) external {
        libraryStorage.reserveBook(bookId);
    }
    function cancelReservation(uint bookId) external {
        libraryStorage.cancelReservation(bookId);
    }
}