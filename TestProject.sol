// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IProjectFund.sol";

contract TestProject {
    address public projectFundAddress;

    constructor(address _fundAddress) {
        projectFundAddress = _fundAddress;
    }

    function proxyDonate(string memory _projectName, string memory _message) public payable {
        require(msg.value > 0, "u need to have eth");

        IProjectFund(projectFundAddress).donateToProject{value: msg.value}(_projectName, _message);
    }
    function getProjectTotal(string memory _projectName) public view returns (uint) {
        return IProjectFund.getProjectTotal(_projectName);
    }
}
