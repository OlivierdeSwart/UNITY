// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Unity is ReentrancyGuard, Pausable, Ownable {
    uint256 public totalTokensLended;
    uint256 public totalBorrowers;
    uint256 public totalTreasuryTokens;

    uint256 public constant SECONDS_IN_MONTH = 30 * 24 * 60 * 60; // 2,592,000 seconds

    struct Participant {
        address user;
        uint256 loanStart;
        uint256 loanAmountFlatWei;
        uint256 loanAmountWithInterestWei;
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
        require(
            !customerMapping[_user].currentLoanActive,
            "Current loan is active."
        );
        _;
    }

    receive() external payable {}


function startNewLoan() public whenNoCurrentLoanActive(msg.sender) nonReentrant {
    uint256 loanAmountWei = 10 * 10**18; // 10 ETH expressed in wei

    // Calculate the loan amount with interest (110%)
    uint256 loanAmountWithInterestWei = loanAmountWei + (loanAmountWei / 10);

    // Logic to start a new loan
    Participant storage participant = customerMapping[msg.sender];
    participant.loanStart = block.timestamp;
    participant.loanAmountFlatWei = loanAmountWei;
    participant.loanAmountWithInterestWei = loanAmountWithInterestWei;
    participant.currentLoanActive = true;

    // Update global stats
    totalTokensLended += loanAmountWei;
    totalBorrowers += 1;

    // Add user to customer addresses array if not already present
    if (participant.user == address(0)) {
        participant.user = msg.sender;
        customerAddressesArray.push(msg.sender);
    }

    // Transfer the loan amount to the borrower
    (bool success, ) = msg.sender.call{value: loanAmountWei}("");
    require(success, "Transfer failed.");
}
    function repayInstallment() public payable nonReentrant {
        Participant storage participant = customerMapping[msg.sender];
        require(participant.currentLoanActive, "No active loan to repay.");

        uint256 installmentAmountWei = participant.loanAmountWithInterestWei / 10;
        require(participant.repaidAmountWei + installmentAmountWei <= participant.loanAmountWithInterestWei, "Installment exceeds loan amount with interest.");

        participant.repaidAmountWei += installmentAmountWei;
        participant.creditScore += installmentAmountWei;

        // Transfer the installment amount from the borrower to the contract
        (bool success, ) = address(this).call{value: installmentAmountWei}("");
        require(success, "Installment repayment failed.");

        // Check if the loan is fully repaid
        if (participant.repaidAmountWei >= participant.loanAmountWithInterestWei) {
            participant.currentLoanActive = false;
        }
    }

    function repayEntireLoan() public payable nonReentrant {
        Participant storage participant = customerMapping[msg.sender];
        require(participant.currentLoanActive, "No active loan to repay.");

        uint256 remainingAmountWei = participant.loanAmountWithInterestWei - participant.repaidAmountWei;
        require(remainingAmountWei > 0, "Loan already fully repaid.");

        participant.repaidAmountWei += remainingAmountWei;
        participant.creditScore += remainingAmountWei;
        participant.currentLoanActive = false;

        // Transfer the remaining loan amount from the borrower to the contract
        (bool success, ) = address(this).call{value: remainingAmountWei}("");
        require(success, "Loan repayment failed.");
    }
}
