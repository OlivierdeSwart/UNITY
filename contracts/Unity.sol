// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UNITY is ReentrancyGuard, Pausable, Ownable {
    uint256 public totalTokensLended;
    uint256 public totalBorrowers;
    uint256 public totalTreasuryTokens;

    uint256 public constant SECONDS_IN_MONTH = 30 * 24 * 60 * 60; //2 592 000 seconds

    struct Participant {
        address user;
        uint256 loanStart;
        uint256 loanAmountWei;
        uint256 repaidAmountWei;
        uint256 rewardAmountSatoshi;
        uint256 creditScore;
        bool currentLoanActive;
    }

    address[] public customerAddressesArray;
    mapping(address => Participant) public customerMapping;
    
    constructor() {
        totalTokensLended = 0;
        totalBorrowers = 0;
        totalTreasuryTokens = 0;
    }

    // Modifier to check if no current loan is active for the sender
    modifier whenNoCurrentLoanActive(address _user) {
        require(!customerMapping[_user].currentLoanActive, "Current loan is active.");
        _;
    }

    function startNewLoan() public whenNoCurrentLoanActive(msg.sender) nonReentrant {
        uint256 flatLoanAmountWei = 10 * 10**18; // 10 ETH expressed in wei

        // Logic to start a new loan
        Participant storage participant = customerMapping[msg.sender];
        participant.loanStart = block.timestamp;
        participant.loanAmountWei = flatLoanAmountWei;
        participant.currentLoanActive = true;
        
        // Update global stats
        totalTokensLended += flatLoanAmountWei;
        totalBorrowers += 1;
        
        // Add user to customer addresses array if not already present
        if (participant.user == address(0)) {
            participant.user = msg.sender;
            customerAddressesArray.push(msg.sender);
        }

        // Transfer the loan amount to the borrower
        (bool success, ) = msg.sender.call{value: flatLoanAmountWei}("");
        require(success, "Transfer failed.");
    }



}
