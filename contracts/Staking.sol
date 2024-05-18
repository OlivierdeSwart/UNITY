// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "hardhat/console.sol";

contract Staking {
    address public owner;
    Token public token;
    uint256 public tokensStaked;

    uint256 public constant ANNUAL_YIELD = 60; // 60% annual yield
    uint256 public constant SECONDS_IN_YEAR = 365 * 24 * 60 * 60; //31 536 000
    uint256 public constant PRECISION = 1e18;

    struct Participant {
        address user;
        uint256 tokenAmountSatoshi;
        uint256 latestStakeTime;
    }

    event Stake(address indexed customer, uint256 amount_wbnry);
    event Withdraw(address indexed customer, uint256 amount_wbnry);

    address[] public customerAddressesArray;
    mapping(address => Participant) public customerMapping;

    constructor(Token _token) {
        owner = msg.sender;
        token = _token;
        tokensStaked = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "caller must be owner");
        _;
    }

    modifier amountGreaterThanZero(uint256 _tokenAmountSatoshi) {
        require(_tokenAmountSatoshi > 0, "Token amount must be greater than zero");
        _;
    }

    function calculateCurrentBalance(address user) public view returns (uint256) {
        Participant storage participant = customerMapping[user];
        uint256 initialAmount = participant.tokenAmountSatoshi;
        uint256 startTime = participant.latestStakeTime;

        uint256 timeElapsed = block.timestamp - startTime;
        uint256 ratePerSecond = (ANNUAL_YIELD * PRECISION) / SECONDS_IN_YEAR / 100;

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
        token.approve(address(this), _tokenAmountSatoshi);

        require(token.balanceOf(msg.sender) >= _tokenAmountSatoshi, "insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= _tokenAmountSatoshi, "insufficient allowance");

        token.transferFrom(msg.sender, address(this), _tokenAmountSatoshi);

        if (customerMapping[msg.sender].user == address(0)) {
            customerAddressesArray.push(msg.sender);
        }

        Participant storage participant = customerMapping[msg.sender];
        participant.tokenAmountSatoshi = calculateCurrentBalance(msg.sender) + _tokenAmountSatoshi;
        participant.latestStakeTime = block.timestamp;
        participant.user = msg.sender;

        tokensStaked += _tokenAmountSatoshi;

        emit Stake(msg.sender, _tokenAmountSatoshi);
    }

    function withdraw(uint256 _tokenAmountSatoshi) public amountGreaterThanZero(_tokenAmountSatoshi) {
        Participant storage participant = customerMapping[msg.sender];
        uint256 currentBalance = calculateCurrentBalance(msg.sender);

        require(currentBalance >= _tokenAmountSatoshi, "insufficient staked token balance");

        token.transfer(msg.sender, _tokenAmountSatoshi);

        participant.tokenAmountSatoshi = currentBalance - _tokenAmountSatoshi;
        participant.latestStakeTime = block.timestamp;

        tokensStaked -= _tokenAmountSatoshi;

        emit Withdraw(msg.sender, _tokenAmountSatoshi);
    }

    function updateTimestamp(address user, uint256 newTimestamp) public onlyOwner {
        require(customerMapping[user].user != address(0), "User does not exist");
        customerMapping[user].latestStakeTime = newTimestamp;
    }

    function getParticipant(address _customer) public view returns (Participant memory) {
        Participant memory participant = customerMapping[_customer];
        participant.tokenAmountSatoshi = calculateCurrentBalance(_customer);
        return participant;
    }

    function getCustomerAddressesArray() public view returns (address[] memory) {
        return customerAddressesArray;
    }
}
