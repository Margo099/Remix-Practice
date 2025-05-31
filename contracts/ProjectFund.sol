// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract ProjectFund {
    address public owner;
    struct ProjectDonation{
        string projectName;
        uint amount;
        address sender;
        string message;
        uint timestamp;
    }
    mapping(string => ProjectDonation[]) public projectDonations;
    mapping(string => uint) public projectTotal;
    event newDonation(string indexed projectName, uint amount, address indexed sender, string message, uint timestamp);
    constructor() {
        owner=msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "u need to be an owner!");
        _;
    }
    receive() external payable { 
    }
    fallback() external payable { 
    }
    function donateToProject(string memory _projectName, string memory _message) public payable{
        require(msg.value>0,"u need to have ETH");
        ProjectDonation memory newProjectDonation=ProjectDonation({
            projectName: _projectName,
            amount: msg.value,
            sender: msg.sender,
            message: _message,
            timestamp: block.timestamp
        });
        projectDonations[_projectName].push(newProjectDonation);
        projectTotal[_projectName]+=msg.value;
       emit newDonation(_projectName, msg.value, msg.sender, _message, block.timestamp);
    }
    function getProjectDonations(string memory _projectName) public view returns(ProjectDonation[] memory){
        return(projectDonations[_projectName]);
    }
    function getProjectTotal(string memory _projectName) public view returns(uint) {
        return(projectTotal[_projectName]);
    }
}