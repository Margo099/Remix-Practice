# IProjectFund Interface

The `IProjectFund` interface defines the essential functions for interacting with the `ProjectFund` contract, allowing decentralized applications and other contracts to manage donations securely.

## Overview
The `IProjectFund` interface offers the following functionality:
- Donating ETH to a specified project.
- Retrieving the total amount of ETH donated to each project.

This interface is intended for implementation in the main `ProjectFund` contract, ensuring transparency and security in donations.

## Functions

- **donateToProject**: Allows users to donate ETH to a project and include a personal message.
  - **Parameters**:
    - `string memory _projectName`: Name of the project receiving the donation.
    - `string memory _message`: A custom message accompanying the donation.
  
- **getProjectTotal**: Returns the total amount of ETH donated to a project.
  - **Parameters**:
    - `string memory _projectName`: Name of the project.
  - **Returns**:
    - `uint`: Total ETH donated to the specified project.

## Technologies Used
- Solidity

## Author
Margo099

## Example Usage

The following Solidity code demonstrates how to interact with the `ProjectFund` contract via the `IProjectFund` interface:

```solidity
// Example usage of IProjectFund interface to donate to a project
IProjectFund(projectFundAddress).donateToProject{value: 1 ether}("Project A", "Support the cause!");
uint totalDonations = IProjectFund(projectFundAddress).getProjectTotal("Project A");
