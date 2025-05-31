// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProjectFund {
    function donateToProject(string memory _projectName, string memory _message) external payable;
    function getProjectTotal(string memory _projectName) external view returns (uint);
}