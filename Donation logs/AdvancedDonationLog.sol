// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AdvancedDonationLog {
    address public owner;
    struct Donation {
        address sender;
        uint amount;
        string message;
        uint timestamp;
    }

    mapping(address => uint) public totalSent;
    mapping(address => uint) private balance;
    mapping(address => Donation[]) private myDonation;
    Donation[] public donations;
    address[] public donators;

    event NewDonation(address indexed sender, uint amount, string message, uint timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "U must be an owner!");
        _;
    }

    function donate(string memory _message) public payable {
        require(msg.value > 0, "u need to have some ETH");
        totalSent[msg.sender] += msg.value;
        balance[msg.sender] += msg.value;

        Donation memory newDonation = Donation({
            sender: msg.sender,
            amount: msg.value,
            message: _message,
            timestamp: block.timestamp
        });

        donations.push(newDonation);
        donators.push(msg.sender);

        emit NewDonation(msg.sender, msg.value, _message, block.timestamp);
    }

    function getMyDonation() public view returns (uint) {
        return totalSent[msg.sender];
    }

    function getAllDonation() public view returns (Donation[] memory) {
        return donations;
    }

    function withdrawAll(uint _amount) public onlyOwner {
        payable(owner).transfer(_amount);
    }
}