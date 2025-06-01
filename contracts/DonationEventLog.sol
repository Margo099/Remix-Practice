// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DonationEventLog {
    address public owner;

    struct Donation {
        address sender;
        uint amount;
        string message;
        uint timestamp;
    }

    Donation[] public donations;

    event NewDonation(address indexed sender, uint amount, string message, uint timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner!");
        _;
    }

    function donate(string memory _message) public payable {
        require(msg.value > 0, "Need some ETH");

        Donation memory newDonation = Donation({
            sender: msg.sender,
            amount: msg.value,
            message: _message,
            timestamp: block.timestamp
        });

        donations.push(newDonation);

        emit NewDonation(msg.sender, msg.value, _message, block.timestamp);
    }

    function getAllDonations() public view returns (Donation[] memory) {
        return donations;
    }

    function withdrawAll(uint _amount) public onlyOwner {
        require(_amount > 0, "need ETH");
        payable(owner).transfer(_amount);
    }
}