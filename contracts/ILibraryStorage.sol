// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILibraryStorage {
    function borrowBook(uint bookId) external;
    function returnBook(uint bookId) external;
    function reserveBook(uint bookId) external;
    function cancelReservation(uint bookId) external;
}