# TestProject

## Overview
TestProject is a smart contract that interacts with the **ProjectFund** contract via a proxy. This proxy-based approach allows users to donate to specific projects through the proxy contract without directly interacting with the main contract. It ensures modularity and flexibility in contract interaction.

## Features
- **Proxy Donation Mechanism:** Users donate ETH to specific projects via the proxy contract.
- **Event Logging:** Donations made through the proxy contract are logged via events.
- **Separation of Logic:** The proxy allows the separation of concerns between the proxy and the core donation logic, enabling easier contract upgrades in the future.

## How to Use
1. Deploy the **ProjectFund** contract first. (For example, at address `0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B`)
2. Deploy the **TestProject** contract by passing the **ProjectFund** contract address to the constructor:
   ```solidity
   address projectFundAddress = 0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B;
   TestProject proxy = new TestProject(projectFundAddress);
Call the proxyDonate function, passing the Project Name and Message as arguments. 

## Technologies Used
Solidity 0.8.x
Remix IDE (for development)

## Contract Details
TestProject Contract
The TestProject contract is a proxy that allows users to make donations to specific projects via the ProjectFund contract.

## ProjectFund Contract
The ProjectFund contract is the core contract that handles donations and manages the funds for different projects.

## Functions
proxyDonate(string memory _projectName, string memory _message)
Allows users to donate ETH to a project through the proxy. Donations are forwarded to the ProjectFund contract, and an event is emitted for tracking.

donateToProject(string memory _projectName, string memory _message)
Allows users to donate ETH to a specific project and leave a message. Donations are recorded on the blockchain.

getProjectDonations(string memory _projectName)
Returns a list of donations for a given project.

getProjectTotal(string memory _projectName)
Returns the total amount of donations received by the project.

## Future Improvements
Upgradeable Proxy: Implement the ability for the proxy contract to interact with newer versions of the ProjectFund contract.

Frontend Integration: Create a frontend interface for users to easily interact with the proxy contract.

Enhanced Features: Add support for more advanced features such as refund policies, project goals, and milestones.

Author
Margarita (GitHub: Margo099)