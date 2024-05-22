// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "hardhat/console.sol";

contract Staking {
    address public owner;
    Token public token;
    uint256 public totalTokensStaked;
    uint256 public totalTreasuryTokens;
    uint256 public annualYield;

    uint256 public constant SECONDS_IN_YEAR = 365 * 24 * 60 * 60; //31 536 000
    uint256 public constant PRECISION = 1e18;

    struct Participant {
        address user;
        uint256 latestActionTime;
        uint256 directStakeAmountSatoshi;
        uint256 rewardAmountSatoshi;
    }

    event Stake(address indexed customer, uint256 amount_wbnry);
    event Withdraw(address indexed customer, uint256 amount_wbnry);
    event FundTreasury(address indexed funder, uint256 amount_wbnry);
    event AnnualYieldChanged(uint256 newAnnualYield);

    address[] public customerAddressesArray;
    mapping(address => Participant) public customerMapping;

    constructor(Token _token) {
        owner = msg.sender;
        token = _token;
        totalTokensStaked = 0;
        totalTreasuryTokens = 0;
        annualYield = 60;// 60% annual yield
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "caller must be owner");
        _;
    }

    modifier amountGreaterThanZero(uint256 _tokenAmountSatoshi) {
        require(_tokenAmountSatoshi > 0, "Token amount must be greater than zero");
        _;
    }

    // This function is just for testing purposes
    function calculateCurrentBalanceLinear(address user) public view returns (uint256) {
        Participant storage participant = customerMapping[user];
        uint256 startTime = participant.latestActionTime;
        uint256 initialAmount = participant.directStakeAmountSatoshi + participant.rewardAmountSatoshi;

        uint256 timeElapsed = block.timestamp - startTime;
        uint256 ratePerSecond = (annualYield * PRECISION) / (100 * SECONDS_IN_YEAR);

        // Calculate linear interest with precision
        uint256 accruedInterest = initialAmount * ratePerSecond * timeElapsed / PRECISION;
        uint256 currentBalance = initialAmount + accruedInterest;
        return currentBalance;
    }

    function calculateCurrentBalanceCompound(address user) public view returns (uint256) {
        Participant storage participant = customerMapping[user];
        uint256 startTime = participant.latestActionTime;
        uint256 initialAmount = participant.directStakeAmountSatoshi + participant.rewardAmountSatoshi;

        uint256 timeElapsed = block.timestamp - startTime;
        uint256 ratePerSecond = (annualYield * PRECISION) / SECONDS_IN_YEAR / 100;

        // Compound interest approximation
        uint256 base = PRECISION + ratePerSecond;
        uint256 compoundedAmount = initialAmount;

        while (timeElapsed > 0) {
            if (timeElapsed % 2 == 1) {
                compoundedAmount = compoundedAmount * base / PRECISION;
            }
            base = base * base / PRECISION;
            timeElapsed /= 2;
        }

        return compoundedAmount;
    }

    function stake(uint256 _tokenAmountSatoshi) public amountGreaterThanZero(_tokenAmountSatoshi) {
        Participant storage participant = customerMapping[msg.sender];
        participant.rewardAmountSatoshi += calculateCurrentBalanceCompound(msg.sender) - participant.directStakeAmountSatoshi - participant.rewardAmountSatoshi;

        token.approve(address(this), _tokenAmountSatoshi);

        require(token.balanceOf(msg.sender) >= _tokenAmountSatoshi, "insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= _tokenAmountSatoshi, "insufficient allowance");

        token.transferFrom(msg.sender, address(this), _tokenAmountSatoshi);

        if (customerMapping[msg.sender].user == address(0)) {
            customerAddressesArray.push(msg.sender);
        }

        participant.user = msg.sender;
        participant.latestActionTime = block.timestamp;
        participant.directStakeAmountSatoshi += _tokenAmountSatoshi;

        totalTokensStaked += _tokenAmountSatoshi;

        emit Stake(msg.sender, _tokenAmountSatoshi);
    }

    function withdraw(uint256 _tokenAmountSatoshi) public amountGreaterThanZero(_tokenAmountSatoshi) {

        Participant storage participant = customerMapping[msg.sender];
        participant.rewardAmountSatoshi += calculateCurrentBalanceCompound(msg.sender) - participant.directStakeAmountSatoshi - participant.rewardAmountSatoshi;

        uint256 totalBalance = participant.directStakeAmountSatoshi + participant.rewardAmountSatoshi;
        require(totalBalance >= _tokenAmountSatoshi, "insufficient total token balance");

        // If amount is more than or equal to reward part. Update both totalTokensStaked and totalTreasuryTokens
        if(_tokenAmountSatoshi >= participant.rewardAmountSatoshi) {
        
            require(totalTreasuryTokens >= participant.rewardAmountSatoshi, "insufficient treasury token balance");

            // Transfer total amount
            token.transfer(msg.sender, _tokenAmountSatoshi);
            
            // Update totalTokensStaked and totalTreasuryTokens
            totalTokensStaked -= _tokenAmountSatoshi - participant.rewardAmountSatoshi;
            totalTreasuryTokens -= participant.rewardAmountSatoshi;

            // Update struct
            participant.latestActionTime = block.timestamp;
            participant.directStakeAmountSatoshi -= _tokenAmountSatoshi - participant.rewardAmountSatoshi;
            participant.rewardAmountSatoshi = 0;

            emit Withdraw(msg.sender, _tokenAmountSatoshi);

        // Else only update totalTreasuryTokens part
        } else {
        
            require(totalTreasuryTokens >= _tokenAmountSatoshi, "insufficient treasury token balance");

            // Transfer total amount
            token.transfer(msg.sender, _tokenAmountSatoshi);
            
            // Update totalTokensStaked and totalTreasuryTokens
            totalTreasuryTokens -= _tokenAmountSatoshi;

            // Update struct
            participant.latestActionTime = block.timestamp;
            participant.rewardAmountSatoshi -= _tokenAmountSatoshi;

            emit Withdraw(msg.sender, _tokenAmountSatoshi);
        }
    }

    // This function is just for testing purposes, needs to be removed in production
    function updateTimestamp(address user, uint256 newTimestamp) public onlyOwner {
        require(customerMapping[user].user != address(0), "User does not exist");
        customerMapping[user].latestActionTime = newTimestamp;
    }

    function getParticipant(address _customer) public view returns (Participant memory) { //, uint256
        Participant memory participant = customerMapping[_customer];
        // uint256 currentBalance = calculateCurrentBalanceCompound(_customer);
        return (participant); //, currentBalance
    }

    function getCustomerAddressesArray() public view returns (address[] memory) {
        return customerAddressesArray;
    }

    function fundTreasury(uint256 _tokenAmountSatoshi) public amountGreaterThanZero(_tokenAmountSatoshi) {
        token.approve(address(this), _tokenAmountSatoshi);
        token.transferFrom(msg.sender, address(this), _tokenAmountSatoshi);
        totalTreasuryTokens += _tokenAmountSatoshi;

        emit FundTreasury(msg.sender, _tokenAmountSatoshi);
    }

    function changeAnnualYield(uint256 _newAnnualYield) public onlyOwner {
        for (uint256 i = 0; i < customerAddressesArray.length; i++) {
            address user = customerAddressesArray[i];
            Participant storage participant = customerMapping[user];
            uint256 currentBalance = calculateCurrentBalanceCompound(user);
            participant.rewardAmountSatoshi += currentBalance - participant.directStakeAmountSatoshi - participant.rewardAmountSatoshi;
            participant.latestActionTime = block.timestamp;
        }
        annualYield = _newAnnualYield;
        emit AnnualYieldChanged(_newAnnualYield);
    }
}
